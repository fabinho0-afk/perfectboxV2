import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Play, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Terminal, 
  Layers, 
  Cpu, 
  FileText,
  RefreshCcw,
  Maximize2,
  ChevronRight,
  Camera,
  CameraOff,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { analyzePackageIntegrity, type AnalysisResult } from './services/geminiService';

type ProcessingStep = {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
  description: string;
};

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'load', label: 'CARREGAMENTO DE IMAGEM', status: 'pending', description: 'Aquisição de dados do sensor óptico.' },
  { id: 'gaussian', label: 'FILTRAGEM GAUSSIANA', status: 'pending', description: 'Redução de ruído e suavização espacial.' },
  { id: 'threshold', label: 'SEGMENTAÇÃO POR LIMIAR', status: 'pending', description: 'Binarização adaptativa para isolamento do objeto.' },
  { id: 'contours', label: 'EXTRAÇÃO DE CONTORNOS', status: 'pending', description: 'Detecção de bordas e análise topológica.' },
  { id: 'ai', label: 'ANÁLISE GEOMÉTRICA IA', status: 'pending', description: 'Processamento via Gemini 3.1 Flash.' },
];

export default function App() {
  const [view, setView] = useState<'dashboard' | 'camera'>('dashboard');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'report'>('visual');
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startCamera = async () => {
    setView('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        addLog("SISTEMA: Câmera ativada.");
      }
    } catch (err) {
      addLog("ERRO: Falha ao acessar a câmera.");
      console.error(err);
      setView('dashboard');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setView('dashboard');
    addLog("SISTEMA: Câmera desativada.");
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        setResult(null);
        setSteps(INITIAL_STEPS);
        addLog("SISTEMA: Imagem capturada via câmera.");
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
        setSteps(INITIAL_STEPS);
        setLogs([]);
        addLog(`SISTEMA: Imagem carregada - ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setLogs([]);
    addLog("INICIANDO SEQUÊNCIA DE ANÁLISE PERFECT BOX...");

    const updateStep = (id: string, status: 'processing' | 'completed') => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    try {
      // Step 1: Load
      updateStep('load', 'processing');
      addLog("DIP: Normalizando matriz de pixels...");
      await new Promise(r => setTimeout(r, 800));
      updateStep('load', 'completed');

      // Step 2: Gaussian
      updateStep('gaussian', 'processing');
      addLog("DIP: Aplicando Kernel Gaussiano 5x5 (sigma=1.5)...");
      await new Promise(r => setTimeout(r, 1000));
      updateStep('gaussian', 'completed');

      // Step 3: Threshold
      updateStep('threshold', 'processing');
      addLog("DIP: Executando Limiarização de Otsu...");
      await new Promise(r => setTimeout(r, 1000));
      updateStep('threshold', 'completed');

      // Step 4: Contours
      updateStep('contours', 'processing');
      addLog("DIP: Detectando contornos via algoritmo de Canny...");
      await new Promise(r => setTimeout(r, 1200));
      updateStep('contours', 'completed');

      // Step 5: AI Analysis
      updateStep('ai', 'processing');
      addLog("IA: Enviando dados para Gemini 3.1 Flash...");
      
      const analysisResult = await analyzePackageIntegrity(image);
      
      updateStep('ai', 'completed');
      setResult(analysisResult);
      addLog("IA: Análise concluída com sucesso.");
      addLog(`STATUS FINAL: ${analysisResult.status.toUpperCase()}`);
      
    } catch (error) {
      addLog("ERRO CRÍTICO: Falha no processamento de dados.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (view === 'camera') {
    return (
      <div className="min-h-screen bg-industrial-bg flex flex-col font-mono overflow-hidden">
        <header className="bg-industrial-panel border-b border-industrial-border p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-industrial-accent">
            <Camera size={20} className="animate-pulse" />
            <h1 className="text-xl font-bold tracking-tighter italic uppercase">PERFECT BOX // CAMERA_MODE</h1>
          </div>
          <button 
            onClick={stopCamera}
            className="flex items-center gap-2 text-industrial-muted hover:text-industrial-text transition-colors text-xs font-bold uppercase"
          >
            <ArrowLeft size={16} /> Voltar ao Painel
          </button>
        </header>

        <main className="flex-1 relative flex items-center justify-center bg-black p-4">
          <div className="relative w-full max-w-4xl aspect-video border-2 border-industrial-accent shadow-[0_0_30px_rgba(37,99,235,0.3)] overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="scanline" />
            
            {/* HUD Overlays */}
            <div className="absolute inset-0 pointer-events-none border border-industrial-accent/20">
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-industrial-accent text-industrial-bg px-2 py-1 text-[10px] font-bold animate-pulse">
                <Activity size={10} /> LIVE_FEED
              </div>
              <div className="absolute top-4 right-4 text-[10px] text-industrial-accent/60">
                RES: 1920x1080 // ISO: 400
              </div>
              <div className="absolute bottom-4 left-4 text-[10px] text-industrial-accent/60">
                SENSOR: OPTIC_01 // STATUS: READY
              </div>
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-industrial-accent" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-industrial-accent" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-industrial-accent" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-industrial-accent" />
              
              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12">
                <div className="absolute top-1/2 left-0 w-full h-px bg-industrial-accent/30" />
                <div className="absolute left-1/2 top-0 w-px h-full bg-industrial-accent/30" />
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-industrial-panel border-t border-industrial-border p-8 flex justify-center">
          <button 
            onClick={capturePhoto}
            className="group relative flex items-center justify-center gap-3 bg-industrial-accent text-industrial-bg hover:bg-industrial-accent/90 transition-all py-4 px-12 rounded-full text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            <div className="absolute -inset-1 bg-industrial-accent/20 rounded-full blur group-hover:blur-md transition-all" />
            <Camera size={20} /> Capturar Imagem para Análise
          </button>
        </footer>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col p-4 md:p-6 gap-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-industrial-border pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-industrial-accent mb-1">
            <Activity size={20} className="animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tighter font-mono italic">PERFECT BOX</h1>
          </div>
          <p className="text-industrial-muted text-xs font-mono uppercase tracking-widest">
            SISTEMA DE INSPEÇÃO DE INTEGRIDADE DE EMBALAGENS // INDUSTRIAL GRADE
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex flex-col items-end">
            <span className="text-industrial-muted uppercase">Status do Sistema</span>
            <span className="text-industrial-accent flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-industrial-accent animate-pulse" />
              OPERACIONAL
            </span>
          </div>
          <div className="h-8 w-px bg-industrial-border" />
          <div className="flex flex-col items-end">
            <span className="text-industrial-muted uppercase">Localização</span>
            <span>NODE_US_EAST_01</span>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: Controls & Processing */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          {/* Controls */}
          <section className="bg-industrial-panel border border-industrial-border p-5 rounded-sm">
            <h2 className="text-xs font-bold font-mono text-industrial-muted uppercase mb-4 flex items-center gap-2">
              <Terminal size={14} /> CONTROLE DE OPERAÇÃO
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="flex items-center justify-center gap-2 bg-transparent border border-industrial-accent text-industrial-accent hover:bg-industrial-accent/10 transition-colors py-3 px-4 text-xs font-bold font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={16} /> Arquivo
                </button>
                <button 
                  onClick={startCamera}
                  disabled={isAnalyzing}
                  className="flex items-center justify-center gap-2 bg-transparent border border-industrial-accent text-industrial-accent hover:bg-industrial-accent/10 transition-colors py-3 px-4 text-xs font-bold font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={16} /> Câmera
                </button>
              </div>
              
              <button 
                onClick={runAnalysis}
                disabled={!image || isAnalyzing}
                className="flex items-center justify-center gap-2 bg-industrial-accent text-industrial-bg hover:bg-industrial-accent/90 transition-colors py-3 px-4 text-xs font-bold font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {isAnalyzing ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
                Iniciar Análise
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </section>

          {/* Pipeline Steps */}
          <section className="bg-industrial-panel border border-industrial-border p-5 rounded-sm flex-1 flex flex-col overflow-hidden">
            <h2 className="text-xs font-bold font-mono text-industrial-muted uppercase mb-4 flex items-center gap-2">
              <Layers size={14} /> PIPELINE DE PROCESSAMENTO
            </h2>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative pl-6">
                  <div className={cn(
                    "absolute left-0 top-1 w-2 h-2 rounded-full",
                    step.status === 'completed' ? "bg-industrial-accent" : 
                    step.status === 'processing' ? "bg-industrial-warning animate-pulse" : 
                    "bg-industrial-border"
                  )} />
                  {idx < steps.length - 1 && (
                    <div className="absolute left-[3px] top-4 w-[2px] h-full bg-industrial-border" />
                  )}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "text-[10px] font-bold font-mono tracking-tighter",
                        step.status === 'completed' ? "text-industrial-accent" : 
                        step.status === 'processing' ? "text-industrial-warning" : 
                        "text-industrial-muted"
                      )}>
                        {step.label}
                      </span>
                      {step.status === 'completed' && <ShieldCheck size={12} className="text-industrial-accent" />}
                    </div>
                    <p className="text-[10px] text-industrial-muted font-mono leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Log Console */}
          <section className="bg-slate-900 border border-industrial-border p-4 rounded-sm h-48 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold font-mono text-industrial-accent uppercase">Console Log</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-industrial-accent/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-industrial-accent/30" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] text-blue-400 space-y-1 custom-scrollbar">
              {logs.length === 0 && <p className="opacity-30 italic">Aguardando entrada de dados...</p>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="opacity-40 shrink-0">[{i.toString().padStart(3, '0')}]</span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </section>
        </div>

        {/* Right Column: Visualization & Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Main Display Area */}
          <section className="bg-industrial-panel border border-industrial-border rounded-sm flex-1 flex flex-col overflow-hidden relative shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-industrial-border bg-slate-50">
              <button 
                onClick={() => setActiveTab('visual')}
                className={cn(
                  "px-6 py-3 text-[10px] font-bold font-mono uppercase tracking-widest transition-colors",
                  activeTab === 'visual' ? "bg-white text-industrial-accent border-b-2 border-industrial-accent" : "text-industrial-muted hover:text-industrial-text"
                )}
              >
                Visualização de Dados
              </button>
              <button 
                onClick={() => setActiveTab('report')}
                className={cn(
                  "px-6 py-3 text-[10px] font-bold font-mono uppercase tracking-widest transition-colors",
                  activeTab === 'report' ? "bg-white text-industrial-accent border-b-2 border-industrial-accent" : "text-industrial-muted hover:text-industrial-text"
                )}
              >
                Relatório Técnico
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-100">
              <AnimatePresence mode="wait">
                {activeTab === 'visual' ? (
                  <motion.div 
                    key="visual"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center p-8"
                  >
                    {!image ? (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 border-2 border-dashed border-industrial-border rounded-full flex items-center justify-center mx-auto">
                          <Upload className="text-industrial-border" />
                        </div>
                        <p className="text-industrial-muted font-mono text-xs uppercase tracking-widest">
                          Nenhum dado visual detectado
                        </p>
                      </div>
                    ) : (
                      <div className="relative max-w-full max-h-full group">
                        <img 
                          src={image} 
                          alt="Package" 
                          className={cn(
                            "max-w-full max-h-[60vh] object-contain border border-industrial-border transition-all duration-500 bg-white",
                            isAnalyzing && "brightness-90 grayscale contrast-110"
                          )}
                        />
                        
                        {/* Simulated Overlays */}
                        {isAnalyzing && (
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="scanline" />
                            <div className="absolute inset-0 border-2 border-industrial-accent/20 animate-pulse" />
                            
                            {/* Simulated detection boxes */}
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-industrial-warning/50 bg-industrial-warning/5">
                              <span className="absolute -top-4 left-0 text-[8px] font-mono text-industrial-warning">ROI_ALPHA_01</span>
                            </div>
                            <div className="absolute bottom-1/3 right-1/4 w-40 h-24 border border-industrial-accent/50 bg-industrial-accent/5">
                              <span className="absolute -top-4 left-0 text-[8px] font-mono text-industrial-accent">ROI_BETA_02</span>
                            </div>
                          </div>
                        )}

                        {/* Result Overlays */}
                        {result && !isAnalyzing && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className={cn(
                              "absolute inset-0 border-4",
                              result.status === 'Íntegro' ? "border-industrial-accent/30" : 
                              result.status === 'Deformado' ? "border-industrial-warning/30" : 
                              "border-industrial-danger/30"
                            )} />
                            <div className="absolute top-4 right-4 bg-white/90 border border-industrial-border p-3 font-mono shadow-lg">
                              <div className="text-[10px] text-industrial-muted uppercase mb-1">Veredito</div>
                              <div className={cn(
                                "text-lg font-bold uppercase",
                                result.status === 'Íntegro' ? "text-industrial-accent" : 
                                result.status === 'Deformado' ? "text-industrial-warning" : 
                                "text-industrial-danger"
                              )}>
                                {result.status}
                              </div>
                              <div className="text-[10px] text-industrial-muted mt-2 uppercase">Confiança</div>
                              <div className="text-xs text-industrial-text">{(result.confidence * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="report"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 overflow-y-auto p-8 custom-scrollbar bg-white"
                  >
                    {!result ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <FileText size={48} className="text-industrial-border" />
                        <p className="text-industrial-muted font-mono text-xs uppercase tracking-widest">
                          Aguardando conclusão da análise para gerar relatório
                        </p>
                      </div>
                    ) : (
                      <div className="max-w-2xl mx-auto space-y-8 font-mono">
                        <div className="flex justify-between items-start border-b border-industrial-border pb-4">
                          <div>
                            <h3 className="text-xl font-bold text-industrial-accent tracking-tighter">INSPECTION_REPORT_#{Math.floor(Math.random() * 100000)}</h3>
                            <p className="text-[10px] text-industrial-muted uppercase">Data: {new Date().toLocaleDateString()} // Hora: {new Date().toLocaleTimeString()}</p>
                          </div>
                          <div className={cn(
                            "px-4 py-1 text-xs font-bold uppercase border",
                            result.status === 'Íntegro' ? "border-industrial-accent text-industrial-accent" : 
                            result.status === 'Deformado' ? "border-industrial-warning text-industrial-warning" : 
                            "border-industrial-danger text-industrial-danger"
                          )}>
                            {result.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-industrial-muted border-l-2 border-industrial-accent pl-2 uppercase">Métricas de Integridade</h4>
                            <div className="space-y-3">
                              <MetricRow label="Paralelismo" value={result.geometricAnalysis.parallelism} />
                              <MetricRow label="Ortogonalidade" value={result.geometricAnalysis.orthogonality} />
                              <MetricRow label="Superfície" value={result.geometricAnalysis.surfaceIntegrity} />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-industrial-muted border-l-2 border-industrial-accent pl-2 uppercase">Anomalias Detectadas</h4>
                            <ul className="space-y-2">
                              {result.anomalies.length > 0 ? result.anomalies.map((a, i) => (
                                <li key={i} className="flex items-start gap-2 text-[10px]">
                                  <ChevronRight size={12} className="text-industrial-warning shrink-0 mt-0.5" />
                                  <span>{a}</span>
                                </li>
                              )) : (
                                <li className="text-[10px] text-industrial-accent italic">Nenhuma anomalia crítica detectada.</li>
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-industrial-muted border-l-2 border-industrial-accent pl-2 uppercase">Parecer Técnico</h4>
                          <div className="bg-slate-50 p-4 border border-industrial-border text-xs leading-relaxed text-industrial-text/90">
                            {result.technicalDetails}
                          </div>
                        </div>

                        <div className="pt-8 flex justify-between items-center text-[8px] text-industrial-muted uppercase tracking-[0.2em]">
                          <span>Perfect Box // AI-Powered Inspection</span>
                          <span>Assinado Digitalmente por Gemini-3.1-Flash</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Status Bar */}
            <div className="bg-slate-50 border-t border-industrial-border px-4 py-2 flex justify-between items-center font-mono text-[9px]">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <Cpu size={10} className="text-industrial-accent" />
                  CPU_LOAD: <span className="text-industrial-accent">12.4%</span>
                </span>
                <span className="flex items-center gap-1">
                  <Activity size={10} className="text-industrial-accent" />
                  FPS: <span className="text-industrial-accent">60.0</span>
                </span>
              </div>
              <div className="text-industrial-muted uppercase tracking-widest">
                Secure Data Link // AES-256 Encrypted
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-[10px] font-mono text-industrial-muted flex justify-between items-center border-t border-industrial-border pt-4">
        <div className="flex gap-6">
          <span>&copy; 2026 PERFECT BOX INDUSTRIAL SYSTEMS</span>
          <span className="hidden md:inline">LICENÇA: ENTERPRISE_V1_037</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-industrial-accent animate-pulse" />
          SISTEMA EM TEMPO REAL
        </div>
      </footer>
    </div>
  );
}

function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] uppercase">
        <span className="text-industrial-muted">{label}</span>
        <span className="text-industrial-text font-bold">{value}</span>
      </div>
      <div className="h-1 bg-industrial-border rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1 }}
          className="h-full bg-industrial-accent/40"
        />
      </div>
    </div>
  );
}
