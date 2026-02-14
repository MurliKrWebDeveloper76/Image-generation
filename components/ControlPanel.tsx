import React, { useRef } from 'react';
import { AspectRatio, ModelType, ImageSize, GenerationSettings } from '../types';

interface ControlPanelProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  isGenerating: boolean;
  onGenerate: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings, isGenerating, onGenerate }) => {
  const aspectRatios: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];
  const imageSizes: ImageSize[] = ["1K", "2K", "4K"];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSettings(prev => ({
          ...prev,
          referenceImage: base64String,
          mimeType: file.type
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSettings(prev => ({
      ...prev,
      referenceImage: undefined,
      mimeType: undefined
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full lg:w-[400px] flex flex-col gap-8 p-6 glass rounded-2xl h-fit sticky top-24 transition-all border-white/5 hover:border-white/10 shadow-2xl">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
            <i className="fas fa-image text-blue-400"></i> Reference Seed
          </h3>
          {settings.referenceImage && (
            <button onClick={clearImage} className="text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-bold tracking-widest">
              Clear
            </button>
          )}
        </div>
        {!settings.referenceImage ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border border-white/5 rounded-xl bg-slate-950/40 flex flex-col items-center justify-center gap-2 hover:bg-slate-900/50 hover:border-blue-500/30 transition-all cursor-pointer group shadow-inner"
          >
            <i className="fas fa-cloud-arrow-up text-slate-500 group-hover:text-blue-400 text-lg transition-colors"></i>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-300 transition-colors">Drop Reference Asset</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
        ) : (
          <div className="relative group overflow-hidden rounded-xl border border-blue-500/20 shadow-lg">
            <img 
              src={`data:${settings.mimeType};base64,${settings.referenceImage}`} 
              alt="Reference" 
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <i className="fas fa-camera text-white"></i>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-4 flex items-center gap-2">
          <i className="fas fa-brain text-blue-400"></i> Neural Model
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setSettings(prev => ({ ...prev, model: 'gemini-2.5-flash-image' }))}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
              settings.model === 'gemini-2.5-flash-image' 
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-100' 
                : 'bg-slate-950/20 border-white/5 text-slate-500 hover:bg-slate-900/40'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${settings.model === 'gemini-2.5-flash-image' ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'}`}></div>
            <div className="text-left">
              <div className="text-xs font-bold">Flash 2.5</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-tighter">Fast & Responsive</div>
            </div>
          </button>
          <button
            onClick={() => setSettings(prev => ({ ...prev, model: 'gemini-3-pro-image-preview' }))}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
              settings.model === 'gemini-3-pro-image-preview' 
                ? 'bg-cyan-600/10 border-cyan-500/30 text-cyan-100' 
                : 'bg-slate-950/20 border-white/5 text-slate-500 hover:bg-slate-900/40'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${settings.model === 'gemini-3-pro-image-preview' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`}></div>
            <div className="text-left">
              <div className="text-xs font-bold">Studio Pro 3</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-tighter">Artistic Quality</div>
            </div>
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Composition</h3>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatios.map(ratio => (
            <button
              key={ratio}
              onClick={() => setSettings(prev => ({ ...prev, aspectRatio: ratio }))}
              className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                settings.aspectRatio === ratio 
                  ? 'bg-slate-800 border-blue-500/40 text-white' 
                  : 'bg-slate-950/30 border-white/5 text-slate-500 hover:border-white/10'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </section>

      {settings.model === 'gemini-3-pro-image-preview' && (
        <section className="animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Render Target</h3>
          <div className="flex gap-2">
            {imageSizes.map(size => (
              <button
                key={size}
                onClick={() => setSettings(prev => ({ ...prev, imageSize: size }))}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                  settings.imageSize === size 
                    ? 'bg-slate-800 border-cyan-500/40 text-white' 
                    : 'bg-slate-950/30 border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={onGenerate}
        disabled={isGenerating || !settings.prompt.trim()}
        className={`w-full mt-4 py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 btn-premium shadow-xl ${
          isGenerating || !settings.prompt.trim()
            ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5'
            : 'accent-gradient text-white hover:shadow-blue-500/20'
        }`}
      >
        {isGenerating ? (
          <><i className="fas fa-atom fa-spin text-sm"></i> Generating...</>
        ) : (
          <><i className="fas fa-sparkles text-sm"></i> Generate Art</>
        )}
      </button>
    </div>
  );
};

export default ControlPanel;