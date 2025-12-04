import React, { useState } from 'react';
import { SpriteConfig, Dimensions } from '../types';

interface SpriteViewerProps {
  imageSrc: string;
  config: SpriteConfig;
  currentFrame: number;
  backgroundColor?: string;
}

const GRID_PATTERN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7cwxAQAAAMKg9U9tCy8YYM0ADYiIqBoaP2QAvwU/61QAAAAASUVORK5CYII=";

const SpriteViewer: React.FC<SpriteViewerProps> = ({ imageSrc, config, currentFrame, backgroundColor = 'grid' }) => {
  const [imgDimensions, setImgDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // Calculate grid cell size
  const cellWidth = imgDimensions.width / Math.max(1, config.cols);
  const cellHeight = imgDimensions.height / Math.max(1, config.rows);

  // Calculate highlight position
  const currentRow = Math.floor(currentFrame / config.cols);
  const currentCol = currentFrame % config.cols;

  const bgStyle = backgroundColor === 'grid' 
    ? { backgroundImage: `url('${GRID_PATTERN}')`, backgroundColor: '#202020' }
    : { backgroundColor: backgroundColor };

  return (
    <div 
        className="relative w-full min-h-[150px] rounded-lg overflow-hidden ring-1 ring-white/10 flex items-center justify-center p-4 transition-colors duration-300"
        style={bgStyle}
    >
      {/* Container for Image + Grid */}
      <div className="relative inline-block shadow-2xl">
        <img
          src={imageSrc}
          alt="Sprite Sheet"
          onLoad={onImgLoad}
          className="max-w-full max-h-[300px] object-contain block select-none pixelated"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* CSS Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/10" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gridTemplateRows: `repeat(${config.rows}, 1fr)`
        }}>
            {Array.from({ length: config.rows * config.cols }).map((_, i) => (
                <div key={i} className="border border-white/20"></div>
            ))}
        </div>

        {/* Active Frame Highlight */}
        <div 
            className="absolute border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-75 bg-indigo-500/10 z-10"
            style={{
                width: `${100 / config.cols}%`,
                height: `${100 / config.rows}%`,
                left: `${(currentCol / config.cols) * 100}%`,
                top: `${(currentRow / config.rows) * 100}%`,
            }}
        />
      </div>
    </div>
  );
};

export default SpriteViewer;