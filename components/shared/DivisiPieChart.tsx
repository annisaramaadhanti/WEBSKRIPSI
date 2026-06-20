"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getPekerjaan, getProyek } from "@/lib/storage";
import type { Pekerjaan, Proyek } from "@/types";

// Warna per divisi: biru, hijau, ungu, kuning, teal, merah — mirip dashboard publik
const COLORS = ["#1E4FA3", "#2EA86B", "#7C3AED", "#D97706", "#0D9488", "#D94040"];

// Shorten long division names for display
const shortName = (name: string) => {
  const map: Record<string, string> = {
    "Pengembangan dan Inovasi Teknologi Informasi": "Pengembangan & Inovasi",
    "Layanan Sistem dan Teknologi Informasi": "Layanan Sistem & TI",
    "Manajemen dan Integrasi Sistem Informasi": "Manajemen & Integrasi SI",
    "Infrastruktur Jaringan": "Infrastruktur Jaringan",
    "Sumber Daya Sistem Informasi": "Sumber Daya SI",
    "Pusat Data dan Keamanan Informasi": "Pusat Data & Keamanan",
  };
  return map[name] ?? (name.length > 22 ? name.slice(0, 22) + "…" : name);
};

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

export default function DivisiPieChart() {
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const all: Array<Pick<Pekerjaan, "divisi"> | Pick<Proyek, "divisi">> = [...getPekerjaan(), ...getProyek()];
    const count: Record<string, number> = {};
    all.forEach((item) => {
      item.divisi.forEach((d: string) => { count[d] = (count[d] || 0) + 1; });
    });
    setChartData(Object.entries(count).map(([name, value]) => ({ name, value })));
  }, []);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white border border-[#E8ECF4] rounded-[20px] p-[22px] shadow-[0_4px_12px_rgba(11,30,75,0.09)]">
      <div className="flex flex-col gap-1 pb-3 mb-4 border-b border-[#E8ECF4]">
        <h3 className="m-0 font-bold text-[16px] text-[#0B1E4B]">Distribusi Divisi</h3>
        <p className="m-0 text-[12px] text-[#8A95A3]">Jumlah pekerjaan dan proyek per divisi.</p>
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
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Item</span>
          </div>
        </div>

        {/* Legend list — nama pendek, no overflow */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
          {chartData.map((d, i) => {
            const pct = total ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12.5, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shortName(d.name)}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700, width: 24, textAlign: "right", flexShrink: 0 }}>{d.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
