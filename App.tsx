
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Wand2, 
  RotateCw,
  Image as ImageIcon,
  FileVideo,
  FileImage,
  Layers,
  Grid3X3,
  Download,
  Trash2,
  FolderInput,
  Zap,
  Coins,
  PersonStanding,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Lock,
  Maximize2
} from 'lucide-react';
import DropZone from './components/DropZone';
import SpriteViewer from './components/SpriteViewer';
import { Node } from './components/Node';
import { SpriteConfig } from './types';
import { analyzeSpriteSheet } from './services/gemini';
import { generateGif, generateApng, generateWebM, generateWebP } from './services/exporters';

// --- Constants ---
const GRID_PATTERN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7cwxAQAAAMKg9U9tCy8YYM0ADYiIqBoaP2QAvwU/61QAAAAASUVORK5CYII=";

// --- Generators ---

const generateCoinSprite = (): { data: string, config: SpriteConfig } => {
    const w = 32;
    const h = 32;
    const cols = 6;
    const canvas = document.createElement('canvas');
    canvas.width = w * cols;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { data: '', config: { rows: 1, cols: 6, totalFrames: 6, fps: 10, scale: 8, transparent: null } };
    
    for (let i = 0; i < cols; i++) {
        const offset = i * w;
        const angle = (i / cols) * Math.PI;
        const coinWidth = 12 * Math.max(0.1, Math.abs(Math.cos(angle)));
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(offset + 16, 28, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24'; 
        ctx.strokeStyle = '#B45309'; 
        ctx.lineWidth = 2;
        
        const yBounce = Math.abs(Math.sin(angle * 2)) * 4;

        ctx.beginPath();
        ctx.ellipse(offset + 16, 16 - yBounce, coinWidth, 12, 0, 0, Math.PI * 2); 
        ctx.fill();
        ctx.stroke();
        
        if (coinWidth > 4) {
            ctx.fillStyle = '#FEF3C7'; 
            ctx.beginPath();
            ctx.ellipse(offset + 16, 14 - yBounce, coinWidth * 0.6, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (coinWidth > 8) {
             ctx.fillStyle = '#B45309';
             ctx.font = 'bold 16px sans-serif';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('$', offset + 16, 17 - yBounce, coinWidth);
        }
    }
    return {
        data: canvas.toDataURL(),
        config: { rows: 1, cols: 6, totalFrames: 6, fps: 10, scale: 8, transparent: null }
    };
};

const generateRunnerSprite = (): { data: string, config: SpriteConfig } => {
    const w = 32;
    const h = 32;
    const cols = 8;
    const canvas = document.createElement('canvas');
    canvas.width = w * cols;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if(!ctx) return { data: '', config: { rows: 1, cols: 8, totalFrames: 8, fps: 12, scale: 8, transparent: null } };

    for(let i=0; i<cols; i++) {
        const offset = i * w;
        const cx = offset + 16;
        const cy = 16;
        
        // Bobbing effect
        const bounce = Math.abs(Math.sin(i * Math.PI / 4)) * 2;
        
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 6 - bounce, 3, 0, Math.PI*2);
        ctx.stroke();
        
        // Body
        ctx.beginPath();
        ctx.moveTo(cx, cy - 3 - bounce);
        ctx.lineTo(cx, cy + 4 - bounce);
        ctx.stroke();
        
        // Legs (Running motion)
        const stride = Math.sin(i * Math.PI / 2) * 6;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy + 4 - bounce);
        ctx.lineTo(cx - stride, cy + 12 - bounce);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy + 4 - bounce);
        ctx.lineTo(cx + stride, cy + 12 - bounce);
        ctx.stroke();

        // Arms
        ctx.beginPath();
        ctx.moveTo(cx, cy - 1 - bounce);
        ctx.lineTo(cx + stride, cy + 4 - bounce);
        ctx.stroke();
         
        ctx.beginPath();
        ctx.moveTo(cx, cy - 1 - bounce);
        ctx.lineTo(cx - stride, cy + 4 - bounce);
        ctx.stroke();
    }

    return {
        data: canvas.toDataURL(),
        config: { rows: 1, cols: 8, totalFrames: 8, fps: 12, scale: 8, transparent: null }
    };
};

const generateExplosionSprite = (): { data: string, config: SpriteConfig } => {
    const w = 64;
    const h = 64;
    const rows = 4;
    const cols = 4;
    const canvas = document.createElement('canvas');
    canvas.width = w * cols;
    canvas.height = h * rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { data: '', config: { rows: 4, cols: 4, totalFrames: 16, fps: 20, scale: 4, transparent: null } };

    for (let i = 0; i < rows * cols; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const cx = c * w + w / 2;
        const cy = r * h + h / 2;
        
        const progress = i / (rows * cols);
        const maxRadius = w / 2 - 4;
        const radius = Math.sin(progress * Math.PI) * maxRadius; // Expand and slightly contract/fade

        // Color shift: White -> Yellow -> Orange -> Grey
        if (progress < 0.2) ctx.fillStyle = `rgba(255, 255, 255, ${1-progress})`;
        else if (progress < 0.5) ctx.fillStyle = `rgba(255, 255, 0, ${1-progress})`;
        else if (progress < 0.8) ctx.fillStyle = `rgba(255, 100, 0, ${1-progress})`;
        else ctx.fillStyle = `rgba(100, 100, 100, ${1-progress})`;

        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2);
        ctx.fill();
        
        // Debris particles
        for(let j=0; j<6; j++) {
            const angle = (j / 6) * Math.PI * 2 + progress * 10;
            const dist = radius * (1 + Math.random() * 0.5);
            const size = (1 - progress) * 6;
            ctx.fillRect(cx + Math.cos(angle)*dist - size/2, cy + Math.sin(angle)*dist - size/2, size, size);
        }
    }
    
    return {
        data: canvas.toDataURL(),
        config: { rows: 4, cols: 4, totalFrames: 16, fps: 18, scale: 4, transparent: null }
    };
};

// --- Helper Components ---
interface NumberControlProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    slider?: boolean;
}

const NumberControl: React.FC<NumberControlProps> = ({ label, value, onChange, min, max, slider = true }) => {
    const [textVal, setTextVal] = useState(value.toString());

    useEffect(() => {
        if (textVal === '' || parseInt(textVal) !== value) {
            setTextVal(value.toString());
        }
    }, [value]);

    const commit = () => {
        let parsed = parseInt(textVal);
        if (isNaN(parsed) || textVal === '') {
            setTextVal(value.toString());
            return;
        }
        parsed = Math.max(min, Math.min(max, parsed));
        onChange(parsed);
        setTextVal(parsed.toString());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commit();
            (e.target as HTMLElement).blur();
        }
    };

    return (
        <div className="bg-black/20 p-2 rounded border border-white/5">
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase text-slate-500 font-bold">{label}</label>
                <input 
                    type="number" 
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    onBlur={commit}
                    onKeyDown={handleKeyDown}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-16 bg-slate-800 text-center text-xs rounded border border-white/10 focus:border-emerald-500 outline-none p-1 font-mono"
                />
            </div>
            {slider && (
                <input 
                    type="range" min={min} max={max} className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer block mt-2"
                    value={value} 
                    onChange={e => onChange(parseInt(e.target.value))}
                    onPointerDown={(e) => e.stopPropagation()}
                />
            )}
        </div>
    );
};

// --- Background Selector Component ---
type BgMode = 'grid' | string;

const BackgroundSelector: React.FC<{ value: BgMode, onChange: (v: BgMode) => void }> = ({ value, onChange }) => {
    const options = [
        { mode: 'grid', label: 'Transparent Grid', class: "bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7cwxAQAAAMKg9U9tCy8YYM0ADYiIqBoaP2QAvwU/61QAAAAASUVORK5CYII=')]" },
        { mode: '#000000', label: 'Black', class: "bg-black" },
        { mode: '#ffffff', label: 'White', class: "bg-white" },
        { mode: '#4ade80', label: 'Green', class: "bg-green-400" },
    ];

    return (
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-white/10" onPointerDown={e => e.stopPropagation()}>
            {options.map(opt => (
                <button
                    key={opt.mode}
                    onClick={() => onChange(opt.mode)}
                    className={`
                        w-4 h-4 rounded-[2px] border transition-all
                        ${value === opt.mode ? 'border-indigo-400 scale-110 shadow-sm z-10' : 'border-transparent opacity-70 hover:opacity-100'}
                        ${opt.class}
                    `}
                    title={opt.label}
                />
            ))}
            <div className="w-px h-3 bg-white/10 mx-0.5" />
            <div className="relative w-4 h-4 overflow-hidden rounded-[2px] border border-white/10 opacity-70 hover:opacity-100 bg-slate-700">
                <input 
                    type="color" 
                    value={value === 'grid' ? '#000000' : value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 cursor-pointer"
                    title="Custom Color"
                />
            </div>
        </div>
    );
};

// --- Types ---
type ExportFormat = 'GIF' | 'APNG' | 'WEBM' | 'WEBP';
type LoadMode = 'SHEET' | 'BUILDER';
type ExampleType = 'COIN' | 'RUNNER' | 'EXPLOSION';

interface TextConfig {
    text: string;
    fontSize: number;
    x: number;
    y: number;
    color: string;
    outlineColor: string;
    outlineWidth: number;
}

const App: React.FC = () => {
  // --- Global State ---
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // --- Node Positions ---
  const [nodes, setNodes] = useState({
    loader: { x: 50, y: 100, w: 380 },
    slicer: { x: 480, y: 100, w: 400 },
    text: { x: 930, y: 100, w: 320 },
    preview: { x: 1300, y: 100, w: 350 }
  });

  // --- Background Colors State ---
  const [builderBg, setBuilderBg] = useState<BgMode>('grid');
  const [viewerBg, setViewerBg] = useState<BgMode>('grid');
  const [previewBg, setPreviewBg] = useState<BgMode>('grid');

  // --- Application Data State ---
  const [loadMode, setLoadMode] = useState<LoadMode>('SHEET');
  
  // Builder Mode State
  const [builderConfig, setBuilderConfig] = useState({ rows: 3, cols: 3 });
  const [builderCells, setBuilderCells] = useState<Record<number, string>>({});
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [spriteConfig, setSpriteConfig] = useState<SpriteConfig>(generateCoinSprite().config);
  
  // Export Size State
  const [exportSize, setExportSize] = useState<{width: number, height: number}>({ width: 0, height: 0 });

  // Text Config State
  const [textConfig, setTextConfig] = useState<TextConfig>({
      text: '',
      fontSize: 20,
      x: 50,
      y: 90,
      color: '#ffffff',
      outlineColor: '#000000',
      outlineWidth: 3
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frames, setFrames] = useState<HTMLCanvasElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('GIF');
  const [isExporting, setIsExporting] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    handleLoadExample('COIN');
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            const file = e.clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const data = ev.target?.result as string;
                    if (loadMode === 'SHEET') {
                        loadImage(data);
                    } else {
                        setBuilderCells(prev => {
                            const total = builderConfig.rows * builderConfig.cols;
                            for (let i = 0; i < total; i++) {
                                if (!prev[i]) return { ...prev, [i]: data };
                            }
                            return prev;
                        });
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [loadMode, builderConfig]);

  const handleLoadExample = (type: ExampleType) => {
    let result;
    if (type === 'RUNNER') result = generateRunnerSprite();
    else if (type === 'EXPLOSION') result = generateExplosionSprite();
    else result = generateCoinSprite();

    loadImage(result.data, result.config);
  };

  const loadImage = (base64: string, initialConfig?: SpriteConfig) => {
    setImageSrc(base64);
    if (initialConfig) {
        setSpriteConfig(initialConfig);
    } else {
        setSpriteConfig(prev => ({ ...prev, rows: 1, cols: 1, totalFrames: 1 }));
        handleAnalyze(base64);
    }
  };

  const handleAnalyze = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeSpriteSheet(base64);
      setSpriteConfig(prev => ({
        ...prev,
        rows: result.rows,
        cols: result.cols,
        totalFrames: result.totalFrames
      }));
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelect = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        loadImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBulkUploadClick = () => {
      bulkInputRef.current?.click();
  };

  const handleBulkFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const files = Array.from(e.target.files) as File[];
          files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          const promises = files.map(file => new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (ev) => resolve(ev.target?.result as string);
              reader.readAsDataURL(file);
          }));

          const images = await Promise.all(promises);

          const totalImages = images.length;
          const currentCapacity = builderConfig.rows * builderConfig.cols;
          if (totalImages > currentCapacity) {
               const newRows = Math.ceil(totalImages / builderConfig.cols);
               setBuilderConfig(prev => ({ ...prev, rows: newRows }));
          }

          setBuilderCells(prev => {
              const next = { ...prev };
              images.forEach((img, idx) => {
                  next[idx] = img;
              });
              return next;
          });

          if (bulkInputRef.current) bulkInputRef.current.value = '';
      }
  };

  const stitchGrid = async () => {
    const { rows, cols } = builderConfig;
    let maxWidth = 0;
    let maxHeight = 0;

    const loadedImages: Record<number, HTMLImageElement> = {};
    const promises = Object.entries(builderCells).map(([key, src]) => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                maxWidth = Math.max(maxWidth, img.naturalWidth);
                maxHeight = Math.max(maxHeight, img.naturalHeight);
                loadedImages[parseInt(key)] = img;
                resolve();
            };
            img.src = src as string;
        });
    });

    await Promise.all(promises);

    if (maxWidth === 0 || maxHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = cols * maxWidth;
    canvas.height = rows * maxHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const img = loadedImages[idx];
            if (img) {
                const x = c * maxWidth + (maxWidth - img.naturalWidth) / 2;
                const y = r * maxHeight + (maxHeight - img.naturalHeight) / 2;
                ctx.drawImage(img, x, y);
                frameCount = idx + 1;
            }
        }
    }

    let autoScale = 1;
    if (maxWidth <= 32) autoScale = 8;
    else if (maxWidth <= 64) autoScale = 4;
    else if (maxWidth <= 128) autoScale = 2;

    const finalData = canvas.toDataURL();
    setLoadMode('SHEET');
    loadImage(finalData, {
        rows,
        cols,
        totalFrames: frameCount || rows * cols,
        fps: 10,
        scale: autoScale,
        transparent: null
    });
  };

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const frameList: HTMLCanvasElement[] = [];
      const { rows, cols, totalFrames } = spriteConfig;
      
      const frameWidth = img.naturalWidth / cols;
      const frameHeight = img.naturalHeight / rows;

      if (frameWidth <= 0 || frameHeight <= 0) return;

      for (let i = 0; i < totalFrames; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight,
            0,
            0,
            frameWidth,
            frameHeight
          );
          frameList.push(canvas);
        }
      }
      setFrames(frameList);
      
      // Initialize Export Size
      if (frameList.length > 0) {
          setExportSize({
              width: frameList[0].width * spriteConfig.scale,
              height: frameList[0].height * spriteConfig.scale
          });
      }
    };
  }, [imageSrc, spriteConfig.rows, spriteConfig.cols, spriteConfig.totalFrames, spriteConfig.scale]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 1000 / spriteConfig.fps);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length, spriteConfig.fps]);

  // --- Draw Helper ---
  const drawTextOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!textConfig.text.trim()) return;

      const fontSize = (textConfig.fontSize / 100) * height; // Scale relative to height
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;

      const x = (textConfig.x / 100) * width;
      const y = (textConfig.y / 100) * height;

      if (textConfig.outlineWidth > 0) {
          ctx.strokeStyle = textConfig.outlineColor;
          ctx.lineWidth = fontSize * 0.15; // Proportional outline
          ctx.strokeText(textConfig.text, x, y);
      }
      
      ctx.fillStyle = textConfig.color;
      ctx.fillText(textConfig.text, x, y);
  };

  const handleExport = async () => {
    if (frames.length === 0 || isExporting) return;
    setIsExporting(true);

    try {
      const scaledFrames = frames.map(original => {
        const canvas = document.createElement('canvas');
        // Use exact export dimensions
        canvas.width = exportSize.width;
        canvas.height = exportSize.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            // IMPORTANT: Clear default transparent black
            ctx.clearRect(0,0, canvas.width, canvas.height); 
            ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
            
            // Draw text overlay if it exists
            drawTextOnCanvas(ctx, canvas.width, canvas.height);
        }
        return canvas;
      });

      let blob: Blob;
      let ext = 'gif';

      if (exportFormat === 'GIF') {
          blob = await generateGif(scaledFrames, spriteConfig.fps, (p) => {});
          ext = 'gif';
      } else if (exportFormat === 'APNG') {
          blob = await generateApng(scaledFrames, spriteConfig.fps, (p) => {});
          ext = 'png';
      } else if (exportFormat === 'WEBM') {
          blob = await generateWebM(scaledFrames, spriteConfig.fps, (p) => {});
          ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      } else if (exportFormat === 'WEBP') {
          blob = await generateWebP(scaledFrames, spriteConfig.fps, (p) => {});
          ext = 'webp';
      } else {
        throw new Error('Unknown format');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprite-animation.${ext}`;
      document.body.appendChild(a);
      
      setTimeout(() => {
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsExporting(false);
          }, 100);
      }, 50);

    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. If using APNG/WebP, check console for details. " + (error as any).message);
      setIsExporting(false);
    }
  };

  const handleDownloadSheet = () => {
     if (!imageSrc) return;
     const a = document.createElement('a');
     a.href = imageSrc;
     a.download = 'compiled-sprite-sheet.png';
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
  };

  // --- Dimension Logic ---
  const updateExportDimension = (dim: 'width' | 'height', val: number) => {
      if (!frames[0]) return;
      const aspectRatio = frames[0].width / frames[0].height;
      
      if (dim === 'width') {
          setExportSize({ width: val, height: Math.round(val / aspectRatio) });
      } else {
          setExportSize({ width: Math.round(val * aspectRatio), height: val });
      }
  };

  const setExportPreset = (size: 'original' | number) => {
      if (!frames[0]) return;
      if (size === 'original') {
           setExportSize({ width: frames[0].width, height: frames[0].height });
      } else {
           updateExportDimension('width', size);
      }
  };

  // --- Canvas Navigation ---
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (draggingNodeId) {
       const dx = e.clientX - lastMousePos.current.x;
       const dy = e.clientY - lastMousePos.current.y;
       setNodes(prev => ({
         ...prev,
         [draggingNodeId]: {
            // @ts-ignore
            ...prev[draggingNodeId],
            // @ts-ignore
            x: prev[draggingNodeId].x + dx,
            // @ts-ignore
            y: prev[draggingNodeId].y + dy
         }
       }));
       lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleNodeDragStart = (id: string, e: React.PointerEvent) => {
     e.stopPropagation();
     setDraggingNodeId(id);
     lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const renderConnection = (startNode: any, endNode: any, startIdx = 0, endIdx = 0) => {
      const startX = startNode.x + startNode.w;
      const startY = startNode.y + 44 + (startIdx * 24) + 6;
      const endX = endNode.x;
      const endY = endNode.y + 44 + (endIdx * 24) + 6;

      const cp1X = startX + 50;
      const cp2X = endX - 50;

      return (
        <path 
            d={`M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`}
            stroke="#64748b"
            strokeWidth="3"
            fill="none"
            className="opacity-50"
        />
      );
  };

  return (
    <div 
      className="w-full h-screen bg-[#0f0f11] overflow-hidden relative cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
          backgroundImage: 'radial-gradient(circle, #2a2a2e 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${viewport.x}px ${viewport.y}px`
      }}
    >
      <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }} className="w-full h-full absolute top-0 left-0">
         
         <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-0">
            {renderConnection(nodes.loader, nodes.slicer)}
            {renderConnection(nodes.slicer, nodes.text)}
            {renderConnection(nodes.text, nodes.preview)}
         </svg>

         {/* --- NODE 1: LOADER --- */}
         <Node 
            id="loader" 
            title="1. Source Image" 
            x={nodes.loader.x} 
            y={nodes.loader.y} 
            width={nodes.loader.w}
            onDragStart={handleNodeDragStart}
            outputs={[{ id: 'img', label: 'Image' }]}
            color="bg-indigo-600"
         >
            <div className="flex gap-2 mb-4 p-1 bg-black/40 rounded-lg">
                <button 
                    onClick={() => setLoadMode('SHEET')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-colors ${loadMode === 'SHEET' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Grid3X3 size={14} /> Import Sheet
                </button>
                <button 
                    onClick={() => setLoadMode('BUILDER')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-colors ${loadMode === 'BUILDER' ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Layers size={14} /> Sheet Builder
                </button>
            </div>

            {loadMode === 'SHEET' ? (
                <div className="space-y-4">
                    <DropZone 
                        onImageSelected={handleImageSelect} 
                        className="h-32" 
                    />
                    <div className="pt-3 border-t border-white/5">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Load Example</label>
                        <div className="grid grid-cols-3 gap-2">
                             <button onClick={() => handleLoadExample('COIN')} className="flex flex-col items-center justify-center gap-1 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-white/5 transition-colors">
                                <Coins size={16} className="text-yellow-400" />
                                <span className="text-[10px]">Coin</span>
                             </button>
                             <button onClick={() => handleLoadExample('RUNNER')} className="flex flex-col items-center justify-center gap-1 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-white/5 transition-colors">
                                <PersonStanding size={16} className="text-emerald-400" />
                                <span className="text-[10px]">Pixel Run</span>
                             </button>
                             <button onClick={() => handleLoadExample('EXPLOSION')} className="flex flex-col items-center justify-center gap-1 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-white/5 transition-colors">
                                <Zap size={16} className="text-orange-400" />
                                <span className="text-[10px]">Explosion</span>
                             </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-2 items-center justify-between">
                         <div className="flex items-center gap-2">
                            <NumberControl label="Rows" value={builderConfig.rows} min={1} max={12} slider={false} onChange={v => setBuilderConfig(p => ({...p, rows: v}))} />
                            <NumberControl label="Cols" value={builderConfig.cols} min={1} max={12} slider={false} onChange={v => setBuilderConfig(p => ({...p, cols: v}))} />
                         </div>
                         <BackgroundSelector value={builderBg} onChange={setBuilderBg} />
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={handleBulkUploadClick}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 rounded border border-white/10 flex items-center justify-center gap-2 text-xs py-2 text-slate-300"
                            title="Bulk Upload Frames"
                        >
                            <FolderInput size={14} />
                            <span>Bulk Upload</span>
                        </button>
                        <input ref={bulkInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleBulkFiles} />
                        
                        <button 
                            onClick={stitchGrid}
                            className="bg-purple-600 hover:bg-purple-500 text-white rounded font-bold px-4 flex items-center justify-center shadow-lg transition-transform active:scale-95 w-24 text-xs"
                        >
                            <Wand2 size={14} className="mr-1" />
                            GENERATE
                        </button>
                    </div>
                    
                    <div className="rounded p-2 border border-white/5 overflow-hidden transition-colors duration-300" 
                        style={builderBg === 'grid' ? { backgroundImage: `url('${GRID_PATTERN}')`, backgroundColor: '#202020' } : { backgroundColor: builderBg }}
                    >
                        <div 
                            className="grid gap-1 relative"
                            style={{ 
                                gridTemplateColumns: `repeat(${builderConfig.cols}, 1fr)`,
                                aspectRatio: `${builderConfig.cols}/${builderConfig.rows}`
                            }}
                        >
                            {Array.from({ length: builderConfig.rows * builderConfig.cols }).map((_, i) => (
                                <div 
                                    key={i}
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e: any) => {
                                            if (e.target.files?.[0]) {
                                                const r = new FileReader();
                                                r.onload = (ev) => setBuilderCells(p => ({ ...p, [i]: ev.target?.result as string }));
                                                r.readAsDataURL(e.target.files[0]);
                                            }
                                        };
                                        input.click();
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer.files?.[0]) {
                                            const r = new FileReader();
                                            r.onload = (ev) => setBuilderCells(p => ({ ...p, [i]: ev.target?.result as string }));
                                            r.readAsDataURL(e.dataTransfer.files[0]);
                                        }
                                    }}
                                    className={`
                                        relative border border-white/10 rounded overflow-hidden cursor-pointer hover:border-purple-500/50 group hover:shadow-lg transition-all
                                        ${!builderCells[i] ? 'hover:bg-white/5' : ''}
                                    `}
                                >
                                    {builderCells[i] && (
                                        <img src={builderCells[i]} className="w-full h-full object-contain" />
                                    )}
                                    <div className="absolute top-0.5 left-1 text-[8px] text-white/50 font-mono pointer-events-none mix-blend-difference">{i+1}</div>
                                    {builderCells[i] && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setBuilderCells(p => { const n = {...p}; delete n[i]; return n; })}}
                                            className="absolute top-0 right-0 p-1 text-red-400 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black transition-opacity"
                                        >
                                            <Trash2 size={8} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
         </Node>

         {/* --- NODE 2: SLICER --- */}
         <Node 
            id="slicer" 
            title="2. Grid Slicer" 
            x={nodes.slicer.x} 
            y={nodes.slicer.y} 
            width={nodes.slicer.w}
            onDragStart={handleNodeDragStart}
            inputs={[{ id: 'img', label: 'Image' }]}
            outputs={[{ id: 'frames', label: 'Frames' }]}
         >
            <div className="space-y-4">
                {imageSrc ? (
                    <>
                        <div className="flex items-center justify-between mb-2">
                             <div className="text-[10px] text-slate-500 uppercase font-bold">Grid Preview</div>
                             <BackgroundSelector value={viewerBg} onChange={setViewerBg} />
                        </div>

                        <div className="pt-0">
                            <SpriteViewer 
                                imageSrc={imageSrc} 
                                config={spriteConfig} 
                                currentFrame={currentFrame}
                                backgroundColor={viewerBg}
                            />
                        </div>

                        <div className="flex gap-2 mt-2">
                             <button 
                                onClick={() => handleAnalyze(imageSrc)}
                                disabled={isAnalyzing}
                                className="flex-1 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 rounded py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                             >
                                <Wand2 size={14} className={isAnalyzing ? "animate-spin" : ""} />
                                {isAnalyzing ? "Analyzing..." : "AI Auto-Detect"}
                             </button>
                             {loadMode === 'SHEET' && (
                                 <button onClick={handleDownloadSheet} className="w-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded border border-white/10" title="Download Sheet Asset">
                                    <Download size={14} className="text-slate-400" />
                                 </button>
                             )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <NumberControl label="Rows" value={spriteConfig.rows} onChange={v => setSpriteConfig(p => ({...p, rows: v}))} min={1} max={64} slider={false} />
                            <NumberControl label="Cols" value={spriteConfig.cols} onChange={v => setSpriteConfig(p => ({...p, cols: v}))} min={1} max={64} slider={false} />
                        </div>
                        
                        <NumberControl label="Total Frames" value={spriteConfig.totalFrames} onChange={v => setSpriteConfig(p => ({...p, totalFrames: v}))} min={1} max={spriteConfig.rows * spriteConfig.cols} slider={false} />
                    </>
                ) : (
                    <div className="h-40 flex items-center justify-center text-slate-500 text-sm italic border border-dashed border-slate-700 rounded-lg">
                        Waiting for image...
                    </div>
                )}
            </div>
         </Node>

         {/* --- NODE 3: TEXT OVERLAY (OPTIONAL) --- */}
         <Node 
            id="text" 
            title="3. Text Overlay (Optional)" 
            x={nodes.text.x} 
            y={nodes.text.y} 
            width={nodes.text.w}
            onDragStart={handleNodeDragStart}
            inputs={[{ id: 'frames', label: 'Frames' }]}
            outputs={[{ id: 'frames-text', label: 'Frames w/ Text' }]}
            color="bg-pink-600"
         >
             <div className="space-y-4">
                 <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase font-bold">Text Content</label>
                     <textarea 
                         value={textConfig.text}
                         onChange={(e) => setTextConfig(p => ({...p, text: e.target.value}))}
                         onPointerDown={(e) => e.stopPropagation()}
                         placeholder="Enter meme text here..."
                         className="w-full bg-slate-900/50 border border-white/10 rounded p-2 text-sm text-white focus:border-pink-500 outline-none resize-none h-16"
                     />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Text Color</label>
                         <div className="flex items-center gap-2 bg-slate-900 rounded p-1 border border-white/10">
                            <input 
                                type="color" 
                                value={textConfig.color}
                                onChange={(e) => setTextConfig(p => ({...p, color: e.target.value}))}
                                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-xs font-mono">{textConfig.color}</span>
                         </div>
                     </div>
                     <div>
                         <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Outline</label>
                         <div className="flex items-center gap-2 bg-slate-900 rounded p-1 border border-white/10">
                            <input 
                                type="color" 
                                value={textConfig.outlineColor}
                                onChange={(e) => setTextConfig(p => ({...p, outlineColor: e.target.value}))}
                                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-xs font-mono">{textConfig.outlineColor}</span>
                         </div>
                     </div>
                 </div>

                 <div className="space-y-2 pt-2 border-t border-white/5">
                     <NumberControl label="Font Size" value={textConfig.fontSize} min={5} max={100} onChange={v => setTextConfig(p => ({...p, fontSize: v}))} />
                     
                     <div className="grid grid-cols-2 gap-2">
                        <NumberControl label="Position X %" value={textConfig.x} min={0} max={100} onChange={v => setTextConfig(p => ({...p, x: v}))} />
                        <NumberControl label="Position Y %" value={textConfig.y} min={0} max={100} onChange={v => setTextConfig(p => ({...p, y: v}))} />
                     </div>
                     
                     {/* Preset Positions */}
                     <div className="flex gap-2 justify-center pt-1">
                         <button onClick={() => setTextConfig(p => ({...p, x: 50, y: 15}))} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Top">
                             <AlignHorizontalDistributeCenter size={14} className="rotate-180" />
                         </button>
                         <button onClick={() => setTextConfig(p => ({...p, x: 50, y: 50}))} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Center">
                             <AlignVerticalDistributeCenter size={14} />
                         </button>
                         <button onClick={() => setTextConfig(p => ({...p, x: 50, y: 90}))} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Bottom">
                             <AlignHorizontalDistributeCenter size={14} />
                         </button>
                     </div>
                 </div>
             </div>
         </Node>

         {/* --- NODE 4: PREVIEW --- */}
         <Node 
            id="preview" 
            title="4. Preview & Export" 
            x={nodes.preview.x} 
            y={nodes.preview.y} 
            width={nodes.preview.w}
            onDragStart={handleNodeDragStart}
            inputs={[{ id: 'frames', label: 'Frames' }]}
            color="bg-emerald-700"
         >
             <div className="space-y-4">
                 <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Animation Preview</div>
                      <BackgroundSelector value={previewBg} onChange={setPreviewBg} />
                 </div>

                 <div 
                    className="rounded-lg overflow-hidden border border-slate-800 min-h-[200px] flex items-center justify-center relative transition-colors duration-300"
                    style={previewBg === 'grid' ? { backgroundImage: `url('${GRID_PATTERN}')`, backgroundColor: '#202020' } : { backgroundColor: previewBg }}
                 >
                    {frames.length > 0 ? (
                        <canvas 
                            ref={(canvas) => {
                                if (canvas && frames[currentFrame]) {
                                    // Use explicit export size for preview canvas
                                    canvas.width = exportSize.width;
                                    canvas.height = exportSize.height;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                        ctx.imageSmoothingEnabled = false;
                                        // Clear background
                                        ctx.clearRect(0,0,canvas.width, canvas.height);
                                        // Draw Image
                                        ctx.drawImage(frames[currentFrame], 0, 0, canvas.width, canvas.height);
                                        
                                        // Draw Text (Preview)
                                        drawTextOnCanvas(ctx, canvas.width, canvas.height);
                                    }
                                }
                            }}
                            className="max-w-full max-h-[300px] object-contain"
                        />
                    ) : (
                        <div className="text-slate-600 text-xs">No frames</div>
                    )}
                 </div>

                 <NumberControl label="FPS Speed" value={spriteConfig.fps} onChange={v => setSpriteConfig(p => ({...p, fps: v}))} min={1} max={60} />
                 
                 <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-white/5">
                     <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-white"
                     >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                     </button>
                     <span className="text-xs font-mono text-emerald-400 flex-1 text-right">
                        Frame {currentFrame + 1}/{frames.length}
                     </span>
                 </div>
                 
                 {/* Export Size Control */}
                 <div className="bg-slate-900/50 p-2 rounded border border-white/5 space-y-2">
                     <label className="text-[10px] text-slate-400 uppercase font-bold flex justify-between">
                         <span>Export Size</span>
                         <span className="text-emerald-400 font-mono">{exportSize.width}x{exportSize.height}</span>
                     </label>
                     
                     <div className="flex gap-1">
                         <button onClick={() => setExportPreset('original')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] py-1 rounded border border-white/5 text-slate-300">Original</button>
                         <button onClick={() => setExportPreset(64)} className="w-10 bg-slate-800 hover:bg-slate-700 text-[10px] py-1 rounded border border-white/5 text-slate-300">64</button>
                         <button onClick={() => setExportPreset(128)} className="w-10 bg-slate-800 hover:bg-slate-700 text-[10px] py-1 rounded border border-white/5 text-slate-300">128</button>
                         <button onClick={() => setExportPreset(512)} className="w-10 bg-slate-800 hover:bg-slate-700 text-[10px] py-1 rounded border border-white/5 text-slate-300">512</button>
                     </div>

                     <div className="flex items-center gap-2">
                         <div className="flex-1 relative">
                             <input 
                                type="number" 
                                value={exportSize.width} 
                                onChange={(e) => updateExportDimension('width', parseInt(e.target.value) || 1)}
                                onPointerDown={e => e.stopPropagation()}
                                className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-center focus:border-emerald-500 outline-none" 
                             />
                             <span className="absolute right-2 top-1.5 text-[8px] text-slate-500">W</span>
                         </div>
                         <Lock size={12} className="text-slate-500" />
                         <div className="flex-1 relative">
                             <input 
                                type="number" 
                                value={exportSize.height}
                                onChange={(e) => updateExportDimension('height', parseInt(e.target.value) || 1)}
                                onPointerDown={e => e.stopPropagation()}
                                className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-center focus:border-emerald-500 outline-none" 
                             />
                             <span className="absolute right-2 top-1.5 text-[8px] text-slate-500">H</span>
                         </div>
                     </div>
                 </div>

                 <div className="pt-2 border-t border-white/5 space-y-3">
                     <div className="flex p-1 bg-slate-900 rounded-lg">
                        {(['GIF', 'APNG', 'WEBM', 'WEBP'] as const).map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => setExportFormat(fmt)}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-colors ${exportFormat === fmt ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {fmt === 'WEBM' ? 'VIDEO' : fmt}
                            </button>
                        ))}
                     </div>
                     <button 
                        onClick={handleExport}
                        disabled={isExporting || frames.length === 0}
                        className={`
                            w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm shadow-lg transition-all
                            ${isExporting 
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/50 active:scale-[0.98]'
                            }
                        `}
                     >
                         {isExporting ? (
                             <RotateCw className="animate-spin" size={18} />
                         ) : (
                             exportFormat === 'WEBM' ? <FileVideo size={18} /> : (exportFormat === 'WEBP' ? <FileImage size={18} /> : <ImageIcon size={18} />)
                         )}
                         {isExporting ? 'Exporting...' : `Save ${exportFormat}`}
                     </button>
                 </div>
             </div>
         </Node>

         <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white/20 pointer-events-none select-none">
             <div className={`w-2 h-2 rounded-full ${imageSrc ? 'bg-emerald-500' : 'bg-slate-700'}`} />
             <span className="text-xs font-mono">
                 {imageSrc ? `Active Asset (${frames[0]?.width * spriteConfig.cols}x${frames[0]?.height * spriteConfig.rows})` : 'No Asset Loaded'}
             </span>
         </div>
      </div>
    </div>
  );
};

export default App;
