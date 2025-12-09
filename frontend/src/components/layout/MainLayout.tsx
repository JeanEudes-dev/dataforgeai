import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
        className="min-h-screen flex flex-col relative z-10"
      >
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="flex-1 px-6 pb-10 pt-4 md:px-10">
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
  );
}

export default MainLayout;
