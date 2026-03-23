'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Roadmap, RoadmapNode, RoadmapEdge } from '@/types';
import Link from 'next/link'; // This is a mistake in training data, I should use 'next/link'
import { FiArrowLeft, FiSave, FiPlus, FiTrash2, FiInfo, FiLayers, FiCheck } from 'react-icons/fi';
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
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from '@/components/roadmap/CustomNode';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const nodeTypes = { custom: CustomNode };

const nodeColors: Record<string, string> = {
  milestone: '#0f172a', // Slate 900
  topic: '#475569',    // Slate 600
  output: '#2563eb',   // Blue 600
};

type NodeType = 'milestone' | 'topic' | 'output';

import LinkNext from 'next/link';

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
            type: 'custom',
            position: n.position,
            data: { label: n.data.label, description: n.data.description || '', nodeType: n.type },
          }))
        );

        setEdges(
          (data.edges || []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
            style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
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
      setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#cbd5e1', strokeWidth: 1.5 } }, eds)),
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
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: `New ${type}`, description: '', nodeType: type },
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
      alert('Operational failure: could not commit architectural changes.');
    }
    setSaving(false);
  };

  if (loading || fetching) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <FiInfo className="mx-auto text-slate-100 mb-6" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest">Protocol error: blueprint not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-slate-900">
      {/* Architect Terminal Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 z-[10] shadow-sm">
        <div className="flex items-center gap-6">
          <LinkNext href="/roadmaps" className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
            <FiArrowLeft size={18} />
          </LinkNext>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Architect Terminal</p>
            <h1 className="font-display font-black text-slate-900 tracking-tight">{roadmap.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-right-4">
              <FiCheck /> Assets Synchronized
            </div>
          )}
          <button
            onClick={saveRoadmap}
            disabled={saving}
            className="btn-primary flex items-center gap-3 px-8 shadow-xl shadow-primary/20 disabled:opacity-20"
          >
            <FiSave size={16} />
            <span>{saving ? 'Synchronizing...' : 'Save Architecture'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Architectural Canvas */}
        <div className="flex-1 relative bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} color="#e2e8f0" gap={24} size={1} />
            <Controls className="!bg-white !border-slate-100 !shadow-lg !rounded-xl overflow-hidden" />
            <MiniMap className="!bg-white !border-slate-100 !shadow-lg !rounded-xl overflow-hidden" nodeColor={(n) => nodeColors[n.data.nodeType as string] || '#94a3b8'} maskColor="rgba(255,255,255,0.8)" />

            <Panel position="top-left">
              <div className="flex flex-col gap-2 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1 px-1">Inject Module</p>
                <button onClick={() => addNode('milestone')} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all">
                  <FiPlus size={14} /> Milestone
                </button>
                <button onClick={() => addNode('topic')} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200/50">
                  <FiPlus size={14} /> Topic
                </button>
                <button onClick={() => addNode('output')} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100">
                  <FiPlus size={14} /> Output
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Asset Editor Side Panel */}
        <div className={`w-96 bg-white border-l border-slate-100 transition-all duration-500 overflow-y-auto ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedNode ? (
            <div className="p-10">
              <div className="flex items-center gap-3 mb-10">
                <FiLayers className="text-primary" />
                <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">Modify Asset</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="section-label mb-3 block">Module Protocol</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as NodeType)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none text-[10px] font-bold uppercase tracking-widest transition-all appearance-none"
                  >
                    <option value="milestone">Milestone Structure</option>
                    <option value="topic">Technical Topic</option>
                    <option value="output">Portfolio Output</option>
                  </select>
                </div>
                <div>
                  <label className="section-label mb-3 block">Systemic Label</label>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none font-medium text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="section-label mb-3 block">Technical Rationale</label>
                  <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                    <ReactQuill theme="snow" value={editDesc} onChange={setEditDesc} placeholder="Define systemic rationale or resources..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <button onClick={updateSelectedNode} className="btn-primary flex-1 py-3 text-[10px] uppercase">
                    Sync Changes
                  </button>
                  <button onClick={deleteSelectedNode} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white transition-all border border-slate-100">
                    <FiTrash2 size={16} />
                  </button>
                </div>
                <button onClick={() => setSelectedNode(null)} className="w-full py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
                  Cancel Protocol
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center">
              <div>
                <FiLayers className="mx-auto text-slate-50 mb-6" size={48} />
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">Select a module on the canvas to edit its systemic properties.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
