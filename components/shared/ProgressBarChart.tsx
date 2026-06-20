"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getPekerjaan, getProyek } from "@/lib/storage";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #DDE1E9", borderRadius: 10, padding: "10px 16px", fontSize: 13, boxShadow: "0 2px 12px rgba(30,79,163,0.10)" }}>
        <p style={{ fontWeight: 700, color: "#1A1F2E", marginBottom: 6 }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, flexShrink: 0 }} />
            <span style={{ color: "#485068" }}>{p.name}</span>
            <span style={{ fontWeight: 700, color: "#1A1F2E", marginLeft: "auto" }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const statusKeys = ["assigned", "in_progress", "review", "done"] as const;
const statusLabels: Record<string, string> = {
  "assigned": "Ditugaskan",
  "in_progress": "Sedang Berlangsung",
  "review": "Dalam Tinjauan",
  "done": "Selesai",
};

export default function ProgressBarChart() {
  const [chartData, setChartData] = useState<{ name: string; Pekerjaan: number; Proyek: number }[]>([]);

  useEffect(() => {
    const pekerjaan = getPekerjaan();
    const proyek = getProyek();
    setChartData(statusKeys.map((s) => ({
      name: statusLabels[s],
      Pekerjaan: pekerjaan.filter((p) => p.status === s).length,
      Proyek: proyek.filter((p) => p.status === s).length,
    })));
  }, []);

  return (
    <div className="bg-white border border-[#E8ECF4] rounded-[20px] p-[22px] shadow-[0_4px_12px_rgba(11,30,75,0.09)]">
      <div className="flex flex-col gap-1 pb-3 mb-4 border-b border-[#E8ECF4]">
        <h3 className="m-0 font-bold text-[16px] text-[#0B1E4B]">Rekapitulasi per Status</h3>
        <p className="m-0 text-[12px] text-[#8A95A3]">Perbandingan jumlah pekerjaan dan proyek per status.</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8A93AA" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8A93AA" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(30,79,163,0.05)", radius: 6 }} />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 13, paddingTop: 12, color: "#485068" }}
          />
          <Bar dataKey="Pekerjaan" fill="#1E4FA3" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Proyek" fill="#2EA86B" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
