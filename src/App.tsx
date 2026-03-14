/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { Send, Sparkles, Loader2, ThumbsUp, ThumbsDown, MessageSquare, History as HistoryIcon, Download } from "lucide-react";
import Robot from "./components/Robot";
import Flashcard from "./components/Flashcard";
import CustomCursor from "./components/CustomCursor";
import NeuralMesh from "./components/NeuralMesh";
import NeuralLoader from "./components/NeuralLoader";
import HistorySidebar from "./components/HistorySidebar";
import ConfirmModal from "./components/ConfirmModal";

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

interface ValidationResult {
  marketPotential: string | Record<string, any>;
  risks: string | Record<string, any>;
  suggestions: string | Record<string, any>;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  idea: string;
  result: ValidationResult;
}

export default function App() {
  const [idea, setIdea] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ rating: 'up' | 'down' | null, comment: string }>({ rating: null, comment: "" });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("lumina_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("lumina_history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (newResult: ValidationResult, originalIdea: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      idea: originalIdea,
      result: newResult,
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setIdea(item.idea);
    setResult(item.result);
    setIsHistoryOpen(false);
    // Scroll to results
    setTimeout(() => {
      const resultsSection = document.getElementById('results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const submitFeedback = () => {
    // In a real app, this would send data to a backend
    console.log("Feedback submitted:", feedback);
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  };

  const validateIdea = async () => {
    if (!idea.trim()) return;
    
    setIsThinking(true);
    setError(null);
    setResult(null);

    // Scroll to results section
    setTimeout(() => {
      const resultsSection = document.getElementById('results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    if (!GEMINI_API_KEY) {
      setError("Neural core configuration missing. Please ensure the API key is set in the environment.");
      setIsThinking(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash"
        contents: `You are a world-class startup investor and market analyst. 
        Analyze the following startup idea. Use your search capabilities to check for existing competitors, market trends, and potential barriers to entry.
        
        Respond ONLY in a structured JSON format with these exact keys:
        - "marketPotential": A detailed analysis (can be a string or object).
        - "risks": A detailed analysis (can be a string or object).
        - "suggestions": Strategic advice (can be a string or object).
        
        Idea: ${idea}`,
        config: {
          systemInstruction: "You are an expert startup analyst. Always return valid JSON. If you use tools, ensure the final response is the JSON analysis.",
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text;
      if (text) {
        // Remove potential markdown wrapping if it exists (though responseMimeType should handle it)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        
        const rawParsed = JSON.parse(jsonStr);
        
        // Deep search for our keys if they are nested
        const findKey = (obj: any, targetKey: string): any => {
          if (!obj || typeof obj !== 'object') return null;
          if (targetKey in obj) return obj[targetKey];
          
          for (const key in obj) {
            const found = findKey(obj[key], targetKey);
            if (found) return found;
          }
          return null;
        };

        const normalized: ValidationResult = {
          marketPotential: findKey(rawParsed, 'marketPotential') || findKey(rawParsed, 'market_potential') || findKey(rawParsed, 'Market Potential') || "Analysis unavailable",
          risks: findKey(rawParsed, 'risks') || findKey(rawParsed, 'Risks') || "Analysis unavailable",
          suggestions: findKey(rawParsed, 'suggestions') || findKey(rawParsed, 'Suggestions') || findKey(rawParsed, 'strategic_advice') || "Analysis unavailable"
        };

        setResult(normalized);
        addToHistory(normalized, idea);
      } else {
        throw new Error("Empty response from neural core");
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError("The neural core encountered an interruption. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const formatContent = (content: any): string => {
      if (typeof content === 'string') return content;
      if (typeof content === 'object' && content !== null) {
        return Object.entries(content)
          .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toUpperCase();
            if (typeof value === 'object' && value !== null) {
              const subItems = Object.entries(value)
                .map(([sk, sv]) => `  - ${sk.toUpperCase()}: ${sv}`)
                .join('\n');
              return `${label}:\n${subItems}`;
            }
            return `${label}: ${value}`;
          })
          .join('\n\n');
      }
      return String(content);
    };

    const reportText = `
LUMINA NEURAL ANALYSIS REPORT
=============================
Date: ${new Date().toLocaleString()}
Idea: ${idea}

1. MARKET POTENTIAL
-------------------
${formatContent(result.marketPotential)}

2. RISKS
--------
${formatContent(result.risks)}

3. STRATEGIC SUGGESTIONS
------------------------
${formatContent(result.suggestions)}

=============================
Generated by Lumina Neural Core
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lumina_Analysis_${idea.slice(0, 20).replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full relative bg-obsidian text-white/90 font-sans selection:bg-lumina/30 selection:text-white overflow-x-hidden">
      <CustomCursor />
      {/* Immersive Background */}
      <div className="atmosphere-bg" />
      <NeuralMesh />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-10 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md">
            <Sparkles className="text-lumina" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl italic tracking-tight leading-none">Lumina</span>
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/30">Intelligence</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-12 font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 hover:text-lumina transition-colors group"
          >
            <HistoryIcon size={14} className="group-hover:rotate-[-30deg] transition-transform" />
            Archive
          </button>
          <a href="#vision" className="hover:text-lumina transition-colors">Vision</a>
          <a href="#results" className="hover:text-lumina transition-colors">Analytics</a>
          <div className="w-10 h-px bg-white/10" />
          <span className="text-lumina/60">v3.1.0</span>
        </div>
      </nav>

      {/* Main Content - Centered & Immersive */}
      <main className="relative z-10 flex flex-col items-center pt-40 pb-32 px-6 max-w-5xl mx-auto">
        
        {/* The Core Section */}
        <section className="flex flex-col items-center mb-24 text-center">
          <div className="mb-12 relative">
            <Robot isThinking={isThinking} />
            {/* Floating Meta Labels */}
            <div className="absolute -top-10 -left-20 font-mono text-[9px] tracking-[0.3em] uppercase text-white/20 rotate-[-90deg]">
              Neural_State: {isThinking ? "Active" : "Idle"}
            </div>
            <div className="absolute -bottom-10 -right-20 font-mono text-[9px] tracking-[0.3em] uppercase text-white/20 rotate-[90deg]">
              Processing_Unit: 0x7F
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="font-serif text-6xl md:text-8xl italic leading-[0.9] tracking-tighter mb-8 relative group">
              <span className="relative z-10">Transcend the</span> <br />
              <span className="text-lumina relative z-10">Ordinary.</span>
              
              {/* Glitch Layers */}
              <span className="absolute inset-0 text-lumina/20 translate-x-1 translate-y-1 blur-[2px] pointer-events-none group-hover:animate-pulse">Transcend the <br /> Ordinary.</span>
              <span className="absolute inset-0 text-white/10 -translate-x-1 -translate-y-1 blur-[1px] pointer-events-none group-hover:animate-pulse">Transcend the <br /> Ordinary.</span>
            </h1>
            <p className="font-serif text-2xl text-white/50 leading-relaxed italic">
              A cinematic sanctuary for your most ambitious visions. <br />
              Let the singularity validate your future.
            </p>
          </motion.div>
        </section>

        {/* Input & Interaction */}
        <section id="vision" className="w-full max-w-3xl mb-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-2 rounded-[40px] relative group"
          >
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Whisper your vision to the core..."
              className="w-full h-48 bg-transparent border-none rounded-[38px] p-10 text-white/90 placeholder:text-white/20 focus:outline-none transition-all resize-none font-serif text-2xl italic leading-relaxed"
            />
            
            {/* Neural Feedback Indicator */}
            <div className="absolute top-10 right-10 flex items-center gap-2">
              <div className="font-mono text-[8px] tracking-[0.4em] uppercase text-white/20">Signal</div>
              <motion.div 
                animate={{
                  opacity: idea.length > 0 ? [0.2, 1, 0.2] : 0.1,
                  scale: idea.length > 0 ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${idea.length > 0 ? 'bg-lumina shadow-[0_0_10px_#bc13fe]' : 'bg-white/20'}`}
              />
            </div>
            
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              <AnimatePresence>
                {idea.trim() && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={validateIdea}
                    disabled={isThinking}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-obsidian rounded-full font-mono text-xs tracking-[0.2em] uppercase hover:bg-lumina hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isThinking ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        Initiate Analysis
                        <Send size={14} />
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          {error && (
            <p className="mt-6 text-center font-mono text-[10px] text-red-400 tracking-widest uppercase opacity-80">
              {error}
            </p>
          )}
        </section>

        {/* Results Section */}
        <section id="results" className="w-full min-h-[400px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {isThinking ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <NeuralLoader />
              </motion.div>
            ) : result ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
              >
                <div className="md:col-span-2 mb-8 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-px bg-lumina/30" />
                      <h2 className="font-mono text-[10px] tracking-[0.5em] uppercase text-lumina">Analysis_Report</h2>
                    </div>
                    <p className="font-serif text-4xl italic text-white/40">The core has spoken.</p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-lumina/10 border border-lumina/20 rounded-full font-mono text-[10px] tracking-widest uppercase text-lumina hover:bg-lumina/20 transition-all"
                  >
                    <Download size={14} />
                    Download Report
                  </motion.button>
                </div>
                
                <Flashcard 
                  index={0}
                  title="Market Potential"
                  content={result.marketPotential}
                />
                <Flashcard 
                  index={1}
                  title="Risks"
                  content={result.risks}
                />
                <div className="md:col-span-2">
                  <Flashcard 
                    index={2}
                    title="Suggestions"
                    content={result.suggestions}
                  />
                </div>

                {/* Feedback Mechanism */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="md:col-span-2 mt-12 glass-panel p-10 rounded-[32px] border border-white/5"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                      <h3 className="font-serif text-2xl italic mb-2">Rate this analysis</h3>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">Help the singularity evolve.</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setFeedback(prev => ({ ...prev, rating: 'up' }))}
                        className={`p-4 rounded-full border transition-all ${feedback.rating === 'up' ? 'bg-lumina border-lumina text-white shadow-[0_0_20px_rgba(188,19,254,0.4)]' : 'border-white/10 hover:border-white/30 text-white/40'}`}
                      >
                        <ThumbsUp size={20} />
                      </button>
                      <button 
                        onClick={() => setFeedback(prev => ({ ...prev, rating: 'down' }))}
                        className={`p-4 rounded-full border transition-all ${feedback.rating === 'down' ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'border-white/10 hover:border-white/30 text-white/40'}`}
                      >
                        <ThumbsDown size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-10 relative">
                    <textarea
                      value={feedback.comment}
                      onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Optional: Share your thoughts on this neural output..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-serif text-lg italic text-white/80 placeholder:text-white/20 focus:outline-none focus:border-lumina/50 transition-all resize-none h-32"
                    />
                    <div className="absolute top-6 right-6 text-white/10">
                      <MessageSquare size={18} />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={submitFeedback}
                      disabled={feedbackSubmitted || (!feedback.rating && !feedback.comment.trim())}
                      className={`px-10 py-4 rounded-full font-mono text-[10px] tracking-[0.3em] uppercase transition-all flex items-center gap-3 ${feedbackSubmitted ? 'bg-emerald-500 text-white' : 'bg-white text-obsidian hover:bg-lumina hover:text-white disabled:opacity-30'}`}
                    >
                      {feedbackSubmitted ? (
                        <>Feedback Received</>
                      ) : (
                        <>Transmit Feedback</>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 py-20 opacity-20"
              >
                <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase">Awaiting Neural Input</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-20 flex flex-col items-center gap-12 border-t border-white/5">
        <div className="flex gap-12 font-mono text-[10px] tracking-[0.3em] uppercase text-white/20">
          <a href="#" className="hover:text-white transition-colors">Archive</a>
          <a href="#" className="hover:text-white transition-colors">Protocol</a>
          <a href="#" className="hover:text-white transition-colors">Network</a>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center">
            <Sparkles size={16} className="text-white/20" />
          </div>
          <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/10">
            © 2026 Lumina AI // Immersive Intelligence Protocol
          </p>
        </div>
      </footer>

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectItem={selectHistoryItem}
        onDeleteItem={deleteFromHistory}
        onClearHistory={() => setIsConfirmOpen(true)}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={clearHistory}
        title="Purge Archive"
        message="Are you sure you want to permanently delete all past syntheses from the neural archive?"
        confirmText="Purge All"
      />
    </div>
  );
}
