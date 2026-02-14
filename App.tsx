
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GenerationSettings, GeneratedImage } from './types';
import { generateImage } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import ImageCard from './components/ImageCard';

const STORAGE_KEY = 'visionforge_v2_history';

const LOADING_MESSAGES = [
  "Initializing neural pathways...",
  "Sampling latent space...",
  "Synthesizing stylistic layers...",
  "Refining artistic textures...",
  "Calculating light transport...",
  "Applying compositional balance...",
  "Polishing pixel fidelity...",
  "Finalizing creative output..."
];

// Component to show while an image is being generated
const SkeletonCard = () => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-2xl overflow-hidden mb-6 flex flex-col p-3 space-y-3 shadow-xl border-white/5 animate-pulse">
      <div className="w-full aspect-square skeleton rounded-xl flex items-center justify-center bg-slate-900/40">
        <div className="flex flex-col items-center gap-4">
          <i className="fas fa-atom fa-spin text-3xl text-blue-500/40"></i>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{LOADING_MESSAGES[msgIdx]}</span>
        </div>
      </div>
      <div className="space-y-2 px-1">
        <div className="h-2.5 w-full skeleton rounded opacity-50"></div>
        <div className="h-2.5 w-2/3 skeleton rounded opacity-30"></div>
      </div>
      <div className="flex gap-2 p-1">
        <div className="h-4 w-10 skeleton rounded opacity-20"></div>
        <div className="h-4 w-10 skeleton rounded opacity-20"></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<GenerationSettings>({
    prompt: '',
    aspectRatio: '1:1',
    model: 'gemini-2.5-flash-image',
    imageSize: '1K',
  });

  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const studioRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    if (history.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Main generation handler
  const handleGenerate = async () => {
    if (!settings.prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    scrollToStudio();

    try {
      // Check for API key if using a Pro model
      if (settings.model === 'gemini-3-pro-image-preview' && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // We proceed assuming the key was selected as per race condition rules
        }
      }

      const result = await generateImage(settings);
      
      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substring(7),
        url: result.imageUrl,
        prompt: settings.prompt,
        timestamp: Date.now(),
        sources: result.sources,
        config: {
          aspectRatio: settings.aspectRatio,
          model: settings.model,
          size: settings.model === 'gemini-3-pro-image-preview' ? settings.imageSize : undefined,
          hasReferenceImage: !!settings.referenceImage
        }
      };

      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      console.error("App generation error:", err);
      // Re-trigger key selection if an authorization error occurs
      if (err.message === 'API_KEY_ERROR' && window.aistudio) {
        setError("API Session invalid. Please select a valid key from a paid project.");
        await window.aistudio.openSelectKey();
      } else if (err.message.includes("safety")) {
        setError("Content policy violation: The prompt or result was filtered for safety.");
      } else {
        setError(err.message || "An unexpected error occurred during synthesis.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteImage = useCallback((id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
  }, []);

  const copyPromptToInput = useCallback((prompt: string) => {
    setSettings(prev => ({ ...prev, prompt }));
    scrollToStudio();
  }, []);

  const setAsReference = useCallback((imageUrl: string) => {
    if (imageUrl.startsWith('data:')) {
      const parts = imageUrl.split(',');
      const header = parts[0];
      const data = parts[1];
      const mimeType = header.split(':')[1].split(';')[0];
      setSettings(prev => ({
        ...prev,
        referenceImage: data,
        mimeType: mimeType
      }));
    }
    scrollToStudio();
  }, []);

  return (
    <div className="min-h-screen text-slate-200 selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="bg-blob top-[-200px] left-[-200px] opacity-20"></div>
      <div className="bg-blob bottom-[-400px] right-[-300px] opacity-10"></div>
      <div className="bg-blob top-[40%] left-[60%] w-[500px] h-[500px] opacity-[0.05] animate-pulse"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] px-8 py-5 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              Vision<span className="text-blue-400">Forge</span>
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-slate-500 border border-white/5 tracking-widest uppercase">3.0</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <a href="#studio" className="hover:text-blue-400 transition-colors">Studio</a>
            <button 
              onClick={scrollToStudio}
              className="px-5 py-2 accent-gradient rounded-full text-white glow-hover transition-all btn-premium active:scale-95 text-xs"
            >
              Start Creating
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center reveal">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] uppercase font-bold tracking-[0.2em] text-blue-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></span>
            Multi-Model AI Infrastructure Active
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight text-white">
            Synthetic <span className="text-gradient">Imagination</span> <br /> Forged in Pixels.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            A premium workspace for AI art generation. Harness Gemini 2.5 Flash and Studio Pro 3 for high-fidelity visuals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button 
              onClick={scrollToStudio}
              className="w-full sm:w-auto px-10 py-4 accent-gradient rounded-xl text-sm font-bold text-white shadow-xl hover:scale-105 transition-all btn-premium"
            >
              Enter Studio
            </button>
            <a href="#history" className="w-full sm:w-auto px-10 py-4 bg-white/5 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-all text-slate-300">
              View History
            </a>
          </div>
        </div>
      </section>

      {/* Studio Interface */}
      <section ref={studioRef} id="studio" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10">
          <aside className="reveal">
            <ControlPanel 
              settings={settings} 
              setSettings={setSettings} 
              isGenerating={isGenerating} 
              onGenerate={handleGenerate} 
            />
          </aside>

          <main className="flex flex-col gap-10 reveal" style={{ transitionDelay: '0.1s' }}>
            {/* Prompt Console */}
            <div className="glass rounded-2xl p-8 border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full"></div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                  <i className="fas fa-terminal text-blue-400"></i> Prompt Engine
                </h2>
                <div className="flex gap-4">
                  <button className="text-[10px] text-slate-500 hover:text-blue-400 transition-all uppercase font-bold tracking-widest">Templates</button>
                  <button className="text-[10px] text-slate-500 hover:text-blue-400 transition-all uppercase font-bold tracking-widest">Optimize</button>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={settings.prompt}
                  onChange={(e) => setSettings(prev => ({ ...prev, prompt: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                  placeholder={settings.referenceImage ? "Instruct the AI to transform this seed image..." : "A hyper-realistic cyberpunk city at night, neon lights reflecting on wet asphalt, cinematic lighting, 8k resolution..."}
                  className="w-full h-40 bg-slate-950/30 border border-white/5 rounded-xl p-6 text-lg text-slate-100 focus:outline-none focus:border-blue-500/30 resize-none transition-all placeholder:text-slate-600 focus:bg-slate-950/50 shadow-inner"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{settings.prompt.length} Chars</span>
                  {settings.prompt && (
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, prompt: '' }))}
                      className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-md"
                    >
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                  )}
                </div>
              </div>
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 font-bold text-xs uppercase tracking-tight animate-in slide-in-from-left-2 duration-300">
                  <i className="fas fa-circle-exclamation text-sm mt-0.5"></i>
                  <div className="flex-1">
                    <p>{error}</p>
                    {error.includes("Key") && (
                       <button onClick={() => window.aistudio?.openSelectKey()} className="mt-2 text-blue-400 underline uppercase tracking-widest text-[10px]">Update Key Selection</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Grid */}
            <div id="history" className="flex flex-col gap-6 pt-10">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-layer-group text-blue-400 text-xs"></i> Generated Assets
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20">{history.length}</span>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setHistory([])}
                    className="text-[10px] font-bold text-slate-600 hover:text-red-400 transition-all uppercase tracking-widest"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="columns-1 md:columns-2 gap-6 space-y-6">
                {isGenerating && <SkeletonCard />}
                {history.length === 0 && !isGenerating ? (
                  <div className="h-80 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-slate-950/20 group col-span-2">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-inner">
                      <i className="fas fa-palette text-slate-700 text-2xl"></i>
                    </div>
                    <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">No active sessions</p>
                    <p className="text-slate-800 font-medium text-[9px] uppercase tracking-widest">Start generating to build your collection</p>
                  </div>
                ) : (
                  history.map(image => (
                    <ImageCard 
                      key={image.id} 
                      image={image} 
                      onDelete={deleteImage} 
                      onCopyPrompt={copyPromptToInput}
                      onSetAsReference={setAsReference}
                    />
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-32 border-t border-white/5 bg-slate-950/40 py-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 accent-gradient rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-bolt text-white text-[10px]"></i>
              </div>
              <span className="text-lg font-bold tracking-tight text-white uppercase">VisionForge</span>
            </div>
            <p className="text-slate-600 text-[10px] font-medium max-w-xs text-center md:text-left uppercase tracking-widest leading-loose">
              Harnessing Gemini Multimodal Intelligence to push the boundaries of synthetic media.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <div className="flex gap-6 mb-4 text-slate-600 text-lg">
              <i className="fab fa-twitter hover:text-blue-400 cursor-pointer transition-colors"></i>
              <i className="fab fa-discord hover:text-blue-400 cursor-pointer transition-colors"></i>
              <i className="fab fa-github hover:text-blue-400 cursor-pointer transition-colors"></i>
            </div>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">AI Studio Environment Ready</p>
            <p className="text-sm font-bold text-slate-400">© 2025 VisionForge Studio. MIT Licensed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
