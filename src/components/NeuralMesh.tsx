import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function NeuralMesh() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
      {/* Dynamic Gradient that follows mouse */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(188, 19, 254, 0.15) 0%, transparent 40%)`
        }}
      />

      {/* Scanning Line */}
      <motion.div
        animate={{
          top: ["-10%", "110%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-lumina/20 to-transparent shadow-[0_0_20px_rgba(188,19,254,0.2)]"
      />

      {/* Random Data Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "vw", 
            y: Math.random() * 100 + "vh",
            opacity: Math.random() * 0.5
          }}
          animate={{
            y: [null, (Math.random() * 100 - 50) + "vh"],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-px h-px bg-white"
        />
      ))}
    </div>
  );
}
