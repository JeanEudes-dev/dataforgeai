import { createBrowserRouter } from "react-router-dom";
import { MainLayout, AuthLayout } from "@/components/layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { ErrorPage } from "@/components/shared";

// Lazy load pages for code splitting
import { lazy, Suspense } from "react";
import { ForgeLoader } from "@/components/ui";

// Loading component for suspense
// eslint-disable-next-line react-refresh/only-export-components
function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <ForgeLoader className="w-32 h-32" />
    </div>
  );
}

// Auth pages
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage"));

// Main pages
const DashboardPage = lazy(
  () => import("@/features/dashboard/pages/DashboardPage")
);
const DatasetsPage = lazy(
  () => import("@/features/datasets/pages/DatasetsPage")
);
const DatasetDetailPage = lazy(
  () => import("@/features/datasets/pages/DatasetDetailPage")
);
const EDAPage = lazy(() => import("@/features/eda/pages/EDAPage"));
const TrainingPage = lazy(() => import("@/features/ml/pages/TrainingPage"));
const JobsListPage = lazy(() => import("@/features/ml/pages/JobsListPage"));
const JobDetailPage = lazy(() => import("@/features/ml/pages/JobDetailPage"));
const ModelsListPage = lazy(() => import("@/features/ml/pages/ModelsListPage"));
const ModelDetailPage = lazy(
  () => import("@/features/ml/pages/ModelDetailPage")
);
const PredictionsPage = lazy(
  () => import("@/features/predictions/pages/PredictionsPage")
);
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));
const ReportDetailPage = lazy(
  () => import("@/features/reports/pages/ReportDetailPage")
);
const AssistantPage = lazy(
  () => import("@/features/assistant/pages/AssistantPage")
);
const SettingsPage = lazy(() => import("@/features/auth/pages/SettingsPage"));
const NotFoundPage = lazy(
  () => import("@/features/dashboard/pages/NotFoundPage")
);

// Wrapper component for lazy loaded pages
// eslint-disable-next-line react-refresh/only-export-components
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // Auth routes (public)
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/login",
        element: (
          <LazyPage>
            <LoginPage />
          </LazyPage>
        ),
      },
      {
        path: "/register",
        element: (
          <LazyPage>
            <RegisterPage />
          </LazyPage>
        ),
      },
    ],
  },

  // Protected routes
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Dashboard
          {
            path: "/",
            element: (
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            ),
          },

          // Datasets
          {
            path: "/datasets",
            element: (
              <LazyPage>
                <DatasetsPage />
              </LazyPage>
            ),
          },
          {
            path: "/datasets/:id",
            element: (
              <LazyPage>
                <DatasetDetailPage />
              </LazyPage>
            ),
          },

          // EDA
          {
            path: "/datasets/:datasetId/eda",
            element: (
              <LazyPage>
                <EDAPage />
              </LazyPage>
            ),
          },

          // ML/Training
          {
            path: "/datasets/:datasetId/train",
            element: (
              <LazyPage>
                <TrainingPage />
              </LazyPage>
            ),
          },
          {
            path: "/training/jobs",
            element: (
              <LazyPage>
                <JobsListPage />
              </LazyPage>
            ),
          },
          {
            path: "/training/jobs/:jobId",
            element: (
              <LazyPage>
                <JobDetailPage />
              </LazyPage>
            ),
          },
          {
            path: "/models",
            element: (
              <LazyPage>
                <ModelsListPage />
              </LazyPage>
            ),
          },
          {
            path: "/models/:modelId",
            element: (
              <LazyPage>
                <ModelDetailPage />
              </LazyPage>
            ),
          },

          // Predictions
          {
            path: "/models/:modelId/predict",
            element: (
              <LazyPage>
                <PredictionsPage />
              </LazyPage>
            ),
          },

          // Reports
          {
            path: "/reports",
            element: (
              <LazyPage>
                <ReportsPage />
              </LazyPage>
            ),
          },
          {
            path: "/reports/:reportId",
            element: (
              <LazyPage>
                <ReportDetailPage />
              </LazyPage>
            ),
          },

          // Assistant
          {
            path: "/assistant",
            element: (
              <LazyPage>
                <AssistantPage />
              </LazyPage>
            ),
          },

          // Settings
          {
            path: "/settings",
            element: (
              <LazyPage>
                <SettingsPage />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },

  // 404 page
  {
    path: "*",
    element: (
      <LazyPage>
        <NotFoundPage />
      </LazyPage>
    ),
  },
]);

export default router;
