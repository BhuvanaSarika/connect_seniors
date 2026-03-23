import { Handle, Position, NodeProps } from '@xyflow/react';

const nodeColors: Record<string, string> = {
  milestone: '#0f172a', // Slate 900
  topic: '#475569',    // Slate 600
  output: '#2563eb',   // Blue 600
};

export default function CustomNode({ data, selected }: NodeProps) {
  const nodeType = (data.nodeType as string) || 'topic';
  const label = data.label as string;
  const description = data.description as string | undefined;
  const accentColor = nodeColors[nodeType] || nodeColors.topic;

  return (
    <div
      className={`relative group bg-white border-2 px-6 py-4 rounded-2xl shadow-xl transition-all duration-300 min-w-[160px] ${selected
          ? 'border-slate-900 shadow-slate-200/50 scale-105 z-10'
          : 'border-slate-100 hover:border-slate-300 hover:shadow-slate-100/50'
        }`}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-200 !border-2 !border-white !rounded-full -translate-y-1 transition-all group-hover:!bg-slate-900"
      />

      {/* Node Content */}
      <div className="flex flex-col items-center text-center gap-2">
        <div
          className="w-8 h-1 rounded-full mb-1"
          style={{ backgroundColor: accentColor }}
        />
        <div className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-tight">
          {label}
        </div>
        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {nodeType}
        </div>
      </div>

      {/* High-Fidelity Technical Tooltip */}
      {description && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 p-5 bg-slate-900 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] shadow-2xl scale-95 group-hover:scale-100">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
          <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Technical Rationale</p>
          <div
            className="text-[11px] font-medium leading-relaxed text-slate-300 ql-editor !p-0 !min-h-0"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-200 !border-2 !border-white !rounded-full translate-y-1 transition-all group-hover:!bg-slate-900"
      />
    </div>
  );
}
