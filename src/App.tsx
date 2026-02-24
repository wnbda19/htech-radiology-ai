import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Upload, 
  Image as ImageIcon, 
  Camera, 
  ChevronRight, 
  Languages, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  ExternalLink,
  Info,
  History,
  Trash2,
  Clock,
  Sun,
  Moon,
  Volume2,
  Send,
  MessageSquare,
  Stethoscope,
  FileText,
  TrendingUp,
  Activity,
  AlertTriangle,
  Share2,
  BookOpen,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeMedicalImage, generateSpeech, askFollowUp, validateImageQuality, generateLiaisonReports, getTermDefinition } from './services/gemini';
import { translations, type Language } from './constants';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const LanguageToggle = ({ lang, setLang }: { lang: Language, setLang: (l: Language) => void }) => (
  <button 
    onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-(--color-bg-card) shadow-sm border border-(--color-border-main) hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
  >
    <Languages size={18} className="text-medical-primary" />
    <span className="text-sm font-medium">{lang === 'en' ? 'العربية' : 'English'}</span>
  </button>
);

const ThemeToggle = ({ theme, setTheme, lang }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void, lang: Language }) => {
  const t = translations[lang];
  return (
    <button 
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-full bg-(--color-bg-card) shadow-sm border border-(--color-border-main) hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-medical-primary"
      title={theme === 'light' ? t.theme_dark : t.theme_light}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

const DisclaimerModal = ({ lang, onAccept }: { lang: Language, onAccept: () => void }) => {
  const [accepted, setAccepted] = useState(false);
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "bg-(--color-bg-card) rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden",
          lang === 'ar' ? 'rtl' : 'ltr'
        )}
      >
        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl text-amber-600 dark:text-amber-400">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">{t.disclaimer_title}</h2>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-(--color-text-main) opacity-80 leading-relaxed">
            {t.disclaimer_body}
          </p>
          
          <label className="flex items-start gap-4 p-4 rounded-2xl bg-(--color-bg-main) border border-(--color-border-main) cursor-pointer group transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
            />
            <span className="text-sm font-medium text-(--color-text-main) select-none">
              {t.disclaimer_agreement}
            </span>
          </label>
          
          <button
            disabled={!accepted}
            onClick={onAccept}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2",
              accepted 
                ? "bg-medical-primary text-white shadow-lg shadow-medical-primary/20 hover:bg-medical-accent" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {t.proceed}
            <ChevronRight size={20} className={cn(lang === 'ar' && "rotate-180")} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const GlossaryModal = ({ term, lang, onClose }: { term: string, lang: Language, onClose: () => void }) => {
  const [definition, setDefinition] = useState<{en: string, ar: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  useEffect(() => {
    const fetchDef = async () => {
      try {
        const data = await getTermDefinition(term);
        setDefinition({ en: data.definition_en, ar: data.definition_ar });
      } catch (err: any) {
        console.error(err);
        const msg = err.message || "";
        if (msg.includes("quota") || msg.includes("429")) {
          setError(t.error_quota);
        } else {
          setError(t.error_generic);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDef();
  }, [term, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={cn(
          "bg-(--color-bg-card) rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden",
          lang === 'ar' ? 'rtl' : 'ltr'
        )}
      >
        <div className="p-4 border-b border-(--color-border-main) flex items-center justify-between">
          <div className="flex items-center gap-2 text-medical-primary">
            <BookOpen size={20} />
            <h3 className="font-bold">{t.glossary_title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-(--color-text-muted)" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <h4 className="text-xl font-bold text-(--color-text-main)">{term}</h4>
          {loading ? (
            <div className="flex items-center gap-2 text-(--color-text-muted) animate-pulse">
              <Loader2 className="animate-spin" size={16} />
              <span>{t.chat_loading}</span>
            </div>
          ) : definition ? (
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {definition.en}
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed border-t border-(--color-border-main) pt-4">
                {definition.ar}
              </p>
            </div>
          ) : (
            <p className="text-rose-500">{error || t.error_generic}</p>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-medical-primary text-white font-bold hover:bg-medical-accent transition-all"
          >
            {t.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AnalysisCard = ({ finding, lang, onDefine }: { finding: any, lang: Language, onDefine: (term: string) => void }) => {
  const t = translations[lang];
  const isAr = lang === 'ar';
  
  const severityColors = {
    low: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    high: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-(--color-bg-card) rounded-2xl border border-(--color-border-main) p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-(--color-text-main)">
            {isAr ? finding.name_ar : finding.name_en}
          </h3>
          <button 
            onClick={() => onDefine(isAr ? finding.name_ar : finding.name_en)}
            className="flex items-center gap-1 text-xs text-medical-primary font-bold hover:underline"
          >
            <BookOpen size={12} />
            {t.glossary_title}
          </button>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider",
          severityColors[finding.severity as keyof typeof severityColors] || severityColors.low
        )}>
          {t[`severity_${finding.severity}` as keyof typeof t] || finding.severity}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs font-medium text-(--color-text-muted) mb-1">
          <span>{t.confidence}</span>
          <span>{finding.confidence}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${finding.confidence}%` }}
            className={cn(
              "h-full rounded-full",
              finding.confidence > 80 ? "bg-emerald-500" : finding.confidence > 50 ? "bg-amber-500" : "bg-rose-500"
            )}
          />
        </div>
      </div>
      
      <p className="text-sm text-(--color-text-main) opacity-80 leading-relaxed mb-4">
        {isAr ? finding.explanation_ar : finding.explanation_en}
      </p>
      
      <button className="flex items-center gap-2 text-medical-primary text-sm font-bold hover:underline">
        <ExternalLink size={14} />
        {t.learn_more}
      </button>
    </motion.div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hasAccepted, setHasAccepted] = useState(false);
  const [storageConsent, setStorageConsent] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'up' | 'down' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isValidatingQuality, setIsValidatingQuality] = useState(false);
  const [shouldCompare, setShouldCompare] = useState(false);
  const [liaisonReports, setLiaisonReports] = useState<any>(null);
  const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const t = translations[lang];
  const isAr = lang === 'ar';

  // Load history, consent, and theme on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('htect_history');
    const savedConsent = localStorage.getItem('htect_storage_consent');
    const savedTheme = localStorage.getItem('htect_theme') as 'light' | 'dark' | null;
    
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedConsent) setStorageConsent(JSON.parse(savedConsent));
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('htect_theme', theme);
  }, [theme]);

  const saveToHistory = (newResult: any, imgData: string) => {
    if (!storageConsent) return;
    
    const historyItem = {
      id: Date.now(),
      date: new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US'),
      image: imgData,
      results: newResult
    };
    
    const updatedHistory = [historyItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem('htect_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('htect_history');
  };

  const toggleStorageConsent = (val: boolean) => {
    setStorageConsent(val);
    localStorage.setItem('htect_storage_consent', JSON.stringify(val));
    if (!val) {
      clearHistory();
      localStorage.removeItem('htect_feedback');
    }
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackType) return;
    
    const feedbackData = {
      id: Date.now(),
      type: feedbackType,
      text: feedbackText,
      timestamp: new Date().toISOString(),
    };

    if (storageConsent) {
      const existingFeedback = JSON.parse(localStorage.getItem('htect_feedback') || '[]');
      localStorage.setItem('htect_feedback', JSON.stringify([...existingFeedback, feedbackData]));
    }
    
    setSubmittedFeedback(true);
  };

  const handleTTS = async () => {
    if (!results || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const summary = isAr ? results.summary_ar : results.summary_en;
      const audioBase64 = await generateSpeech(summary, lang);
      if (audioBase64) {
        // Decode base64 to raw bytes
        const binaryString = window.atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Int16Array(len / 2);
        for (let i = 0; i < len; i += 2) {
          // PCM 16-bit is little-endian
          bytes[i / 2] = binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8);
        }

        // Use Web Audio API for raw PCM playback
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const audioContext = new AudioContextClass({ sampleRate: 24000 });
        const audioBuffer = audioContext.createBuffer(1, bytes.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert 16-bit PCM to float [-1, 1]
        for (let i = 0; i < bytes.length; i++) {
          channelData[i] = bytes[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      }
    } catch (err: any) {
      console.error("TTS failed:", err);
      const msg = err.message || "";
      if (msg.includes("quota") || msg.includes("429")) {
        setError(t.error_quota);
      }
      setIsSpeaking(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatQuestion.trim() || !results || isChatLoading) return;
    
    const userMsg = chatQuestion;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatQuestion('');
    setIsChatLoading(true);

    try {
      const summary = isAr ? results.summary_ar : results.summary_en;
      const response = await askFollowUp(userMsg, summary, history);
      setChatMessages(prev => [...prev, { role: 'ai', text: response || '' }]);
    } catch (err: any) {
      console.error("Chat failed:", err);
      const msg = err.message || "";
      if (msg.includes("quota") || msg.includes("429")) {
        setChatMessages(prev => [...prev, { role: 'ai', text: t.error_quota }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: t.error_generic }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError(t.error_invalid_image);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResults(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    setIsValidatingQuality(true);
    
    try {
      const mimeType = image.split(';')[0].split(':')[1];
      
      // 1. Quality Check
      const quality = await validateImageQuality(image, mimeType);
      if (!quality.is_valid) {
        setError(t[quality.error_code as keyof typeof t] || t.error_generic);
        setIsAnalyzing(false);
        setIsValidatingQuality(false);
        return;
      }
      
      setIsValidatingQuality(false);

      // 2. Analysis (with optional comparison)
      const previousImage = shouldCompare && history.length > 0 ? history[0].image : undefined;
      const data = await analyzeMedicalImage(image, mimeType, previousImage);
      setResults(data);
      saveToHistory(data, image);
    } catch (err: any) {
      console.error("Analysis error:", err);
      const errorMessage = err.message || "";
      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        setError(t.error_quota);
      } else {
        const errorCode = errorMessage as keyof typeof t;
        setError(t[errorCode] || t.error_generic);
      }
    } finally {
      setIsAnalyzing(false);
      setIsValidatingQuality(false);
    }
  };

  const handleGenerateReports = async () => {
    if (!results || isGeneratingReports) return;
    setIsGeneratingReports(true);
    try {
      const context = JSON.stringify(results);
      const reports = await generateLiaisonReports(context);
      setLiaisonReports(reports);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setIsGeneratingReports(false);
    }
  };

  const handleShare = async () => {
    if (!results) return;
    
    const topFindings = results.findings.slice(0, 3).map((f: any) => 
      `- ${f.name_en} / ${f.name_ar} (${f.confidence}%)`
    ).join('\n');

    const shareText = `
🏥 ${t.app_name} - Medical Scan Analysis
----------------------------------
${topFindings}

⚠️ ${t.share_disclaimer}
----------------------------------
Generated on: ${new Date().toLocaleDateString()}
`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t.share_subject,
          text: shareText,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert("Results copied to clipboard!");
    }
  };

  const reset = () => {
    setImage(null);
    setResults(null);
    setError(null);
    setFeedbackType(null);
    setFeedbackText('');
    setSubmittedFeedback(false);
    setChatMessages([]);
    setChatQuestion('');
    setLiaisonReports(null);
    setShouldCompare(false);
    setSelectedTerm(null);
  };

  return (
    <div className={cn(
      "min-h-screen bg-(--color-bg-main) font-sans pb-12",
      isAr ? "rtl" : "ltr"
    )}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-(--color-bg-card)/80 backdrop-blur-md border-b border-(--color-border-main)">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medical-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-medical-primary/20">
              <Info size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-(--color-text-main)">{t.app_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} lang={lang} />
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-(--color-text-main)">{t.upload_title}</h2>
                <p className="text-(--color-text-muted)">{t.upload_subtitle}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="relative group cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden" 
                  />
                  <div className="aspect-video rounded-3xl border-2 border-dashed border-(--color-border-main) bg-(--color-bg-card) flex flex-col items-center justify-center gap-4 transition-all group-hover:border-medical-primary group-hover:bg-medical-secondary/30">
                    <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 group-hover:bg-medical-primary group-hover:text-white transition-all">
                      <Upload size={40} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-(--color-text-main)">{t.gallery}</p>
                      <p className="text-sm text-(--color-text-muted)">PNG, JPG up to 4MB</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-center gap-3 p-6 rounded-3xl bg-(--color-bg-card) border border-(--color-border-main) shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden" 
                  />
                  <Camera size={24} className="text-medical-primary" />
                  <span className="text-lg font-bold text-(--color-text-main)">{t.camera}</span>
                </label>
              </div>

              {/* Comparison Option */}
              {history.length > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-medical-secondary/30 border border-medical-primary/20">
                  <input 
                    type="checkbox" 
                    checked={shouldCompare}
                    onChange={(e) => setShouldCompare(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
                  />
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-medical-primary" />
                    <span className="text-sm font-bold text-medical-primary">{t.compare_with_previous}</span>
                  </div>
                </div>
              )}

              {/* History Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-(--color-text-main)">
                    <History size={20} className="text-medical-primary" />
                    <h3 className="text-lg font-bold">{t.history_title}</h3>
                  </div>
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="text-xs font-bold text-rose-500 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 size={14} />
                      {t.delete_history}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-(--color-bg-card) border border-(--color-border-main)">
                  <input 
                    type="checkbox" 
                    checked={storageConsent}
                    onChange={(e) => toggleStorageConsent(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
                  />
                  <span className="text-sm font-medium text-(--color-text-main) opacity-80">{t.storage_consent}</span>
                </div>

                {history.length === 0 ? (
                  <div className="p-8 rounded-3xl border-2 border-dashed border-(--color-border-main) text-center text-(--color-text-muted)">
                    <p>{t.no_history}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setImage(item.image);
                          setResults(item.results);
                        }}
                        className="flex items-center gap-4 p-4 rounded-3xl bg-(--color-bg-card) border border-(--color-border-main) hover:border-medical-primary hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-(--color-border-main) shadow-inner">
                          <img src={item.image} alt="Past analysis" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              item.results.findings[0]?.severity === 'high' ? "bg-rose-500" : 
                              item.results.findings[0]?.severity === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            <p className="font-bold text-(--color-text-main) truncate">
                              {isAr ? item.results.findings[0]?.name_ar : item.results.findings[0]?.name_en}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-(--color-text-muted)">
                              <Clock size={12} />
                              <span>{item.date}</span>
                            </div>
                            <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-(--color-text-muted) uppercase tracking-wider">
                              {item.results.findings[0]?.confidence}% {t.confidence}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={20} className={cn("text-slate-300 group-hover:text-medical-primary transition-transform", isAr ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Back Button */}
              <button 
                onClick={reset}
                className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={20} className={cn(isAr && "rotate-180")} />
                {t.new_analysis}
              </button>

              {/* Image Preview */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl bg-black aspect-square md:aspect-video flex items-center justify-center">
                <img 
                  src={image} 
                  alt="Medical Scan" 
                  className="max-h-full w-auto object-contain"
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
                    <Loader2 size={48} className="animate-spin text-medical-primary" />
                    <p className="text-xl font-bold animate-pulse">
                      {isValidatingQuality ? t.quality_check_loading : t.analyzing}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {!results && !isAnalyzing && (
                <button 
                  onClick={runAnalysis}
                  className="w-full py-5 rounded-3xl bg-medical-primary text-white text-xl font-bold shadow-xl shadow-medical-primary/30 hover:bg-medical-accent transition-all flex items-center justify-center gap-3"
                >
                  <AlertCircle size={24} />
                  {t.proceed}
                </button>
              )}

              {/* Error State */}
              {error && (
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 flex items-center gap-4 text-rose-700">
                  <AlertCircle size={24} />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {/* Results */}
              {results && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-3xl bg-medical-secondary border border-medical-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 size={24} className="text-medical-primary" />
                      <h2 className="text-2xl font-bold text-(--color-text-main)">{t.results_title}</h2>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-900/30 mb-6 relative group shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                          <ShieldAlert size={18} />
                        </div>
                        <p className="text-amber-800 dark:text-amber-200 text-sm font-bold uppercase tracking-tight">
                          {t.ai_warning}
                        </p>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium pr-10">
                        {isAr ? results.summary_ar : results.summary_en}
                      </p>
                      {results.disclaimer_en && (
                        <p className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-900/20 text-xs text-amber-700 dark:text-amber-400 italic">
                          {isAr ? results.disclaimer_ar : results.disclaimer_en}
                        </p>
                      )}
                      <button 
                        onClick={handleTTS}
                        disabled={isSpeaking}
                        className={cn(
                          "absolute top-5 right-5 p-2 rounded-full transition-all shadow-sm",
                          isSpeaking ? "bg-medical-primary text-white animate-pulse" : "bg-white dark:bg-slate-800 text-slate-400 hover:bg-medical-primary hover:text-white"
                        )}
                        title={t.listen_summary}
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {results.findings.map((finding: any, idx: number) => (
                        <AnalysisCard key={idx} finding={finding} lang={lang} onDefine={setSelectedTerm} />
                      ))}
                    </div>
                  </div>

                  {/* Comparative Timeline */}
                  {results.comparison && (
                    <div className="p-6 rounded-3xl bg-(--color-bg-card) border border-(--color-border-main) space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-(--color-text-main)">
                          <TrendingUp size={20} className="text-medical-primary" />
                          <h3 className="text-lg font-bold">{t.timeline_title}</h3>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1",
                          results.comparison.trend === 'improving' ? "bg-emerald-100 text-emerald-700" : 
                          results.comparison.trend === 'declining' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                        )}>
                          <Activity size={14} />
                          {t[`trend_${results.comparison.trend}` as keyof typeof t] || results.comparison.trend}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between text-sm font-bold text-(--color-text-main)">
                          <span>{t.recovery_percentage}</span>
                          <span className="text-medical-primary">{results.comparison.recovery_progress}%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${results.comparison.recovery_progress}%` }}
                            className="h-full bg-medical-primary rounded-full shadow-sm"
                          />
                        </div>
                        <p className="text-sm text-(--color-text-muted) leading-relaxed">
                          {isAr ? results.comparison.changes_ar : results.comparison.changes_en}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Smart Physician Liaison */}
                  <div className="p-6 rounded-3xl bg-(--color-bg-card) border border-(--color-border-main) space-y-6">
                    <div className="flex items-center gap-2 text-(--color-text-main)">
                      <Stethoscope size={20} className="text-medical-primary" />
                      <h3 className="text-lg font-bold">{t.reports_title}</h3>
                    </div>

                    {!liaisonReports ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                          onClick={handleGenerateReports}
                          disabled={isGeneratingReports}
                          className="p-4 rounded-2xl border border-medical-primary/20 bg-medical-secondary/30 hover:bg-medical-secondary/50 transition-all flex flex-col items-center gap-2 text-center group"
                        >
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-medical-primary group-hover:scale-110 transition-transform">
                            {isGeneratingReports ? <Loader2 className="animate-spin" /> : <FileText />}
                          </div>
                          <span className="text-xs font-bold text-medical-primary">{t.doctor_note_btn}</span>
                        </button>
                        <button 
                          onClick={handleGenerateReports}
                          disabled={isGeneratingReports}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center gap-2 text-center group"
                        >
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-400 group-hover:scale-110 transition-transform">
                            {isGeneratingReports ? <Loader2 className="animate-spin" /> : <Activity />}
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.patient_plan_btn}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-medical-secondary/30 border border-medical-primary/10 space-y-3">
                          <h4 className="text-sm font-bold text-medical-primary flex items-center gap-2">
                            <FileText size={16} />
                            {t.doctor_note_title}
                          </h4>
                          <p className="text-sm text-(--color-text-main) leading-relaxed font-mono bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-white/50">
                            {isAr ? liaisonReports.doctor_note_ar : liaisonReports.doctor_note_en}
                          </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                          <h4 className="text-sm font-bold text-(--color-text-main) flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" />
                            {t.patient_plan_title}
                          </h4>
                          <p className="text-sm text-(--color-text-main) leading-relaxed">
                            {isAr ? liaisonReports.patient_plan_ar : liaisonReports.patient_plan_en}
                          </p>
                          
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">
                              {t.suggested_questions}
                            </h5>
                            <ul className="space-y-2">
                              {(isAr ? liaisonReports.suggested_questions_ar : liaisonReports.suggested_questions_en).map((q: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-main)">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-medical-primary flex-shrink-0" />
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Chat Assistant */}
                  <div className="p-6 rounded-3xl bg-(--color-bg-card) border border-(--color-border-main) space-y-4">
                    <div className="flex items-center gap-2 text-(--color-text-main)">
                      <MessageSquare size={20} className="text-medical-primary" />
                      <h3 className="text-lg font-bold">{t.chat_title}</h3>
                    </div>

                    <div className="space-y-4 max-h-60 overflow-y-auto p-2">
                      {chatMessages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-3 rounded-2xl max-w-[85%] text-sm",
                            msg.role === 'user' 
                              ? "bg-medical-primary text-white ml-auto" 
                              : "bg-slate-100 dark:bg-slate-800 text-(--color-text-main) mr-auto"
                          )}
                        >
                          {msg.text}
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl max-w-[85%] text-sm text-(--color-text-muted) animate-pulse flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" />
                          {t.chat_loading}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                        placeholder={t.chat_placeholder}
                        className="flex-grow p-3 rounded-2xl border border-(--color-border-main) bg-(--color-bg-main) text-(--color-text-main) text-sm outline-none focus:ring-2 focus:ring-medical-primary"
                      />
                      <button 
                        onClick={handleChatSubmit}
                        disabled={isChatLoading || !chatQuestion.trim()}
                        className="p-3 rounded-2xl bg-medical-primary text-white hover:bg-medical-accent disabled:opacity-50 transition-all"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Share Results */}
                  <button 
                    onClick={handleShare}
                    className="w-full py-4 rounded-3xl bg-white dark:bg-slate-800 border-2 border-medical-primary/20 text-medical-primary font-bold flex items-center justify-center gap-2 hover:bg-medical-secondary/20 transition-all shadow-sm"
                  >
                    <Share2 size={20} />
                    {t.share_btn}
                  </button>

                  {/* Feedback */}
                  <div className="p-8 rounded-3xl bg-(--color-bg-card) border border-(--color-border-main) text-center space-y-6">
                    {!submittedFeedback ? (
                      <>
                        <h3 className="text-lg font-bold text-(--color-text-main)">{t.feedback_prompt}</h3>
                        <div className="flex justify-center gap-6">
                          <button 
                            onClick={() => setFeedbackType('up')}
                            className={cn(
                              "w-16 h-16 rounded-full border flex items-center justify-center transition-all",
                              feedbackType === 'up' 
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200" 
                                : "border-(--color-border-main) text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200"
                            )}
                          >
                            <ThumbsUp size={28} />
                          </button>
                          <button 
                            onClick={() => setFeedbackType('down')}
                            className={cn(
                              "w-16 h-16 rounded-full border flex items-center justify-center transition-all",
                              feedbackType === 'down' 
                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200" 
                                : "border-(--color-border-main) text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                            )}
                          >
                            <ThumbsDown size={28} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {feedbackType && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-4 overflow-hidden"
                            >
                              <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder={t.feedback_placeholder}
                                className="w-full p-4 rounded-2xl border border-(--color-border-main) bg-(--color-bg-main) text-(--color-text-main) focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none resize-none h-24 text-sm"
                              />
                              <button
                                onClick={handleFeedbackSubmit}
                                className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-medical-primary text-white font-bold text-sm hover:bg-slate-800 dark:hover:bg-medical-accent transition-all"
                              >
                                {t.feedback_submit}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-4 space-y-3"
                      >
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 size={32} />
                        </div>
                        <p className="font-bold text-(--color-text-main)">{t.feedback_success}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedTerm && (
          <GlossaryModal 
            term={selectedTerm} 
            lang={lang} 
            onClose={() => setSelectedTerm(null)} 
          />
        )}
      </AnimatePresence>

      {/* Mandatory Disclaimer Modal */}
      {!hasAccepted && (
        <DisclaimerModal 
          lang={lang} 
          onAccept={() => setHasAccepted(true)} 
        />
      )}
    </div>
  );
}
