import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DatasetsPage } from "../features/datasets/pages/DatasetsPage";
import { UploadDatasetPage } from "../features/datasets/pages/UploadDatasetPage";
import { EDAPage } from "../features/eda/pages/EDAPage";
import { ModelingPage } from "../features/modeling/pages/ModelingPage";
import ModelDetailsPage from "../features/modeling/pages/ModelDetailsPage";
import { PredictionsPage } from "../features/predictions/pages/PredictionsPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import ReportDetailPage from "../features/reports/pages/ReportDetailPage";
import { AssistantPage } from "../features/assistant/pages/AssistantPage";

import { SettingsPage } from "../features/users/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: "/auth",
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "", element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "datasets", element: <DatasetsPage /> },
      { path: "datasets/upload", element: <UploadDatasetPage /> },
      { path: "eda", element: <EDAPage /> },
      { path: "modeling", element: <ModelingPage /> },
      { path: "modeling/:modelId", element: <ModelDetailsPage /> },
      { path: "predictions", element: <PredictionsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "reports/:reportId", element: <ReportDetailPage /> },
      { path: "assistant", element: <AssistantPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
