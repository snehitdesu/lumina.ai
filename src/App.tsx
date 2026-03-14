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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

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
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("lumina_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lumina_history", JSON.stringify(history));
  }, [history]);

  const validateIdea = async () => {
    if (!idea.trim()) return;

    setIsThinking(true);
    setError(null);
    setResult(null);

    if (!GEMINI_API_KEY) {
      setError("API key missing.");
      setIsThinking(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `You are a world-class startup investor and market analyst.
Analyze the following startup idea.

Respond ONLY in JSON with keys:
marketPotential
risks
suggestions

Idea: ${idea}`,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;

      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(jsonStr);

        setResult(parsed);

        setHistory((prev) => [
          {
            id: Math.random().toString(36).substring(2),
            timestamp: Date.now(),
            idea,
            result: parsed,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("AI analysis failed. Try again.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">

      <h1 className="text-4xl font-bold mb-10 flex items-center gap-3">
        <Sparkles /> Lumina AI
      </h1>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Enter your startup idea..."
        className="w-full max-w-2xl p-4 bg-zinc-900 rounded-xl mb-6"
      />

      <button
        onClick={validateIdea}
        disabled={isThinking}
        className="px-6 py-3 bg-purple-600 rounded-xl flex items-center gap-2"
      >
        {isThinking ? <Loader2 className="animate-spin" /> : <Send />}
        Analyze Idea
      </button>

      {error && <p className="text-red-400 mt-6">{error}</p>}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl">
          <Flashcard title="Market Potential" content={result.marketPotential} />
          <Flashcard title="Risks" content={result.risks} />
          <Flashcard title="Suggestions" content={result.suggestions} />
        </div>
      )}

    </div>
  );
}