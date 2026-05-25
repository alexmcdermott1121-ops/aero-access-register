import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DataProvider, useData } from "./lib/DataContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Register } from "./pages/Register";
import { RecordForm } from "./pages/RecordForm";
import { RecordDetail } from "./pages/RecordDetail";
import { Reports } from "./pages/Reports";
import "./styles.css";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, demoMode, loading } = useData();
  if (loading) return <main className="loading-screen">Loading private register...</main>;
  if (!currentUser && !demoMode) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="register" element={<Register />} />
            <Route path="records/new" element={<RecordForm />} />
            <Route path="records/:id" element={<RecordDetail />} />
            <Route path="records/:id/edit" element={<RecordForm />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
