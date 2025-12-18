import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuroraBackground } from "../ui/AuroraBackground";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AuroraBackground className="h-screen w-full !items-start !justify-start overflow-hidden text-foreground">
      <div className="flex h-full w-full relative z-10">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main content area */}
        <motion.div
          initial={false}
          animate={{ marginLeft: sidebarOpen ? 240 : 68 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto px-6 pb-10 pt-4 md:px-10 scrollbar-hide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto w-full space-y-6"
            >
              <Outlet />
            </motion.div>
          </main>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}

export default MainLayout;
