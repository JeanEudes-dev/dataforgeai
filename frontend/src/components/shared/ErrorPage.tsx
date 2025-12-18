import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again later.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (status === 404) {
      title = "Page not found";
      message = "Sorry, we couldn't find the page you're looking for.";
    } else if (status === 401) {
      title = "Unauthorized";
      message = "You don't have permission to access this page.";
    } else if (status === 503) {
      title = "Service Unavailable";
      message =
        "Our servers are currently unavailable. Please try again shortly.";
    } else {
      title = error.statusText || title;
      message = error.data?.message || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border p-8 text-center"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8 text-balance">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Go back
          </Button>
          <Button
            onClick={() => navigate("/")}
            leftIcon={<HomeIcon className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </div>

        {import.meta.env.DEV && error instanceof Error && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-left overflow-auto max-h-40 text-xs font-mono text-muted-foreground border border-border">
            {error.stack}
          </div>
        )}
      </motion.div>
    </div>
  );
}
