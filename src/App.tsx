import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EventsList from "./pages/EventsList";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import Clienti from "./pages/Clienti";
import NotificationSettingsPage from "./pages/NotificationSettings";
import Auth from "./pages/Auth";
import Header from "./components/layout/Header";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Header />
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Header />
                <EventsList />
              </ProtectedRoute>
            } />
            <Route path="/events/new" element={
              <ProtectedRoute>
                <Header />
                <CreateEvent />
              </ProtectedRoute>
            } />
            <Route path="/events/:id" element={
              <ProtectedRoute>
                <Header />
                <EventDetail />
              </ProtectedRoute>
            } />
            <Route path="/clienti" element={
              <ProtectedRoute>
                <Header />
                <Clienti />
              </ProtectedRoute>
            } />
            <Route path="/notifications/settings" element={
              <ProtectedRoute>
                <Header />
                <NotificationSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
