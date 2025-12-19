import { useState, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./app/router";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { ForgeLoader } from "./components/ui/ForgeLoader";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // The animation takes about 3.3s to complete fully.
    // We set it to 3.5s to ensure the user sees the whole sequence.
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="dataforge-ui-theme">
        {isLoading ? (
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="h-64 w-64">
              <ForgeLoader />
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
          </TooltipProvider>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
