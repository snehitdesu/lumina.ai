import { motion, AnimatePresence } from "motion/react";
import { History, X, Trash2, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";

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

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  history,
  onSelectItem,
  onDeleteItem,
  onClearHistory,
}: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-obsidian/80 backdrop-blur-2xl border-l border-white/5 z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-lumina/10 flex items-center justify-center text-lumina">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl italic">Neural Archive</h2>
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30">Past Syntheses</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
                  <Clock size={48} className="mb-4" />
                  <p className="font-serif text-xl italic">The archive is empty.</p>
                  <p className="font-mono text-[10px] tracking-widest uppercase mt-2">No past visions found.</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative glass-panel p-5 rounded-2xl border border-white/5 hover:border-lumina/30 transition-all cursor-pointer"
                    onClick={() => onSelectItem(item)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-lumina/60">
                        {format(item.timestamp, "MMM d, yyyy • HH:mm")}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all text-white/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="font-serif text-lg italic text-white/80 line-clamp-2 mb-4">
                      "{item.idea}"
                    </p>
                    <div className="flex items-center justify-between text-white/20 group-hover:text-lumina transition-colors">
                      <span className="font-mono text-[8px] tracking-[0.2em] uppercase">View Analysis</span>
                      <ChevronRight size={14} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="p-8 border-t border-white/5">
                <button
                  onClick={onClearHistory}
                  className="w-full py-4 rounded-xl border border-white/5 font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-all"
                >
                  Purge Archive
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
