import React from 'react';

export interface NodeProps {
  id: string;
  title: string;
  x: number;
  y: number;
  width?: number;
  color?: string;
  children: React.ReactNode;
  onDragStart: (id: string, e: React.PointerEvent) => void;
  inputs?: { id: string; color?: string; label?: string }[];
  outputs?: { id: string; color?: string; label?: string }[];
}

export const Node: React.FC<NodeProps> = ({ 
  id, title, x, y, width = 320, color = 'bg-slate-700', 
  children, onDragStart, inputs = [], outputs = []
}) => {
  return (
    <div 
      className="absolute flex flex-col rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-700/50 overflow-visible group"
      style={{ 
        transform: `translate(${x}px, ${y}px)`, 
        width: `${width}px` 
      }}
    >
      {/* Header */}
      <div 
        onPointerDown={(e) => onDragStart(id, e)}
        className={`
            h-8 ${color} rounded-t-lg flex items-center px-3 cursor-grab active:cursor-grabbing select-none border-b border-white/5
            shadow-sm z-10 shrink-0
        `}
      >
        <div className="w-2 h-2 rounded-full bg-white/20 mr-2" />
        <span className="text-xs font-bold text-white/90 uppercase tracking-wide truncate">{title}</span>
      </div>

      {/* Body - STOP PROPAGATION HERE TO ENABLE CLICKING BUTTONS */}
      <div 
        className="bg-[#1a1a1a] rounded-b-lg p-3 text-slate-200 min-h-[100px] flex flex-col relative z-0 cursor-auto"
        onPointerDown={(e) => e.stopPropagation()} 
      >
        {children}
      </div>

      {/* Input Connectors */}
      {inputs.map((input, idx) => (
         <div 
            key={input.id} 
            className="absolute left-0 w-3 h-3 -ml-1.5 rounded-full bg-[#1a1a1a] border border-slate-500 z-20 flex items-center justify-center hover:scale-125 transition-transform cursor-crosshair"
            style={{ top: `${44 + (idx * 24)}px` }}
            title={input.label}
         >
            <div className={`w-1.5 h-1.5 rounded-full ${input.color || 'bg-slate-400'}`} />
         </div>
      ))}

      {/* Output Connectors */}
      {outputs.map((output, idx) => (
         <div 
            key={output.id} 
            className="absolute right-0 w-3 h-3 -mr-1.5 rounded-full bg-[#1a1a1a] border border-slate-500 z-20 flex items-center justify-center hover:scale-125 transition-transform cursor-crosshair"
            style={{ top: `${44 + (idx * 24)}px` }}
            title={output.label}
         >
            <div className={`w-1.5 h-1.5 rounded-full ${output.color || 'bg-slate-400'}`} />
         </div>
      ))}
    </div>
  );
};