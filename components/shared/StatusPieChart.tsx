"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getPekerjaan, getProyek } from "@/lib/storage";

// Palet warna mirip dashboard publik UPTIK
const COLORS = ["#2563EB", "#16A34A", "#D97706", "#7C3AED", "#EA580C", "#D94040"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #DDE1E9", borderRadius: 10, padding: "8px 14px", fontSize: 13, boxShadow: "0 2px 12px rgba(30,79,163,0.10)" }}>
        <span style={{ fontWeight: 700, color: payload[0].payload.fill }}>{payload[0].name}</span>
        <span style={{ color: "#485068", marginLeft: 8 }}>{payload[0].value} item</span>
      </div>
    );
  }
  return null;
};

const STATUS_LABEL: Record<string, string> = {
  assigned: "Ditugaskan",
  in_progress: "Sedang Berlangsung",
  review: "Dalam Tinjauan",
  done: "Selesai",
};

export default function StatusPieChart() {
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const workStatuses = ["assigned", "in_progress", "review", "done"];
    const all = [...getPekerjaan(), ...getProyek()].filter((item) => workStatuses.includes(item.status));
    const count: Record<string, number> = {};
    all.forEach((item) => { count[item.status] = (count[item.status] || 0) + 1; });
    setChartData(Object.entries(count).map(([name, value]) => ({ name: STATUS_LABEL[name] || name, value })));
  }, []);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card">
      <div className="section-header">
        <h3>Status Pekerjaan & Proyek</h3>
        <p>Distribusi status seluruh item.</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Donut */}
        <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={52} outerRadius={80}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>{total}</span>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Total</span>
          </div>
        </div>

        {/* Legend list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {chartData.map((d, i) => {
            const pct = total ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: "#374151", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginLeft: "auto", flexShrink: 0 }}>{pct}%</span>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700, width: 28, textAlign: "right", flexShrink: 0 }}>{d.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
