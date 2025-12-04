import React, { useRef, useState } from 'react';
import { Upload, FileImage, Layers } from 'lucide-react';

interface DropZoneProps {
  onImageSelected: (files: File[]) => void;
  className?: string;
  compact?: boolean;
  multiple?: boolean;
  text?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ 
  onImageSelected, 
  className = "", 
  compact = false, 
  multiple = false,
  text
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to Array
      const files = Array.from(e.dataTransfer.files);
      onImageSelected(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onImageSelected(files);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer flex flex-col items-center justify-center 
        rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-slate-700 bg-slate-900/50 hover:border-indigo-400/50 hover:bg-slate-800/50'
        }
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      
      <div className={`flex flex-col items-center gap-3 text-slate-400 group-hover:text-indigo-400 transition-colors ${compact ? 'p-4' : 'p-8'}`}>
        <div className={`
            rounded-full bg-slate-900 shadow-xl ring-1 ring-white/10 group-hover:ring-indigo-500/50 transition-all duration-500
            ${compact ? 'p-2' : 'p-4'}
            ${isDragging ? 'scale-110' : ''}
        `}>
            {multiple ? (
                 <Layers className={compact ? "w-5 h-5" : "w-8 h-8"} />
            ) : (
                 isDragging ? <FileImage className={compact ? "w-5 h-5" : "w-8 h-8"} /> : <Upload className={compact ? "w-5 h-5" : "w-8 h-8"} />
            )}
        </div>
        {!compact && (
            <div className="text-center space-y-1">
            <p className="text-sm font-medium text-slate-200">
                {text || (isDragging ? 'Drop File' : (multiple ? 'Upload Frames' : 'Upload Sprite Sheet'))}
            </p>
            <p className="text-[10px] text-slate-500 font-mono uppercase">
                {multiple ? 'Drop multiple images' : 'Or Paste (Ctrl+V)'}
            </p>
            </div>
        )}
        {compact && <span className="text-xs font-mono text-slate-500 uppercase">Input</span>}
      </div>
    </div>
  );
};

export default DropZone;