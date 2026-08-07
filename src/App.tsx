import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index.tsx";
import PanduanZakat from "./pages/PanduanZakat.tsx";
import ZakatEmas from "./pages/ZakatEmas.tsx";
import Tentang from "./pages/Tentang.tsx";
import Pengaturan from "./pages/Pengaturan.tsx";
import Riwayat from "./pages/Riwayat.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ALL_PAGES } from "@/lib/seo";

const App = () => (
  // Respect the user's reduced-motion preference across all animations.
  <MotionConfig reducedMotion="user">
    <ErrorBoundary>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Shared layout: header + bottom nav rendered once via <Outlet /> */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              {/* SEO-friendly deep links per zakat type, all served by the calculator. */}
              {ALL_PAGES.filter((p) => p.tab !== "maal").map((p) => (
                <Route key={p.slug} path={`/${p.slug}`} element={<Index />} />
              ))}
              {/* Zakat penghasilan dilebur ke zakat maal */}
              <Route path="/zakat-penghasilan" element={<Navigate to="/" replace />} />
              <Route path="/zakat-maal" element={<Navigate to="/" replace />} />
              <Route path="/panduan-zakat" element={<PanduanZakat />} />
              <Route path="/zakat-emas" element={<ZakatEmas />} />
              <Route path="/tentang" element={<Tentang />} />
              <Route path="/pengaturan" element={<Pengaturan />} />
              <Route path="/riwayat" element={<Riwayat />} />
            </Route>

            {/* 404 stands alone — no app chrome */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </MotionConfig>
);

export default App;
