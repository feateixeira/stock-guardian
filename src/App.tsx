import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Funcionarios from "./pages/Funcionarios";
import Itens from "./pages/Itens";
import ONUs from "./pages/ONUs";
import CriarOS from "./pages/CriarOS";
import OSLista from "./pages/OSLista";
import OSDetalhe from "./pages/OSDetalhe";
import Estoque from "./pages/Estoque";
import Movimentacoes from "./pages/Movimentacoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
            <Route path="/itens" element={<ProtectedRoute><Itens /></ProtectedRoute>} />
            <Route path="/onus" element={<ProtectedRoute><ONUs /></ProtectedRoute>} />
            <Route path="/os/nova" element={<ProtectedRoute><CriarOS /></ProtectedRoute>} />
            <Route path="/os" element={<ProtectedRoute><OSLista /></ProtectedRoute>} />
            <Route path="/os/:id" element={<ProtectedRoute><OSDetalhe /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
            <Route path="/movimentacoes" element={<ProtectedRoute><Movimentacoes /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;