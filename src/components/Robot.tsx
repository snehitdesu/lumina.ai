import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useState, useMemo } from "react";
import { Brain } from "lucide-react";

interface RobotProps {
  isThinking: boolean;
}

const PARTICLE_COUNT = 40;
const COLORS = ["#bc13fe", "#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function Robot({ isThinking }: RobotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const springY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15]);

  // Generate stable random positions for particles
  const particles = useMemo(() => {
    return [...Array(PARTICLE_COUNT)].map((_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      // Target position in a sphere (normalized -1 to 1)
      targetX: (Math.random() - 0.5) * 2,
      targetY: (Math.random() - 0.5) * 2,
      targetZ: (Math.random() - 0.5) * 2,
      // Explosion offset
      explodeX: (Math.random() - 0.5) * 400,
      explodeY: (Math.random() - 0.5) * 400,
      size: 2 + Math.random() * 4,
    }));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div 
      style={{ rotateX, rotateY, perspective: 1000 }}
      className="relative flex items-center justify-center w-80 h-80"
    >
      {/* Outer Atmospheric Glow */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isThinking ? [0.3, 0.6, 0.3] : [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-full h-full bg-lumina/20 blur-[100px] rounded-full"
      />

      {/* Rotating Rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            rotate: 360,
            scale: isThinking ? [1, 1.1, 1] : 1,
            opacity: isHovered ? 0.05 : 0.3 - i * 0.1,
          }}
          transition={{
            rotate: { duration: 10 + i * 5, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.5 }
          }}
          className="absolute border border-white/10 rounded-full pointer-events-none"
          style={{
            width: `${100 - i * 20}%`,
            height: `${100 - i * 20}%`,
            borderStyle: i === 1 ? 'dashed' : 'solid',
          }}
        />
      ))}

      {/* The Singularity Core Container */}
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-40 h-40 cursor-pointer z-10"
      >
        <AnimatePresence>
          {!isHovered ? (
            <motion.div
              key="solid-core"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-lumina/40 blur-3xl rounded-full" />
              
              {/* Core Mind (Brain) */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-lumina/20 via-lumina-alt/10 to-transparent rounded-full border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
                <motion.div
                  animate={{
                    scale: isThinking ? [1, 1.15, 1] : [1, 1.05, 1],
                    filter: isThinking 
                      ? ["drop-shadow(0 0 15px #bc13fe) brightness(1.5)", "drop-shadow(0 0 40px #bc13fe) brightness(2)", "drop-shadow(0 0 15px #bc13fe) brightness(1.5)"]
                      : ["drop-shadow(0 0 5px #bc13fe)", "drop-shadow(0 0 15px #bc13fe)", "drop-shadow(0 0 5px #bc13fe)"],
                  }}
                  transition={{ duration: isThinking ? 1.2 : 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-lumina"
                >
                  <Brain size={80} strokeWidth={1.5} />
                </motion.div>

                {/* Neural Pulse Overlay */}
                <motion.div
                  animate={{
                    opacity: isThinking ? [0.1, 0.4, 0.1] : [0.05, 0.2, 0.05],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_center,#bc13fe_0%,transparent_70%)]"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="exploded-core"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {particles.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: p.explodeX,
                    y: p.explodeY,
                    opacity: [0, 1, 0.8],
                    scale: [0, 1.5, 1],
                    rotate: 720,
                  }}
                  exit={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0,
                    transition: {
                      type: "spring",
                      damping: 25,
                      stiffness: 400,
                      delay: i * 0.002,
                    }
                  }}
                  transition={{
                    x: { type: "spring", damping: 15, stiffness: 260, mass: 0.5 },
                    y: { type: "spring", damping: 15, stiffness: 260, mass: 0.5 },
                    opacity: { duration: 0.4 },
                    scale: { duration: 0.4, ease: "backOut" },
                    rotate: { duration: 0.8, ease: "circOut" },
                    delay: i * 0.005,
                  }}
                  className="absolute rounded-full blur-[1px]"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: `0 0 10px ${p.color}`,
                  }}
                />
              ))}
              {/* Central Energy Pulse when exploded */}
              <motion.div
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-20 h-20 bg-lumina blur-3xl rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Shards (Always present but react to hover) */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: isHovered ? [0, -100, 0] : [0, -20, 0],
              x: isHovered ? [0, i % 2 === 0 ? 100 : -100, 0] : [0, i % 2 === 0 ? 10 : -10, 0],
              rotate: 360,
              opacity: isHovered ? 0.8 : 0.4,
            }}
            transition={{
              duration: isHovered ? 2 : 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-2 h-2 bg-white/40 blur-[1px] rounded-sm"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </motion.div>

      {/* Data Stream HUD */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border border-white/5 rounded-full opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-lumina uppercase opacity-40">
          Neural Core Active
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-lumina uppercase opacity-40">
          {isThinking ? "Processing..." : "Standby"}
        </div>
        
        {/* Frequency Visualizer */}
        <div className="absolute -bottom-12 flex items-end gap-1 h-8">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={isThinking ? {
                height: [4, 16 + Math.random() * 16, 4],
                opacity: [0.2, 0.8, 0.2]
              } : {
                height: 4,
                opacity: 0.1
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1 bg-lumina rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
