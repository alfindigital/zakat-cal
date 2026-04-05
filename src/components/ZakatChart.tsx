import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ZakatHistory, formatRupiah } from "@/lib/zakat";

interface Props {
  history: ZakatHistory[];
}

const TYPE_COLORS: Record<string, string> = {
  Penghasilan: "hsl(160, 84%, 28%)",
  Maal: "hsl(200, 70%, 45%)",
  Fitrah: "hsl(35, 80%, 55%)",
};

export default function ZakatChart({ history }: Props) {
  const summaryByType = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((h) => {
      map[h.type] = (map[h.type] || 0) + h.amount;
    });
    return Object.entries(map).map(([type, total]) => ({
      type,
      total,
      fill: TYPE_COLORS[type] || "hsl(160, 84%, 28%)",
    }));
  }, [history]);

  const total = useMemo(() => history.reduce((s, h) => s + h.amount, 0), [history]);

  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
        <CardTitle className="text-sm sm:text-base font-semibold">Ringkasan Zakat</CardTitle>
        <p className="text-xs text-muted-foreground">
          Total: <span className="font-medium text-primary">{formatRupiah(total)}</span>
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Bar Chart */}
          <div className="w-full sm:flex-1 h-[160px]">
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

          {/* Pie Chart */}
          <div className="w-[140px] h-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaryByType}
                  dataKey="total"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
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
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {summaryByType.map((entry) => (
            <div key={entry.type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
              {entry.type}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
