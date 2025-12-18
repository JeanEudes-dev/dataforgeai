import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HomeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-semibold text-muted-foreground mb-2">
          Page not found
        </h1>
        <p className="text-secondary mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. Perhaps you've
          mistyped the URL or the page has been moved.
        </p>
        <Link to="/">
          <Button leftIcon={<HomeIcon className="w-5 h-5" />}>
            Go back home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

export default NotFoundPage;
