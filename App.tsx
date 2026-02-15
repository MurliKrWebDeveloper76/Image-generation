
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GenerationSettings, GeneratedImage } from './types';
import { generateImage, enhancePrompt } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import ImageCard from './components/ImageCard';

const STORAGE_KEY = 'visionforge_v3_history';

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
      <div className="w-full aspect-square skeleton rounded-xl flex items-center justify-center bg-slate-950/40">
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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [shouldEnhance, setShouldEnhance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showKeySelection, setShowKeySelection] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const studioRef = useRef<HTMLDivElement>(null);

  const checkKeyStatus = async () => {
    if (process.env.API_KEY) {
      setHasKey(true);
      return;
    }
    if (window.aistudio) {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (!selected) setShowKeySelection(true);
      } catch (e) {
        setHasKey(false);
      }
    }
  };

  useEffect(() => {
    checkKeyStatus();
  }, []);

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleKeySelection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setShowKeySelection(false);
      setHasKey(true);
    }
  };

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerate = async () => {
    if (!settings.prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    scrollToStudio();

    let finalPrompt = settings.prompt;

    try {
      if (shouldEnhance) {
        setIsEnhancing(true);
        finalPrompt = await enhancePrompt(settings.prompt);
        setIsEnhancing(false);
      }

      const result = await generateImage({ ...settings, prompt: finalPrompt });
      
      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substring(7),
        url: result.imageUrl,
        prompt: finalPrompt,
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
      if (err.message === 'API_KEY_ERROR') {
        setError("API Key selection required for local workspace.");
        setShowKeySelection(true);
        setHasKey(false);
      } else if (err.message.includes("safety")) {
        setError("Content policy violation: The prompt or result was filtered.");
      } else {
        setError(err.message || "An unexpected error occurred during synthesis.");
      }
    } finally {
      setIsGenerating(false);
      setIsEnhancing(false);
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
      {/* Key Selection Modal */}
      {showKeySelection && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"></div>
          <div className="relative glass p-10 rounded-3xl border-blue-500/20 max-w-lg w-full text-center shadow-[0_0_100px_rgba(59,130,246,0.15)] animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
              <i className="fas fa-key text-blue-400 text-3xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">API Key Required</h2>
            <p className="text-slate-400 mb-8 leading-relaxed font-medium">
              To enable local image generation, you must select an active API key from a paid project.
              <br />
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-400 underline hover:text-blue-300 transition-colors mt-2 inline-block text-xs font-bold uppercase tracking-widest">Billing Docs</a>
            </p>
            <button 
              onClick={handleKeySelection}
              className="w-full py-4 accent-gradient rounded-xl font-bold uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all glow-hover"
            >
              Select Secure Local Key
            </button>
            <button onClick={() => setShowKeySelection(false)} className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] hover:text-slate-300">Close</button>
          </div>
        </div>
      )}

      {/* Background Ambience */}
      <div className="bg-blob top-[-200px] left-[-200px] opacity-20"></div>
      <div className="bg-blob bottom-[-400px] right-[-300px] opacity-10"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] px-8 py-5 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              Vision<span className="text-blue-400">Forge</span>
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-slate-500 border border-white/5 tracking-widest uppercase">Local</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
              <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                API Status: {hasKey ? 'Securely Connected' : 'Action Required'}
              </span>
              <button 
                onClick={handleKeySelection} 
                className="ml-2 text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 hover:bg-blue-500/20 transition-all font-black"
              >
                MANAGE
              </button>
            </div>
            <button 
              onClick={scrollToStudio}
              className="px-5 py-2 accent-gradient rounded-full text-white glow-hover transition-all btn-premium active:scale-95 text-xs font-bold uppercase tracking-widest"
            >
              Enter Workspace
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
            Synthetic <span className="text-gradient">Imagination</span> <br /> Forged Locally.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            A premium workspace for AI art generation. Harness Gemini 2.5 Flash and Studio Pro 3 with secure local API integration.
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
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Enhancer</span>
                  <button 
                    onClick={() => setShouldEnhance(!shouldEnhance)}
                    className={`w-10 h-5 rounded-full relative transition-all border ${shouldEnhance ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-white/5'}`}
                  >
                    <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${shouldEnhance ? 'left-5.5' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={settings.prompt}
                  onChange={(e) => setSettings(prev => ({ ...prev, prompt: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                  placeholder={settings.referenceImage ? "Instruct the AI to transform this seed image..." : "A hyper-realistic cyberpunk city at night, neon lights reflecting on wet asphalt..."}
                  className="w-full h-40 bg-slate-950/30 border border-white/5 rounded-xl p-6 text-lg text-slate-100 focus:outline-none focus:border-blue-500/30 resize-none transition-all placeholder:text-slate-600 focus:bg-slate-950/50 shadow-inner"
                />
                {isEnhancing && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center rounded-xl z-10 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4">
                      <i className="fas fa-wand-magic-sparkles text-blue-400 text-2xl animate-pulse"></i>
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Enhancing your prompt with Gemini...</span>
                    </div>
                  </div>
                )}
              </div>
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 font-bold text-xs uppercase tracking-tight animate-in slide-in-from-left-2 duration-300">
                  <i className="fas fa-circle-exclamation text-sm mt-0.5"></i>
                  <div className="flex-1">
                    <p>{error}</p>
                    <button onClick={handleKeySelection} className="mt-2 text-blue-400 underline uppercase tracking-widest text-[10px] block text-left">Update Key Selection</button>
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
                <button onClick={() => setHistory([])} className="text-[10px] font-bold text-slate-600 hover:text-red-400 transition-all uppercase tracking-widest">Clear History</button>
              </div>

              <div className="columns-1 md:columns-2 gap-6 space-y-6">
                {isGenerating && <SkeletonCard />}
                {history.length === 0 && !isGenerating ? (
                  <div className="h-80 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-slate-950/20 group col-span-2">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-inner">
                      <i className="fas fa-palette text-slate-700 text-2xl"></i>
                    </div>
                    <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[10px]">Ready for synthesis</p>
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 accent-gradient rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-bolt text-white text-[10px]"></i>
              </div>
              <span className="text-lg font-bold tracking-tight text-white uppercase">VisionForge</span>
            </div>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Local API Synthetic Workspace</p>
          </div>
          <div className="text-slate-500 text-xs">
            © 2025 VisionForge Studio. MIT Licensed.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
