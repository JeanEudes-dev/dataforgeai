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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center"
      >
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-balance">{message}</p>

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
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-left overflow-auto max-h-40 text-xs font-mono text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            {error.stack}
          </div>
        )}
      </motion.div>
    </div>
  );
}
