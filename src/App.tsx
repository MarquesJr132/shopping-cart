import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Index } from "./pages/Index";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Reports } from "./pages/Reports";
import { MovementForm } from "./pages/MovementForm";
import { MovementDetail } from "./pages/MovementDetail";
import { Admin } from "./pages/Admin";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/movement/new" element={
            <ProtectedRoute>
              <MovementForm />
            </ProtectedRoute>
          } />
          <Route path="/movement/edit/:id" element={
            <ProtectedRoute>
              <MovementForm />
            </ProtectedRoute>
          } />
          <Route path="/movement/:id" element={
            <ProtectedRoute>
              <MovementDetail />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
