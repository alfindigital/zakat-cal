import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { SITE_NAME } from "@/lib/seo";

const NotFound = () => {
  const location = useLocation();

  // 404s get their own title and must never be indexed.
  useEffect(() => {
    document.title = `Halaman tidak ditemukan (404) — ${SITE_NAME}`;
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = "noindex, follow";
    return () => robots?.remove();
  }, []);


  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">404</h1>
        <p className="text-lg text-muted-foreground">
          Halaman <span className="font-mono text-foreground">{location.pathname}</span> tidak ditemukan.
        </p>
        <Button asChild className="h-11">
          <Link to="/"><Home className="mr-2 h-4 w-4" /> Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
