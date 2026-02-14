import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onDelete: (id: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onSetAsReference: (imageUrl: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, onCopyPrompt, onSetAsReference }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `visionforge-${image.id}.png`;
    link.click();
  };

  const handleCopy = () => {
    onCopyPrompt(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative glass rounded-2xl overflow-hidden break-inside-avoid mb-6 flex flex-col transition-all hover:border-white/20 border-white/5 shadow-2xl card-border-glow">
      <div className="relative overflow-hidden">
        <img 
          src={image.url} 
          alt={image.prompt} 
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex gap-2">
            <button 
              onClick={() => onSetAsReference(image.url)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-500/80 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
              title="Use as Reference"
            >
              <i className="fas fa-wand-magic-sparkles text-[10px]"></i>
            </button>
            <button 
              onClick={handleDownload}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
              title="Download"
            >
              <i className="fas fa-download text-[10px]"></i>
            </button>
            <button 
              onClick={handleCopy}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
              title="Copy Prompt"
            >
              <i className={`fas ${copied ? 'fa-check text-green-400' : 'fa-copy'} text-[10px]`}></i>
            </button>
            <button 
              onClick={() => onDelete(image.id)}
              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/40 text-red-400 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 ml-auto"
              title="Delete"
            >
              <i className="fas fa-trash-can text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-900/20 border-t border-white/5">
        <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed font-medium">
          {image.prompt}
        </p>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] uppercase font-bold text-slate-500 border border-white/5">
            {image.config.aspectRatio}
          </span>
          <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${image.config.model.includes('pro') ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
            {image.config.model.includes('pro') ? 'PRO' : 'FLASH'}
          </span>
          
          {image.sources && image.sources.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <i className="fas fa-link text-[9px] text-slate-700"></i>
              <div className="flex -space-x-1">
                {image.sources.slice(0, 2).map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 transition-all"
                    title={source.title}
                  >
                    <i className="fas fa-external-link-alt text-[6px] text-slate-500"></i>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;