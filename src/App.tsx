import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import ChannelLayout from "./pages/ChannelLayout";
import Channel from "./pages/Channel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<ChannelLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/channel/:channelId" element={<Channel />} />
            <Route path="/notifications" element={<Home />} />
            <Route path="/invitations" element={<Home />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
