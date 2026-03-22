'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Roadmap } from '@/types';
import Link from 'next/link';
import { FiEdit3, FiArrowLeft } from 'react-icons/fi';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeColors: Record<string, string> = {
  milestone: '#2148ba',
  topic: '#5a7be0',
  output: '#f59e0b',
};

export default function RoadmapViewPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roadmapId = params.id as string;

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser || !roadmapId) return;
    const fetchRoadmap = async () => {
      const snap = await getDoc(doc(db, 'roadmaps', roadmapId));
      if (snap.exists()) {
        setRoadmap({ id: snap.id, ...snap.data() } as Roadmap);
      }
      setFetching(false);
    };
    fetchRoadmap();
  }, [appUser, roadmapId]);

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!roadmap) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg">Roadmap not found</p>
        <Link href="/roadmaps" className="text-primary hover:underline mt-4 inline-block">Back to Roadmaps</Link>
      </div>
    );
  }

  const flowNodes: Node[] = (roadmap.nodes || []).map((n) => ({
    id: n.id,
    type: 'default',
    position: n.position,
    data: { label: n.data.label },
    style: {
      background: nodeColors[n.type] || '#5a7be0',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: 600,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  }));

  const flowEdges: Edge[] = (roadmap.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: '#a9b8f5', strokeWidth: 2 },
  }));

  const canEdit = appUser && (roadmap.createdBy === appUser.uid || appUser.role === 'admin');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/roadmaps" className="p-2 rounded-lg hover:bg-muted/20 text-primary">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">{roadmap.title}</h1>
            <p className="text-sm text-gray-500">{roadmap.description} · By {roadmap.createdByName}</p>
          </div>
        </div>
        {canEdit && (
          <Link
            href={`/roadmaps/${roadmap.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            <FiEdit3 size={16} /> Edit
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-muted/20 overflow-hidden" style={{ height: '70vh' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
          <MiniMap nodeColor={(n) => n.style?.background as string || '#5a7be0'} />
        </ReactFlow>
      </div>
    </div>
  );
}
