import { cn } from "@/utils";
import { motion } from "framer-motion";
import React from "react";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  showRadialGradient?: boolean;
  variant?: "nebula" | "aurora" | "blue" | "sunset" | "elegant";
  pattern?: "aurora" | "orb";
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  variant = "blue",
  pattern = "orb",
  ...props
}: AuroraBackgroundProps) => {
  const gradients = {
    nebula: `[--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#8b5cf6_15%,#d946ef_20%,#06b6d4_25%,#3b82f6_30%)]`,
    aurora: `[--aurora:repeating-linear-gradient(100deg,#10b981_10%,#3b82f6_15%,#06b6d4_20%,#10b981_25%,#3b82f6_30%)]`,
    blue: `[--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#6366f1_15%,#0ea5e9_20%,#3b82f6_25%,#6366f1_30%)]`,
    sunset: `[--aurora:repeating-linear-gradient(100deg,#f59e0b_10%,#ec4899_15%,#8b5cf6_20%,#3b82f6_25%,#f59e0b_30%)]`,
    elegant: `[--aurora:repeating-linear-gradient(100deg,#334155_10%,#475569_15%,#64748b_20%,#94a3b8_25%,#334155_30%)]`,
  };

  const orbColors = {
    nebula: ["bg-blue-500", "bg-purple-500", "bg-pink-500"],
    aurora: ["bg-emerald-500", "bg-blue-500", "bg-cyan-500"],
    blue: ["bg-blue-600", "bg-indigo-500", "bg-sky-500"],
    sunset: ["bg-amber-500", "bg-pink-500", "bg-violet-500"],
    elegant: ["bg-slate-500", "bg-gray-500", "bg-zinc-500"],
  };

  const colors = orbColors[variant];

  return (
    <div
      className={cn(
        "relative flex flex-col h-[100vh] items-center justify-center bg-zinc-950 text-slate-950 transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        {pattern === "aurora" ? (
          <div
            className={cn(
              // Base gradients
              `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white,white)_0%,var(--white,white)_7%,var(--transparent,transparent)_10%,var(--transparent,transparent)_12%,var(--white,white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--black,black)_0%,var(--black,black)_7%,var(--transparent,transparent)_10%,var(--transparent,transparent)_12%,var(--black,black)_16%)]
            ${gradients[variant]}
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-20 will-change-transform`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
            )}
          ></div>
        ) : (
          <div className="absolute inset-0 opacity-30">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute top-0 left-0 w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-50",
                colors[0]
              )}
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className={cn(
                "absolute top-0 right-0 w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-50",
                colors[1]
              )}
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                x: [0, 50, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4,
              }}
              className={cn(
                "absolute -bottom-32 left-20 w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-50",
                colors[2]
              )}
            />
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
