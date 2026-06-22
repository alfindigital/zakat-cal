import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import PanduanZakat from "./pages/PanduanZakat.tsx";
import Tentang from "./pages/Tentang.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ALL_PAGES } from "@/lib/seo";

const App = () => (
  // Respect the user's reduced-motion preference across all animations.
  <MotionConfig reducedMotion="user">
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* SEO-friendly deep links per zakat type, all served by the calculator. */}
          {ALL_PAGES.filter((p) => p.tab !== "penghasilan").map((p) => (
            <Route key={p.slug} path={`/${p.slug}`} element={<Index />} />
          ))}
          <Route path="/panduan-zakat" element={<PanduanZakat />} />
          <Route path="/tentang" element={<Tentang />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </MotionConfig>
);

export default App;
