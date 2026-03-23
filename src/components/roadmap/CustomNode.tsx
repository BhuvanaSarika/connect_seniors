import { Handle, Position, NodeProps } from '@xyflow/react';

const nodeColors: Record<string, string> = {
  milestone: '#2148ba', // primary
  topic: '#5a7be0',     // primary-light
  output: '#f59e0b',    // accent
};

export default function CustomNode({ data, selected }: NodeProps) {
  const nodeType = (data.nodeType as string) || 'topic';
  const label = data.label as string;
  const description = data.description as string | undefined;
  const bgColor = nodeColors[nodeType] || nodeColors.topic;

  return (
    <div
      className={`relative group px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all ${
        selected ? 'ring-4 ring-accent ring-offset-2 scale-105' : 'hover:scale-105'
      }`}
      style={{ backgroundColor: bgColor }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white !w-3 !h-3 !border-2" style={{ borderColor: bgColor }} />
      
      <div className="text-center">{label}</div>
      
      {/* Tooltip on hover if description exists */}
      {description && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 p-3 bg-gray-900 text-white text-xs font-normal leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-solid after:border-[6px] after:border-transparent after:border-b-gray-900">
          <div className="prose prose-sm prose-invert max-w-none break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-white !w-3 !h-3 !border-2" style={{ borderColor: bgColor }} />
    </div>
  );
}
