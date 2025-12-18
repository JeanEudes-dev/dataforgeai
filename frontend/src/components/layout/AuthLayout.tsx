import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/utils";
import { AuroraBackground } from "../ui/AuroraBackground";

export function AuthLayout() {
  return (
    <AuroraBackground
      variant="sunset"
      className="min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden"
    >
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.45,
          type: "spring",
          stiffness: 320,
          damping: 28,
        }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
            <img src="/Icon.png" alt="DataForge AI" className="w-11 h-11" />
            <div className="text-left">
              <h1 className="text-2xl font-semibold text-foreground leading-tight">
                DataForge
              </h1>
              <span className="text-sm text-muted-foreground font-medium">
                Calm AI workspace
              </span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          className={cn(
            "rounded-2xl p-8 glass-card",
            "border border-border shadow-2xl"
          )}
        >
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Automated data analytics and machine learning
        </p>
      </motion.div>
    </AuroraBackground>
  );
}

export default AuthLayout;
