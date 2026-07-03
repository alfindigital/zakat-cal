import { ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";
import type { ZakatType } from "@/lib/zakat";

/**
 * Lembaga Zakat Resmi — after the calculator confirms zakat is wajib, give
 * users legitimate channels to actually pay it. Links open in a new tab with
 * `rel="noopener"`, carry a shared UTM so partner outreach can attribute
 * traffic, and fire an analytics event per click for roadmap prioritisation.
 */
interface Lembaga {
  name: string;
  url: string;
  desc: string;
  logo: string; // single-letter mark; keeps bundle small, still branded
}

const LEMBAGA: Lembaga[] = [
  {
    name: "BAZNAS",
    url: "https://baznas.go.id/bayarzakat",
    desc: "Lembaga zakat resmi negara (SK Presiden).",
    logo: "B",
  },
  {
    name: "Dompet Dhuafa",
    url: "https://donasi.dompetdhuafa.org/zakat",
    desc: "LAZ Nasional sejak 1993.",
    logo: "D",
  },
  {
    name: "Rumah Zakat",
    url: "https://www.rumahzakat.org/id/donasi/zakat",
    desc: "LAZ Nasional, program berbasis desa.",
    logo: "R",
  },
];

const UTM = "?utm_source=zakatcal&utm_medium=result_cta&utm_campaign=bayar_zakat";

interface Props {
  waType?: ZakatType;
}

export function LembagaZakatCta({ waType }: Props) {
  const handleClick = (name: string) => {
    track("lembaga_click", { lembaga: name, type: waType ?? "zakat" });
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Salurkan lewat lembaga resmi</p>
        <span className="text-[10px] text-muted-foreground">Terpercaya</span>
      </div>
      <ul className="space-y-1.5">
        {LEMBAGA.map((l) => (
          <li key={l.name}>
            <a
              href={`${l.url}${UTM}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(l.name)}
              className="flex items-center gap-3 rounded-md border border-transparent p-2 hover:border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary"
              >
                {l.logo}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-foreground truncate">{l.name}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{l.desc}</span>
              </span>
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground pt-0.5">
        ZakatCal tidak menerima dana. Anda dialihkan langsung ke situs resmi lembaga.
      </p>
    </div>
  );
}
