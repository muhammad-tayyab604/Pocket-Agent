import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppStore, createDemoAgents } from "@/store/app-store";
import { useAuth } from "@/hooks/use-auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import CreateAgent from "./pages/CreateAgent";
import Chat from "./pages/Chat";
import History from "./pages/History";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthSync() {
  const { user } = useAuth();
  const setUserId = useAppStore((s) => s.setUserId);
  const cloudSyncEnabled = useAppStore((s) => s.cloudSyncEnabled);
  const syncAgentsFromCloud = useAppStore((s) => s.syncAgentsFromCloud);
  const syncHistoryFromCloud = useAppStore((s) => s.syncHistoryFromCloud);

  useEffect(() => {
    setUserId(user?.id ?? null);
    
    // Sync from cloud when user logs in and sync is enabled
    if (user && cloudSyncEnabled) {
      syncAgentsFromCloud();
      syncHistoryFromCloud();
    }
  }, [user, cloudSyncEnabled, setUserId, syncAgentsFromCloud, syncHistoryFromCloud]);

  return null;
}

function AppRoutes() {
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  
  useEffect(() => {
    if (hasCompletedOnboarding) {
      createDemoAgents();
    }
  }, [hasCompletedOnboarding]);
  
  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/create" element={<CreateAgent />} />
      <Route path="/chat/:agentId" element={<Chat />} />
      <Route path="/history" element={<History />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthSync />
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;