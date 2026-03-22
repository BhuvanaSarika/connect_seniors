'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Roadmap, RoadmapNode, RoadmapEdge } from '@/types';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeColors: Record<string, string> = {
  milestone: '#2148ba',
  topic: '#5a7be0',
  output: '#f59e0b',
};

type NodeType = 'milestone' | 'topic' | 'output';

export default function RoadmapEditPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roadmapId = params.id as string;

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [fetching, setFetching] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Edit panel
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<NodeType>('topic');

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser || !roadmapId) return;
    const fetchRoadmap = async () => {
      const snap = await getDoc(doc(db, 'roadmaps', roadmapId));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Roadmap;
        setRoadmap(data);

        setNodes(
          (data.nodes || []).map((n) => ({
            id: n.id,
            type: 'default',
            position: n.position,
            data: { label: n.data.label, description: n.data.description || '', nodeType: n.type },
            style: {
              background: nodeColors[n.type] || '#5a7be0',
              color: 'white',
              border: selectedNode === n.id ? '3px solid #f59e0b' : 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
            },
          }))
        );

        setEdges(
          (data.edges || []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
            style: { stroke: '#a9b8f5', strokeWidth: 2 },
          }))
        );
      }
      setFetching(false);
    };
    fetchRoadmap();
  }, [appUser, roadmapId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#a9b8f5', strokeWidth: 2 } }, eds)),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    setEditLabel(node.data.label as string);
    setEditDesc((node.data.description as string) || '');
    setEditType((node.data.nodeType as NodeType) || 'topic');
  }, []);

  const addNode = (type: NodeType) => {
    const id = `node_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: `New ${type}`, description: '', nodeType: type },
      style: {
        background: nodeColors[type],
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
      },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const updateSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNode
          ? {
              ...n,
              data: { ...n.data, label: editLabel, description: editDesc, nodeType: editType },
              style: { ...n.style, background: nodeColors[editType] },
            }
          : n
      )
    );
    setSelectedNode(null);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
  };

  const saveRoadmap = async () => {
    if (!roadmap) return;
    setSaving(true);
    try {
      const roadmapNodes: RoadmapNode[] = nodes.map((n) => ({
        id: n.id,
        type: (n.data.nodeType as RoadmapNode['type']) || 'topic',
        position: n.position,
        data: {
          label: n.data.label as string,
          description: (n.data.description as string) || '',
        },
      }));
      const roadmapEdges: RoadmapEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));
      await updateDoc(doc(db, 'roadmaps', roadmap.id), {
        nodes: roadmapNodes,
        edges: roadmapEdges,
        updatedAt: Timestamp.now(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!roadmap) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><p className="text-gray-400">Roadmap not found</p></div>;
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-muted/20">
        <div className="flex items-center gap-3">
          <Link href="/roadmaps" className="p-2 rounded-lg hover:bg-muted/20 text-primary">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="font-bold text-primary-dark">{roadmap.title}</h1>
          <span className="text-xs text-gray-400">Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveRoadmap}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary text-white hover:bg-primary-dark'
            } disabled:opacity-60`}
          >
            <FiSave size={16} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls />
            <MiniMap nodeColor={(n) => n.style?.background as string || '#5a7be0'} />
            <Panel position="top-left">
              <div className="flex gap-2 bg-white rounded-xl shadow-lg p-2 border border-muted/20">
                <button onClick={() => addNode('milestone')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark">
                  <FiPlus size={14} /> Milestone
                </button>
                <button onClick={() => addNode('topic')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-light text-white text-xs font-semibold hover:bg-primary">
                  <FiPlus size={14} /> Topic
                </button>
                <button onClick={() => addNode('output')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-bg-dark text-xs font-semibold hover:bg-yellow-500">
                  <FiPlus size={14} /> Output
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Edit Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-muted/20 p-6 overflow-y-auto">
            <h3 className="font-bold text-primary-dark mb-4">Edit Node</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as NodeType)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm bg-bg-light"
                >
                  <option value="milestone">Milestone</option>
                  <option value="topic">Topic</option>
                  <option value="output">Output</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm bg-bg-light"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm bg-bg-light"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={updateSelectedNode} className="flex-1 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark">
                  Update
                </button>
                <button onClick={deleteSelectedNode} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
