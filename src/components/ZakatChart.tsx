import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ZakatHistory, formatRupiah } from "@/lib/zakat";
import { labelForZakatType } from "@/lib/seo";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Props {
  history: ZakatHistory[];
}

// Distinct hue per zakat type so the pie + legend stay readable for all
// categories (previously only 3 had colors; the rest collapsed into one green).
const TYPE_COLORS: Record<string, string> = {
  Penghasilan: "hsl(160, 84%, 28%)",
  Maal: "hsl(200, 70%, 45%)",
  Perniagaan: "hsl(265, 60%, 55%)",
  Pertanian: "hsl(95, 55%, 40%)",
  Peternakan: "hsl(20, 75%, 50%)",
  Rikaz: "hsl(330, 65%, 52%)",
  Madin: "hsl(220, 15%, 45%)",
  Fitrah: "hsl(35, 85%, 52%)",
  Fidyah: "hsl(48, 90%, 45%)",
};
const FALLBACK_COLOR = "hsl(160, 30%, 50%)";

export default function ZakatChart({ history }: Props) {
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"pie" | "bar">("pie");

  const summaryByType = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((h) => {
      const key = labelForZakatType(h.type);
      map[key] = (map[key] || 0) + h.amount;
    });
    return Object.entries(map).map(([type, total]) => ({
      type,
      total,
      fill: TYPE_COLORS[type] || FALLBACK_COLOR,
    }));
  }, [history]);

  const total = useMemo(() => history.reduce((s, h) => s + h.amount, 0), [history]);

  if (history.length === 0) return null;

  const renderBar = () => (
    <div className="w-full h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={summaryByType} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="type"
            width={80}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => formatRupiah(value)}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {summaryByType.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPie = (size: number) => (
    <div className="shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={summaryByType}
            dataKey="total"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={size * 0.28}
            outerRadius={size * 0.46}
            strokeWidth={2}
            stroke="hsl(var(--card))"
          >
            {summaryByType.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatRupiah(value)}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const legend = (
    <div className="flex flex-col gap-2 flex-1">
      {summaryByType.map((entry) => {
        const pct = total > 0 ? Math.round((entry.total / total) * 100) : 0;
        return (
          <div key={entry.type} className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
            <span className="font-medium text-foreground">{entry.type}</span>
            <span className="text-muted-foreground ml-auto tabular-nums">{pct}%</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card>
        <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">Ringkasan Zakat</CardTitle>
              <p className="text-xs text-muted-foreground">
                Total: <span className="font-medium text-primary">{formatRupiah(total)}</span>
              </p>
            </div>
            {isMobile && (
              <ToggleGroup
                type="single"
                value={mobileView}
                onValueChange={(v) => v && setMobileView(v as "pie" | "bar")}
                className="gap-0 rounded-lg border border-border/60 p-0.5"
              >
                <ToggleGroupItem value="pie" className="text-[11px] h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Pie
                </ToggleGroupItem>
                <ToggleGroupItem value="bar" className="text-[11px] h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Bar
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
          {isMobile ? (
            mobileView === "pie" ? (
              <div className="flex items-center gap-4">
                {renderPie(120)}
                {legend}
              </div>
            ) : (
              <>
                {renderBar()}
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {summaryByType.map((entry) => (
                    <div key={entry.type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                      {entry.type}
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            <>
              <motion.div
                className="flex flex-row gap-4 items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="flex-1">{renderBar()}</div>
                {renderPie(140)}
              </motion.div>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {summaryByType.map((entry) => (
                  <div key={entry.type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                    {entry.type}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
