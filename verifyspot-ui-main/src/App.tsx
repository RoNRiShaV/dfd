import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Result from "./pages/Result";
import UploadSection from "./components/UploadSection";
import PrivacySection from "./components/PrivacySection";
import HistoryCarousel from "./components/HiatoryCarousel"; 

const queryClient = new QueryClient();

const App = () => {
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/upload"
              element={
                <div className="space-y-6">
                  {/* ✅ Privacy toggle, uploader, and history */}
                  <PrivacySection onPrivacyChange={setPrivacyMode} />
                  <UploadSection privacyMode={privacyMode} />
                  {/* ✅ Hide history if privacy mode is ON */}
                  {!privacyMode && <HistoryCarousel />}
                </div>
              }
            />
            <Route path="/results/:id" element={<Result />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
