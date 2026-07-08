import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import ChannelLayout from "./pages/ChannelLayout";
import Channel from "./pages/Channel";
import Invitations from "./pages/Invitations";
import DirectMessages from "./pages/DirectMessages";
import DirectMessageChat from "./pages/DirectMessageChat";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<ChannelLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/channel/:channelId" element={<Channel />} />
            <Route path="/invitations" element={<Invitations />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/dm" element={<DirectMessages />} />
            <Route path="/dm/:dmChannelId" element={<DirectMessageChat />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
