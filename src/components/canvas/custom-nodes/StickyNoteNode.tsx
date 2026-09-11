import React from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { StickyNote, Lock, Pin } from 'lucide-react';

const STICKY_COLORS: Record<string, { bg: string; border: string; text: string; header: string }> = {
  yellow: { bg: '#FEF9C3', border: '#FDE047', text: '#713F12', header: '#FEF08A' },
  blue: { bg: '#E0F2FE', border: '#7DD3FC', text: '#0C4A6E', header: '#BAE6FD' },
  green: { bg: '#DCFCE7', border: '#86EFAC', text: '#14532D', header: '#BBF7D0' },
  pink: { bg: '#FCE7F3', border: '#F472B6', text: '#831843', header: '#FBCFE8' },
  purple: { bg: '#F3E8FF', border: '#C084FC', text: '#581C87', header: '#E9D5FF' },
};

export const StickyNoteNode: React.FC<NodeProps<any>> = ({ id, data, selected }) => {
  const { updateNodeData } = useCanvasStore();
  const colorKey = (data?.customBgColor as string) || 'yellow';
  const colorScheme = STICKY_COLORS[colorKey] || STICKY_COLORS.yellow;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { description: e.target.value });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { title: e.target.value });
  };

  const cycleColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const keys = Object.keys(STICKY_COLORS);
    const currentIndex = keys.indexOf(colorKey);
    const nextKey = keys[(currentIndex + 1) % keys.length];
    updateNodeData(id, { customBgColor: nextKey });
  };

  return (
    <div
      style={{
        backgroundColor: colorScheme.bg,
        borderColor: selected ? '#0284C7' : colorScheme.border,
        color: colorScheme.text,
        boxShadow: selected
          ? '0 10px 25px -5px rgba(2, 132, 199, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          : '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
      }}
      className={`relative rounded-xl border-2 p-3 w-56 min-h-[140px] flex flex-col justify-between transition-all select-text group ${
        data?.isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Target/Source handles for optional connection */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 !border-white !opacity-0 group-hover:!opacity-80 transition-opacity"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-black/10 mb-1.5">
        <div className="flex items-center space-x-1.5 flex-1 mr-2">
          <button
            onClick={cycleColor}
            className="w-4 h-4 rounded-full border border-black/20 hover:scale-110 transition-transform shrink-0"
            style={{ backgroundColor: colorScheme.border }}
            title="Cambiar color del post-it"
          />
          <input
            type="text"
            value={data?.title || 'Nota / Comentario'}
            onChange={handleTitleChange}
            placeholder="Título de la nota..."
            className="text-xs font-bold bg-transparent border-none focus:outline-none w-full truncate placeholder-black/40"
            style={{ color: colorScheme.text }}
          />
        </div>

        <div className="flex items-center space-x-1 text-[10px] font-mono opacity-70">
          {data?.isLocked ? <Lock className="w-3 h-3 text-rose-600" /> : <Pin className="w-3 h-3 text-amber-700" />}
        </div>
      </div>

      {/* Body Textarea */}
      <textarea
        value={data?.description || ''}
        onChange={handleTextChange}
        placeholder="Escribe un comentario, hallazgo o recordatorio de auditoría..."
        className="w-full flex-1 bg-transparent text-xs leading-relaxed resize-none focus:outline-none border-none placeholder-black/40"
        style={{ color: colorScheme.text, minHeight: '68px' }}
      />

      {/* Footer / Author */}
      <div className="pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px] font-mono opacity-75">
        <span className="truncate max-w-[120px]">{data?.roleName || 'Auditor / Analista'}</span>
        <span>{data?.standardId || 'POST-IT'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-400 !border-white !opacity-0 group-hover:!opacity-80 transition-opacity"
      />
    </div>
  );
};
