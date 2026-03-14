import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { Maximize2, Minimize2, Sparkles } from "lucide-react";

interface FlashcardProps {
  title: string;
  content: string | Record<string, any>;
  index: number;
}

export default function Flashcard({ title, content, index }: FlashcardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        rotateX: isExpanded ? 0 : rotateX,
        rotateY: isExpanded ? 0 : rotateY,
        transformStyle: "preserve-3d",
        zIndex: isExpanded ? 50 : 1,
        perspective: "1000px",
      }}
      className={`glass-panel p-8 rounded-[32px] w-full flex flex-col gap-6 group relative overflow-hidden cursor-pointer transition-all duration-500 ${
        isExpanded ? "ring-1 ring-lumina/50 shadow-[0_0_50px_rgba(139,92,246,0.2)]" : "hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]"
      }`}
    >
      {/* Subtle Glare */}
      <motion.div
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 80%)",
          left: useTransform(mouseXSpring, [-0.5, 0.5], ["-20%", "20%"]),
          top: useTransform(mouseYSpring, [-0.5, 0.5], ["-20%", "20%"]),
        }}
        className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      <div className="flex flex-col gap-6 relative z-10 w-full" style={{ transformStyle: "preserve-3d" }}>
        <div className="flex items-center justify-between w-full" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-lumina/10 flex items-center justify-center border border-lumina/20">
              <Sparkles size={16} className="text-lumina" />
            </div>
            <motion.h3 
              layout
              className="text-white font-serif text-3xl italic tracking-tight"
            >
              {title}
            </motion.h3>
          </div>
          <motion.div 
            layout
            className="text-white/30 group-hover:text-lumina transition-colors"
          >
            {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </motion.div>
        </div>

        <motion.div 
          layout
          style={{ transform: "translateZ(20px)" }}
          className={`text-white/70 leading-relaxed font-serif text-xl transition-all duration-500 ${
            isExpanded ? "opacity-100" : "line-clamp-3 opacity-60"
          }`}
        >
          {typeof content === 'string' && content.trim() !== '' ? (
            content
          ) : (content && typeof content === 'object' && Object.keys(content).length > 0) ? (
            <div className={`grid gap-6 ${isExpanded ? 'grid-cols-1' : 'grid-cols-1'}`}>
              {Object.entries(content).map(([key, value]) => (
                <div key={key} className="relative pl-6 group/item">
                  {/* Decorative vertical line */}
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-lumina/20 group-hover/item:bg-lumina/50 transition-colors" />
                  
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-lumina/80 font-bold">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </span>
                    
                    <div className="text-white/90">
                      {typeof value === 'object' && value !== null ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          {Object.entries(value).map(([subKey, subValue]) => (
                            <div key={subKey} className="bg-white/5 rounded-xl p-4 border border-white/5">
                              <span className="block font-mono text-[8px] tracking-widest uppercase text-white/30 mb-1">
                                {subKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                              </span>
                              <span className="text-sm font-sans text-white/70">
                                {String(subValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="font-serif italic text-lg leading-relaxed">
                          {String(value)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-30">
              <span className="italic font-serif">Neural data stream empty...</span>
              <span className="font-mono text-[8px] tracking-widest uppercase mt-2">Awaiting Signal</span>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ transform: "translateZ(30px)" }}
              className="font-mono text-[10px] tracking-[0.3em] text-lumina/40 uppercase mt-2 flex items-center gap-2"
            >
              <div className="w-8 h-px bg-lumina/20" />
              Expand Analysis
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-lumina/5 to-transparent pointer-events-none" />
    </motion.div>
  );
}
