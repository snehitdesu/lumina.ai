import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Cpu, Globe, ShieldAlert, Lightbulb } from "lucide-react";

const STAGES = [
  { id: 1, text: "Accessing Global Market Data", icon: Globe },
  { id: 2, text: "Scanning Competitive Landscapes", icon: Cpu },
  { id: 3, text: "Calculating Risk Vectors", icon: ShieldAlert },
  { id: 4, text: "Synthesizing Strategic Suggestions", icon: Lightbulb },
];

export default function NeuralLoader() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % STAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full py-20 flex flex-col items-center">
      <div className="relative w-64 h-1 bg-white/5 rounded-full overflow-hidden mb-12">
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-lumina to-transparent"
        />
      </div>

      <div className="relative h-24 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="p-4 rounded-full bg-lumina/10 border border-lumina/20 text-lumina shadow-[0_0_20px_rgba(188,19,254,0.1)]">
              {(() => {
                const Icon = STAGES[currentStage].icon;
                return <Icon size={24} />;
              })()}
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="font-serif text-2xl italic text-white/80">
                {STAGES[currentStage].text}
              </p>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-lumina"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Background Data Stream Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "100%" }}
            animate={{ y: "-100%" }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5,
            }}
            className="absolute text-[8px] font-mono whitespace-nowrap text-lumina"
            style={{ left: `${20 * i}%` }}
          >
            {Array(20).fill(0).map(() => Math.random().toString(16).substring(2, 10)).join(" ")}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
