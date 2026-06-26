"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import { getPekerjaanList, getProyekList, getDashboardStaf } from "@/lib/api";
import { mapPekerjaan, mapProyek, extractList } from "@/lib/api-mapper";
import { PERTANYAAN_SURVEY } from "@/lib/data";
import type { Pekerjaan, Proyek, HasilSurvey } from "@/types";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  assigned: "Ditugaskan",
  in_progress: "Sedang Berlangsung",
  review: "Dalam Tinjauan",
  done: "Selesai",
};

const STATUS_COLOR: Record<string, string> = {
  assigned: "#0891B2",
  in_progress: "#2563EB",
  review: "#D97706",
  done: "#16a34a",
};

const BULAN_SINGKAT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

const TW_BADGE_BASE = "inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] before:content-[''] before:shrink-0 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[rgba(255,255,255,0.85)]";
const TW_BADGE: Record<string, string> = {
  blue:   `${TW_BADGE_BASE} bg-[#2563EB] text-white`,
  cyan:   `${TW_BADGE_BASE} bg-[#0891B2] text-white`,
  indigo: `${TW_BADGE_BASE} bg-[#6D28D9] text-white`,
  yellow: `${TW_BADGE_BASE} bg-[#D97706] text-white`,
  green:  `${TW_BADGE_BASE} bg-[#16A34A] text-white`,
  red:    `${TW_BADGE_BASE} bg-[#DC2626] text-white`,
};
const TW_BADGE_LIGHT = "inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px]";

// ─── Komponen chart primitif ──────────────────────────────────────────────────

/** Bar chart horizontal dengan label kiri & nilai kanan */
function HBarChart({ data, color = "#2563EB", maxItems = 6 }: {
  data: [string, number][];
  color?: string;
  maxItems?: number;
}) {
  const visible = data.slice(0, maxItems);
  const max = Math.max(...visible.map(([, v]) => v), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {visible.map(([label, val], i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#64748B", width: 148, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }} title={label}>
            {label}
          </span>
          <div style={{ flex: 1, height: 10, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${(val / max) * 100}%`, height: "100%",
              background: color, borderRadius: 99,
              transition: "width .5s cubic-bezier(.4,0,.2,1)",
              opacity: 1 - i * 0.1,
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, minWidth: 20, textAlign: "right", color: "#0B1E4B" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

/** Column chart vertikal untuk tren bulanan */
function VBarChart({ data, color = "#2563EB", height = 120 }: {
  data: { label: string; val: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.val), 1);
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "4px 2px 0", minWidth: 320 }}>
        {data.map(({ label, val }) => {
          const pct = Math.round((val / max) * 100);
          return (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {val > 0 && <span style={{ fontSize: 10, fontWeight: 700, color }}>{val}</span>}
              <div style={{
                width: "100%", height: `${pct}%`,
                minHeight: val > 0 ? 8 : 2,
                background: val > 0 ? color : "#F1F5F9",
                borderRadius: "4px 4px 2px 2px",
                transition: "height .5s cubic-bezier(.4,0,.2,1)",
              }} />
              <span style={{ fontSize: 9, color: "#94A3B8", whiteSpace: "nowrap" }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Stacked column chart — pekerjaan vs proyek */
function StackedVBarChart({ pekerjaan, proyek, height = 120 }: {
  pekerjaan: number[];
  proyek: number[];
  height?: number;
}) {
  const maxVal = Math.max(...pekerjaan.map((v, i) => v + proyek[i]), 1);
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height, minWidth: 320 }}>
        {BULAN_SINGKAT.map((b, i) => {
          const pk = pekerjaan[i];
          const pr = proyek[i];
          const total = pk + pr;
          const totalPct = Math.round((total / maxVal) * 100);
          return (
            <div key={b} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {total > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: "#475569" }}>{total}</span>}
              <div style={{ width: "100%", height: `${totalPct}%`, minHeight: total > 0 ? 32 : 3, borderRadius: "4px 4px 2px 2px", overflow: "hidden", display: "flex", flexDirection: "column", background: total === 0 ? "#EEF2F7" : "transparent" }}>
                <div style={{ flex: pk, background: "#0B1E4B", transition: "flex .4s" }} />
                <div style={{ flex: pr, background: "#2563EB", transition: "flex .4s" }} />
              </div>
              <span style={{ fontSize: 9, color: "#94A3B8" }}>{b}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        {[["#0B1E4B", "Pekerjaan"], ["#2563EB", "Proyek"]].map(([c, l]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748B" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Donut chart SVG kecil dengan legenda */
function DonutChart({ segments, size = 96 }: {
  segments: { label: string; val: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.val, 0);
  if (total === 0) return <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Belum ada data.</p>;

  const r = 30;
  const cx = 40; const cy = 40;
  let angle = -90;
  const paths = segments.map(({ val, color }) => {
    const pct = val / total;
    const sweep = pct * 360;
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(angle));
    const y1 = cy + r * Math.sin(rad(angle));
    const x2 = cx + r * Math.cos(rad(angle + sweep));
    const y2 = cy + r * Math.sin(rad(angle + sweep));
    const largeArc = sweep > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    angle += sweep;
    return { d, color };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg viewBox="0 0 80 80" width={size} height={size} style={{ flexShrink: 0 }}>
        {paths.map(({ d, color }, i) => (
          <path key={i} d={d} fill={color} opacity={0.9} />
        ))}
        <circle cx={cx} cy={cy} r={18} fill="white" />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#0B1E4B">{total}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {segments.map(({ label, val, color }, i) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 0",
            borderBottom: i < segments.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#64748B", flex: 1 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0B1E4B", minWidth: 24, textAlign: "right" }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Gauge lingkaran untuk skor survei */
function GaugeMeter({ value, max = 5 }: { value: number; max?: number }) {
  const pct = value / max;
  const circumference = 2 * Math.PI * 30;
  const dash = pct * circumference;
  const color = value >= 4 ? "#16a34a" : value >= 3 ? "#D97706" : "#E11D48";
  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      <svg viewBox="0 0 80 80" width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r="30" fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value.toFixed(1)}</span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>/ {max}</span>
      </div>
    </div>
  );
}

/** Kartu stat sederhana dengan ikon emoji */
function StatCard({ label, value, color, icon, sub }: {
  label: string; value: string | number; color: string; icon: string; sub?: string;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #D4E3FF",
      borderTop: `3px solid ${color}`,
      padding: "18px 20px 16px",
      boxShadow: "0 2px 12px rgba(11,30,75,0.07)",
      display: "flex", flexDirection: "column", gap: 3,
    }}>
      <span style={{ fontSize: 10, color: "#7A90B0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 800, color: "#0B1E4B", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color, fontWeight: 600 }}>{sub}</span>}
    </div>
  );
}

/** Card wrapper tipis */
function ChartCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid rgba(148,163,184,0.25)",
      padding: "20px 22px",
      boxShadow: "0 3px 14px rgba(15,23,42,0.09)",
    }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1.5px solid #EEF2FA" }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0B1E4B" }}>{title}</h3>
        {subtitle && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94A3B8" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** Alert / CTA banner */
function AlertBanner({ color, icon, title, desc, href, linkLabel }: {
  color: string; icon: string; title: string; desc: string; href: string; linkLabel: string;
}) {
  return (
    <div style={{
      background: `${color}18`, border: `1px solid ${color}45`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 12, padding: "14px 18px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0B1E4B" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{desc}</div>
        </div>
      </div>
      <a href={href} style={{
        background: color, color: "#fff", border: "none",
        padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
        textDecoration: "none", whiteSpace: "nowrap",
      }}>{linkLabel}</a>
    </div>
  );
}

// ─── Helper data ──────────────────────────────────────────────────────────────

function byMonth(items: { targetSelesai: string }[]) {
  const counts = new Array(12).fill(0);
  items.forEach((x) => {
    const m = new Date(x.targetSelesai).getMonth();
    if (!isNaN(m)) counts[m]++;
  });
  return counts;
}

function getAvgSurvey(list: HasilSurvey[]): number {
  if (!list.length) return 0;
  const qIds = PERTANYAAN_SURVEY.filter((q) => q.tipeJawaban === "pilihan").map((q) => q.id);
  let total = 0, count = 0;
  list.forEach((s) => s.jawaban.forEach((j) => {
    if (qIds.includes(j.pertanyaanId) && j.nilaiPilihan) { total += j.nilaiPilihan; count++; }
  }));
  return count > 0 ? total / count : 0;
}

function countByStatus(items: (Pekerjaan | Proyek)[]) {
  const m: Record<string, number> = {};
  items.forEach((x) => { m[x.status] = (m[x.status] || 0) + 1; });
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD OPERATOR
// ─────────────────────────────────────────────────────────────────────────────

function DashboardOperator({ pk, pr }: { pk: Pekerjaan[]; pr: Proyek[] }) {
  const all = [...pk, ...pr];
  const totalPk = pk.length;
  const totalPr = pr.length;
  const belumSurat = all.filter((x) => !x.id_surat_tugas && x.suratStatus !== "draft" && x.suratStatus !== "published").length;
  const preview = all.filter((x) => x.suratStatus === "draft").length;
  const published = all.filter((x) => x.suratStatus === "published").length;
  const laporanSiap = all.filter((x) => x.status === "done").length;
  const menungguDisposisi = all.filter((x) => x.assignees.length === 0).length;

  const statusSeg = ["assigned","in_progress","review","done"].map((s) => ({
    label: STATUS_LABEL[s], val: all.filter((x) => x.status === s).length, color: STATUS_COLOR[s],
  }));

  const unitCount: Record<string, number> = {};
  all.forEach((x) => { if (x.unitPeminta) unitCount[x.unitPeminta] = (unitCount[x.unitPeminta] || 0) + 1; });
  const topUnit = Object.entries(unitCount).sort((a, b) => b[1] - a[1]);

  const pkByMonth = byMonth(pk);
  const prByMonth = byMonth(pr);

  const terbaru = [
    ...pk.map((x) => ({ id: x.id, nama: x.namaPekerjaan, tipe: "Pekerjaan", unit: x.unitPeminta, status: x.status, suratStatus: x.suratStatus, hasSurat: !!x.id_surat_tugas, target: x.targetSelesai })),
    ...pr.map((x) => ({ id: x.id, nama: x.namaProyek, tipe: "Proyek", unit: x.unitPeminta, status: x.status, suratStatus: x.suratStatus, hasSurat: !!x.id_surat_tugas, target: x.targetSelesai })),
  ].slice(0, 8);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Dashboard Operator</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.7, fontSize: 13 }}>Pantau pekerjaan, proyek, dan administrasi surat tugas dari satu tempat.</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Total Pekerjaan" value={totalPk} color="#2563EB" />
        <StatCard icon="" label="Total Proyek" value={totalPr} color="#0891B2" />
        <StatCard icon="" label="Belum Ada Surat" value={belumSurat} color="#E11D48" sub="perlu dibuat surat tugas" />
        <StatCard icon="" label="Surat Preview" value={preview} color="#D97706" />
        <StatCard icon="" label="Surat Published" value={published} color="#16a34a" />
        <StatCard icon="" label="Laporan Siap" value={laporanSiap} color="#0D9488" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Status Layanan" subtitle="Distribusi semua pekerjaan & proyek">
          <DonutChart segments={statusSeg} size={88} />
        </ChartCard>
        <ChartCard title="Status Surat Tugas" subtitle="Komposisi per tahap administrasi">
          <DonutChart size={88} segments={[
            { label: "Belum Ada", val: belumSurat, color: "#E2E8F0" },
            { label: "Preview", val: preview, color: "#D97706" },
            { label: "Published", val: published, color: "#16a34a" },
          ]} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Volume Layanan per Bulan" subtitle="Pekerjaan vs Proyek berdasarkan target selesai">
          <StackedVBarChart pekerjaan={pkByMonth} proyek={prByMonth} height={130} />
        </ChartCard>
        <ChartCard title="Top Unit Peminta" subtitle="Unit kerja paling aktif mengajukan layanan">
          <HBarChart data={topUnit} color="#0B1E4B" maxItems={6} />
        </ChartCard>
      </div>

      {/* Alert */}
      {menungguDisposisi > 0 && (
        <AlertBanner color="#D97706" icon=""
          title={`${menungguDisposisi} layanan belum ada staf`}
          desc="Pekerjaan/proyek ini menunggu Kadiv melakukan disposisi."
          href="/pekerjaan" linkLabel="Lihat Pekerjaan" />
      )}

      {/* Tabel terbaru */}
      <ChartCard title="Pekerjaan & Proyek Terbaru" subtitle="8 layanan terakhir yang masuk ke sistem">
        <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
          <table className="w-full border-collapse min-w-[720px] [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:text-left [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
            <thead>
              <tr>
                <th>Nama</th><th className="text-center">Tipe</th><th>Unit Peminta</th>
                <th className="text-center">Status</th><th className="text-center">Surat Tugas</th><th className="text-center">Target</th>
              </tr>
            </thead>
            <tbody>
              {terbaru.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nama}</strong></td>
                  <td className="text-center"><span className={item.tipe === "Proyek" ? TW_BADGE.blue : TW_BADGE.cyan}>{item.tipe}</span></td>
                  <td className="text-[12px]">{item.unit}</td>
                  <td className="text-center"><span className={TW_BADGE_LIGHT} style={{ background: `${STATUS_COLOR[item.status]}20`, color: STATUS_COLOR[item.status] }}>{STATUS_LABEL[item.status]}</span></td>
                  <td className="text-center">
                    {item.suratStatus === "published" ? <span className={TW_BADGE.indigo}>Published</span>
                      : item.suratStatus === "draft" || item.hasSurat ? <span className={TW_BADGE.yellow}>Preview</span>
                      : <span className="text-[var(--text-muted)] text-[12px]">Belum Ada</span>}
                  </td>
                  <td className="text-center text-[12px]">{item.target}</td>
                </tr>
              ))}
              {terbaru.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-[var(--text-muted)]">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD KADIV
// ─────────────────────────────────────────────────────────────────────────────

function DashboardKadiv({ pk, pr, user }: { pk: Pekerjaan[]; pr: Proyek[]; user: any }) {
  const divisi = user?.divisi || "";
  const myPk = pk.filter((p) => p.divisi.includes(divisi));
  const myPr = pr.filter((p) => p.divisi.includes(divisi));
  const all = [...myPk, ...myPr];

  const belumDisposisi = all.filter((x) => x.assignees.length === 0).length;
  const adaPenolakan = all.reduce((s, x) => s + x.assignees.filter((a) => (a.statusKonfirmasi as string) === "rejected").length, 0);
  const menungguKonfirmasi = all.reduce((s, x) => s + x.assignees.filter((a) => a.statusKonfirmasi === "pending").length, 0);
  const menungguACC = all.filter((x) => x.status === "review").length;
  const selesai = all.filter((x) => x.status === "done").length;

  // Beban kerja staf
  const staffMap: Record<string, number> = {};
  all.forEach((p) => p.assignees.forEach((a) => {
    if (a.statusPekerjaan !== "done") staffMap[a.nama] = (staffMap[a.nama] || 0) + 1;
  }));
  const topStaf = Object.entries(staffMap).sort((a, b) => b[1] - a[1]);

  // Status konfirmasi staf
  const konfSeg = [
    { label: "Menunggu", val: menungguKonfirmasi, color: "#0891B2" },
    { label: "Diterima", val: all.reduce((s, x) => s + x.assignees.filter((a) => a.statusKonfirmasi === "accepted").length, 0), color: "#2563EB" },
    { label: "Ditolak", val: adaPenolakan, color: "#E11D48" },
  ];

  // Penyelesaian per bulan
  const doneByMonth = new Array(12).fill(0);
  all.filter((x) => x.status === "done").forEach((x) => {
    const m = new Date(x.targetSelesai).getMonth();
    if (!isNaN(m)) doneByMonth[m]++;
  });

  // Item perlu tindakan
  const aksi = all.filter((x) =>
    x.assignees.length === 0 ||
    (
      x.assignees.some((a) => (a.statusKonfirmasi as string) === "rejected") &&
      !x.assignees.some((a) => a.statusKonfirmasi === "accepted" || a.statusKonfirmasi === "pending")
    ) ||
    x.status === "review"
  ).slice(0, 6);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Dashboard Kepala Divisi</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.7, fontSize: 13 }}>Pantau beban kerja tim, konfirmasi staf, dan tinjauan kinerja divisi Anda.</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Belum Disposisi" value={belumDisposisi} color="#E11D48" sub="perlu ditugaskan staf" />
        <StatCard icon="" label="Menunggu Konfirmasi" value={menungguKonfirmasi} color="#0891B2" />
        <StatCard icon="" label="Penolakan Staf" value={adaPenolakan} color="#D97706" />
        <StatCard icon="" label="Menunggu ACC" value={menungguACC} color="#E11D48" sub="tinjauan kinerja" />
        <StatCard icon="" label="Selesai" value={selesai} color="#16a34a" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Status Konfirmasi Staf" subtitle="Per penugasan di divisi Anda">
          <DonutChart segments={konfSeg} size={84} />
        </ChartCard>
        <ChartCard title="Penyelesaian per Bulan" subtitle="Layanan yang sudah selesai di divisi Anda">
          <VBarChart
            data={BULAN_SINGKAT.map((b, i) => ({ label: b, val: doneByMonth[i] }))}
            color="#0B1E4B" height={110}
          />
        </ChartCard>
      </div>

      {/* Beban kerja staf */}
      <ChartCard title="Beban Kerja Staf" subtitle="Jumlah tugas aktif per staf di divisi Anda">
        {topStaf.length > 0
          ? <HBarChart data={topStaf} color="#0B1E4B" maxItems={8} />
          : <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Belum ada beban kerja staf di divisi ini.</p>
        }
      </ChartCard>

      {/* Alert */}
      {adaPenolakan > 0 && (
        <AlertBanner color="#E11D48" icon=""
          title={`${adaPenolakan} staf menolak penugasan`}
          desc="Lakukan Penugasan Ulang dari kolom Aksi pada tabel Pekerjaan/Proyek."
          href="/pekerjaan" linkLabel="Buka Pekerjaan" />
      )}
      {menungguACC > 0 && (
        <AlertBanner color="#D97706" icon=""
          title={`${menungguACC} layanan menunggu ACC`}
          desc="Buka menu Tinjauan Kinerja untuk memberikan persetujuan."
          href="/tinjauan-kinerja" linkLabel="Buka Tinjauan" />
      )}

      {/* Tabel perlu tindakan */}
      {aksi.length > 0 && (
        <ChartCard title="Perlu Tindakan Segera" subtitle="Layanan yang memerlukan perhatian Anda">
          <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
            <table className="w-full border-collapse min-w-[720px] [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:text-left [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
              <thead>
                <tr><th>Nama</th><th className="text-center">Tipe</th><th className="text-center">Status</th><th className="text-center">Hal yang Perlu Dilakukan</th></tr>
              </thead>
              <tbody>
                {aksi.map((item) => {
                  const isPk = "namaPekerjaan" in item;
                  const nama = isPk ? (item as Pekerjaan).namaPekerjaan : (item as Proyek).namaProyek;
                  const needDisposisi = item.assignees.length === 0;
                  const needReassign = item.assignees.some((a) => (a.statusKonfirmasi as string) === "rejected") &&
                    !item.assignees.some((a) => a.statusKonfirmasi === "accepted" || a.statusKonfirmasi === "pending");
                  const needACC = item.status === "review";
                  return (
                    <tr key={item.id}>
                      <td><strong>{nama}</strong></td>
                      <td className="text-center"><span className={isPk ? TW_BADGE.cyan : TW_BADGE.blue}>{isPk ? "Pekerjaan" : "Proyek"}</span></td>
                      <td className="text-center"><span className={TW_BADGE_LIGHT} style={{ background: `${STATUS_COLOR[item.status]}20`, color: STATUS_COLOR[item.status] }}>{STATUS_LABEL[item.status]}</span></td>
                      <td className="text-center">
                        {needACC ? <a href="/tinjauan-kinerja" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#16A34A] text-white text-[11px] shadow-[0_2px_8px_rgba(22,163,74,0.28)] transition-all hover:bg-[#15803D] hover:-translate-y-px no-underline">ACC</a>
                          : needReassign ? <a href={isPk ? "/pekerjaan" : "/proyek"} className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#D97706] text-white text-[11px] shadow-[0_2px_8px_rgba(217,119,6,0.28)] transition-all hover:bg-[#B45309] hover:-translate-y-px no-underline">Penugasan Ulang</a>
                          : needDisposisi ? <a href={isPk ? "/pekerjaan" : "/proyek"} className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px no-underline">Disposisi</a>
                          : <span className="text-[var(--text-muted)] text-[12px]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STAF
// ─────────────────────────────────────────────────────────────────────────────

function DashboardStaf({ pk, pr, user }: { pk: Pekerjaan[]; pr: Proyek[]; user: any }) {
  const uid = user?.id;
  const myPk = pk.filter((p) => p.assignees.some((a) => a.stafId === uid));
  const myPr = pr.filter((p) => p.assignees.some((a) => a.stafId === uid));

  const all = [
    ...myPk.map((x) => ({ id: x.id, nama: x.namaPekerjaan, tipe: "Pekerjaan", status: x.status, target: x.targetSelesai, statusSaya: x.assignees.find((a) => a.stafId === uid)?.statusKonfirmasi || "-", suratStatus: x.suratStatus })),
    ...myPr.map((x) => ({ id: x.id, nama: x.namaProyek, tipe: "Proyek", status: x.status, target: x.targetSelesai, statusSaya: x.assignees.find((a) => a.stafId === uid)?.statusKonfirmasi || "-", suratStatus: x.suratStatus })),
  ];

  const menunggu = all.filter((x) => x.statusSaya === "pending").length;
  const diterima = all.filter((x) => x.statusSaya === "accepted").length;
  const berjalan = all.filter((x) => x.status === "in_progress").length;
  const review = all.filter((x) => x.status === "review").length;
  const done = all.filter((x) => x.status === "done").length;

  const statusSeg = ["assigned","in_progress","review","done"].map((s) => ({
    label: STATUS_LABEL[s], val: all.filter((x) => x.status === s).length, color: STATUS_COLOR[s],
  }));

  const tugasByMonth = new Array(12).fill(0);
  all.forEach((x) => {
    const m = new Date(x.target).getMonth();
    if (!isNaN(m)) tugasByMonth[m]++;
  });

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Dashboard Staf</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.7, fontSize: 13 }}>Konfirmasi dan kerjakan tugas yang ditugaskan kepada Anda.</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Menunggu Konfirmasi" value={menunggu} color="#0891B2" />
        <StatCard icon="" label="Diterima" value={diterima} color="#2563EB" />
        <StatCard icon="" label="Sedang Dikerjakan" value={berjalan} color="#D97706" />
        <StatCard icon="" label="Dalam Tinjauan" value={review} color="#0891B2" />
        <StatCard icon="" label="Selesai" value={done} color="#16a34a" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Status Tugas Saya" subtitle="Distribusi semua tugas yang ditugaskan">
          <DonutChart segments={statusSeg.filter((s) => s.val > 0)} size={84} />
        </ChartCard>
        <ChartCard title="Distribusi Target Selesai" subtitle="Jumlah tugas berdasarkan bulan target">
          <VBarChart
            data={BULAN_SINGKAT.map((b, i) => ({ label: b, val: tugasByMonth[i] }))}
            color="#0B1E4B" height={110}
          />
        </ChartCard>
      </div>

      {/* Alert */}
      {menunggu > 0 && (
        <AlertBanner color="#0891B2" icon=""
          title={`${menunggu} tugas menunggu konfirmasi Anda`}
          desc="Buka halaman Pekerjaan atau Proyek untuk menerima atau menolak penugasan."
          href="/pekerjaan" linkLabel="Lihat Tugas" />
      )}

      {/* Tabel tugas */}
      <ChartCard title="Semua Tugas Saya" subtitle="Daftar lengkap pekerjaan & proyek yang ditugaskan">
        <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
          <table className="w-full border-collapse min-w-[720px] [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:text-left [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
            <thead>
              <tr>
                <th>Nama</th><th className="text-center">Tipe</th><th className="text-center">Status Saya</th>
                <th className="text-center">Status Tugas</th><th className="text-center">Target</th>
              </tr>
            </thead>
            <tbody>
              {all.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nama}</strong></td>
                  <td className="text-center"><span className={item.tipe === "Proyek" ? TW_BADGE.blue : TW_BADGE.cyan}>{item.tipe}</span></td>
                  <td className="text-center">
                    <span className={TW_BADGE_LIGHT} style={{ background: "#0891B220", color: "#0891B2", fontSize: 11 }}>
                      {item.statusSaya === "pending" ? "Menunggu Konfirmasi"
                        : item.statusSaya === "accepted" ? "Diterima"
                        : item.statusSaya === "rejected" ? "Ditolak"
                        : item.statusSaya}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={TW_BADGE_LIGHT} style={{ background: `${STATUS_COLOR[item.status] || "#F3F5F9"}20`, color: STATUS_COLOR[item.status] || "#475569" }}>
                      {STATUS_LABEL[item.status] || item.status || "—"}
                    </span>
                  </td>
                  <td className="text-center text-[12px]">{item.target}</td>
                </tr>
              ))}
              {all.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-[var(--text-muted)]">Belum ada tugas yang ditugaskan kepada Anda.</td></tr>}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD KEPALA UPA
// ─────────────────────────────────────────────────────────────────────────────

function DashboardKepalaUPA({ pk, pr, surveys }: { pk: Pekerjaan[]; pr: Proyek[]; surveys: HasilSurvey[] }) {
  const all = [...pk, ...pr];
  const total = all.length;
  const berjalan = all.filter((x) => x.status === "in_progress").length;
  const tinjauan = all.filter((x) => x.status === "review").length;
  const selesai = all.filter((x) => x.status === "done").length;
  const avgSurvei = getAvgSurvey(surveys);
  const today = new Date();
  const terlambat = all.filter((x) => x.status !== "done" && new Date(x.targetSelesai) < today).length;
  const laporanSiap = selesai;

  const statusSeg = ["assigned","in_progress","review","done"].map((s) => ({
    label: STATUS_LABEL[s], val: all.filter((x) => x.status === s).length, color: STATUS_COLOR[s],
  }));

  const pkByMonth = byMonth(pk);
  const prByMonth = byMonth(pr);

  const unitCount: Record<string, number> = {};
  all.forEach((x) => { if (x.unitPeminta) unitCount[x.unitPeminta] = (unitCount[x.unitPeminta] || 0) + 1; });
  const topUnit = Object.entries(unitCount).sort((a, b) => b[1] - a[1]);

  const divisiCount: Record<string, number> = {};
  all.forEach((x) => x.divisi.forEach((d) => { divisiCount[d] = (divisiCount[d] || 0) + 1; }));
  const topDivisi = Object.entries(divisiCount).sort((a, b) => b[1] - a[1]);

  const staffMap: Record<string, number> = {};
  all.forEach((p) => p.assignees.forEach((a) => {
    if (a.statusPekerjaan !== "done") staffMap[a.nama] = (staffMap[a.nama] || 0) + 1;
  }));
  const topStaf = Object.entries(staffMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Dashboard Kepala UPA</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.7, fontSize: 13 }}>Gambaran menyeluruh kinerja layanan, beban tim, dan kepuasan klien.</p>
          </div>
          {avgSurvei > 0 && (
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: "12px 20px", textAlign: "center", backdropFilter: "blur(8px)" }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Indeks Kepuasan</div>
              <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{avgSurvei.toFixed(1)}<span style={{ fontSize: 16, opacity: 0.7 }}>/5</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Total Layanan" value={total} color="#2563EB" />
        <StatCard icon="" label="Berjalan" value={berjalan} color="#D97706" />
        <StatCard icon="" label="Dalam Tinjauan" value={tinjauan} color="#0891B2" />
        <StatCard icon="" label="Selesai" value={selesai} color="#16a34a" />
        <StatCard icon="" label="Terlambat" value={terlambat} color="#E11D48" sub="melebihi target" />
        <StatCard icon="" label="Laporan Siap" value={laporanSiap} color="#0D9488" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Status Kinerja Layanan" subtitle="Distribusi semua pekerjaan & proyek">
          <DonutChart segments={statusSeg} size={90} />
        </ChartCard>
        <ChartCard title="Volume Layanan per Bulan" subtitle="Pekerjaan vs Proyek sepanjang tahun">
          <StackedVBarChart pekerjaan={pkByMonth} proyek={prByMonth} height={130} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Top Unit Peminta Layanan" subtitle="Unit kerja paling banyak mengajukan layanan">
          <HBarChart data={topUnit} color="#0B1E4B" maxItems={7} />
        </ChartCard>
        <ChartCard title="Beban per Divisi Pelaksana" subtitle="Divisi dengan tugas terbanyak">
          <HBarChart data={topDivisi} color="#0B1E4B" maxItems={6} />
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Beban Kerja Staf" subtitle="Jumlah tugas aktif per staf">
          {topStaf.length > 0
            ? <HBarChart data={topStaf} color="#0B1E4B" maxItems={8} />
            : <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Belum ada data beban kerja staf.</p>
          }
        </ChartCard>
        <ChartCard title="Indeks Kepuasan Klien" subtitle="Rata-rata dari semua survei yang masuk">
          {surveys.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <GaugeMeter value={avgSurvei} />
              <div style={{ flex: 1 }}>
                {PERTANYAAN_SURVEY.filter((q) => q.tipeJawaban === "pilihan").map((q) => {
                  const vals = surveys.flatMap((s) => s.jawaban.filter((j) => j.pertanyaanId === q.id && j.nilaiPilihan).map((j) => j.nilaiPilihan!));
                  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                  return (
                    <div key={q.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.teks.replace("Seberapa puas Anda terhadap ", "")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 99 }}>
                          <div style={{ width: `${(avg / 5) * 100}%`, height: "100%", background: avg >= 4 ? "#16a34a" : "#D97706", borderRadius: 99, transition: "width .5s" }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0B1E4B", minWidth: 26 }}>{avg.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, fontSize: 11, color: "#94A3B8" }}>{surveys.length} responden</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10, textAlign: "center" }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ opacity: 0.22 }}>
                <rect x="4" y="24" width="8" height="16" rx="2" fill="#0B1E4B"/>
                <rect x="18" y="14" width="8" height="26" rx="2" fill="#0B1E4B"/>
                <rect x="32" y="8" width="8" height="32" rx="2" fill="#0B1E4B"/>
              </svg>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Belum ada survei masuk</div>
              <div style={{ fontSize: 12, color: "#94A3B8", maxWidth: 200, lineHeight: 1.6 }}>Data kepuasan klien muncul setelah survei pertama dikirimkan</div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { role, user } = useRole();
  const [pk, setPk] = useState<Pekerjaan[]>([]);
  const [pr, setPr] = useState<Proyek[]>([]);
  const [surveys] = useState<HasilSurvey[]>([]); // survei tersedia di tinjauan kinerja
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;
    setLoading(true);
    setError(null);

    const pkFilter = role === "staf" ? { id_pengguna_staf: user?.id } : {};
    const prFilter = role === "staf" ? { id_pengguna_staf: user?.id } : {};

    Promise.all([
      getPekerjaanList(pkFilter),
      getProyekList(prFilter),
    ])
      .then(([pkRes, prRes]) => {
        setPk(extractList(pkRes).map(mapPekerjaan));
        setPr(extractList(prRes).map(mapProyek));
      })
      .catch(() => { setPk([]); setPr([]); })
      .finally(() => setLoading(false));
  }, [role, user?.id]);

  if (loading) return <div className="flex flex-col gap-[22px]"><p className="text-[var(--text-muted)] text-[12px]">Memuat dashboard...</p></div>;

  if (role === "operator")     return <DashboardOperator pk={pk} pr={pr} />;
  if (role === "kepala-divisi") return <DashboardKadiv pk={pk} pr={pr} user={user} />;
  if (role === "staf")         return <DashboardStaf pk={pk} pr={pr} user={user} />;
  if (role === "kepala-upa")   return <DashboardKepalaUPA pk={pk} pr={pr} surveys={surveys} />;

  // Fallback loading / publik
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Sistem Manajemen Layanan</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.75 }}>UPA Teknologi Informasi dan Komunikasi — Universitas Lampung</p>
        </div>
      </div>
    </div>
  );
}

