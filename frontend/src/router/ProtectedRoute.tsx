import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts";
import { ForgeLoader } from "@/components/ui";
import { cn } from "@/utils";
import { useState, useEffect } from "react";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [minLoadFinished, setMinLoadFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadFinished(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          "bg-base"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <ForgeLoader className="w-32 h-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!minLoadFinished) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          "bg-base"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <ForgeLoader className="w-32 h-32" />
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
