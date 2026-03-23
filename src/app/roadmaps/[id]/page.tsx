'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Roadmap } from '@/types';
import Link from 'next/link';
import { FiEdit3, FiArrowLeft, FiMap, FiInfo, FiLayers } from 'react-icons/fi';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from '@/components/roadmap/CustomNode';

const nodeTypes = { custom: CustomNode };

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
      try {
        const snap = await getDoc(doc(db, 'roadmaps', roadmapId));
        if (snap.exists()) {
          setRoadmap({ id: snap.id, ...snap.data() } as Roadmap);
        }
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchRoadmap();
  }, [appUser, roadmapId]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <FiInfo className="mx-auto text-slate-100 mb-6" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest mb-6">Blueprint not found</p>
        <Link href="/roadmaps" className="btn-primary px-8">Return to Index</Link>
      </div>
    );
  }

  const flowNodes: Node[] = (roadmap.nodes || []).map((n) => ({
    id: n.id,
    type: 'custom',
    position: n.position,
    data: { label: n.data.label, description: n.data.description, nodeType: n.type },
  }));

  const flowEdges: Edge[] = (roadmap.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
  }));

  const canEdit = appUser && (roadmap.createdBy === appUser.uid || appUser.role === 'admin');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-slate-900">
      {/* Navigator Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex items-start gap-6">
          <Link href="/roadmaps" className="mt-1 p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <FiArrowLeft size={18} />
          </Link>
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
               <FiMap className="text-primary" size={12} />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technical Navigation Path</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight leading-tight">
              {roadmap.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 font-black">
                    {roadmap.createdByName?.[0] || 'A'}
                  </div>
                  <span>Authored by {roadmap.createdByName}</span>
               </div>
               <div className="flex items-center gap-2">
                  <FiLayers className="text-primary" />
                  <span>{roadmap.nodes?.length || 0} Structural Nodes</span>
               </div>
            </div>
          </div>
        </div>
        
        {canEdit && (
          <Link
            href={`/roadmaps/${roadmap.id}/edit`}
            className="btn-primary flex items-center gap-3 px-8 shadow-xl shadow-primary/20"
          >
            <FiEdit3 size={16} /> <span>Modify Architecture</span>
          </Link>
        )}
      </div>

      {/* Curriculum Brief */}
      <div className="clean-card p-10 mb-12 border-slate-100 bg-slate-50/30">
        <p className="section-label mb-6">Curriculum Abstract</p>
        <div 
          className="text-sm text-slate-500 font-medium leading-relaxed prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: roadmap.description }}
        />
      </div>

      {/* Structural Navigator Canvas */}
      <div className="clean-card overflow-hidden shadow-2xl shadow-slate-200/50" style={{ height: '75vh' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background variant={BackgroundVariant.Dots} color="#e2e8f0" gap={24} size={1} />
          <Controls className="!bg-white !border-slate-100 !shadow-lg !rounded-xl overflow-hidden" />
          <MiniMap className="!bg-white !border-slate-100 !shadow-lg !rounded-xl overflow-hidden" maskColor="rgba(255,255,255,0.8)" />
        </ReactFlow>
      </div>

      {/* Footer Meta */}
      <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center opacity-50">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Blueprint Registry ID: {roadmap.id}</p>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Platform Structural Asset</p>
      </div>
    </div>
  );
}
