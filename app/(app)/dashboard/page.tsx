"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import { getPekerjaan, getProyek, getHasilSurvey, seedIfEmpty } from "@/lib/storage";
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
  assigned: "#7C3AED",
  in_progress: "#3B6BDB",
  review: "#D97706",
  done: "#16a34a",
};

const BULAN_SINGKAT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

// ─── Komponen chart primitif ──────────────────────────────────────────────────

/** Bar chart horizontal dengan label kiri & nilai kanan */
function HBarChart({ data, color = "#3B6BDB", maxItems = 6 }: {
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
          <span style={{ fontSize: 12, fontWeight: 700, minWidth: 20, textAlign: "right", color: "#1E3A5F" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

/** Column chart vertikal untuk tren bulanan */
function VBarChart({ data, color = "#3B6BDB", height = 120 }: {
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
              <div style={{ width: "100%", height: `${totalPct}%`, minHeight: total > 0 ? 6 : 2, borderRadius: "4px 4px 2px 2px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: pk, background: "#3B6BDB", transition: "flex .4s" }} />
                <div style={{ flex: pr, background: "#2EA86B", transition: "flex .4s" }} />
              </div>
              <span style={{ fontSize: 9, color: "#94A3B8" }}>{b}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        {[["#3B6BDB", "Pekerjaan"], ["#2EA86B", "Proyek"]].map(([c, l]) => (
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
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#1E3A5F">{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map(({ label, val, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#475569" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1E3A5F", marginLeft: "auto", paddingLeft: 8 }}>{val}</span>
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
  const color = value >= 4 ? "#16a34a" : value >= 3 ? "#D97706" : "#D94040";
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
      background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
      borderRadius: 16,
      border: "none",
      padding: "18px 20px",
      boxShadow: `0 4px 16px ${color}44`,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.70)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginTop: 4 }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{sub}</span>}
    </div>
  );
}

/** Card wrapper tipis */
function ChartCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="chart-card" style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid rgba(148,163,184,0.25)",
      padding: "20px 22px",
      boxShadow: "0 3px 14px rgba(15,23,42,0.09)",
    }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1.5px solid #EEF2FA" }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>{title}</h3>
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
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E3A5F" }}>{title}</div>
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
  const belumSurat = all.filter((x) => !x.suratTugasData).length;
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
    ...pk.map((x) => ({ id: x.id, nama: x.namaPekerjaan, tipe: "Pekerjaan", unit: x.unitPeminta, status: x.status, suratStatus: x.suratStatus, suratTugasData: x.suratTugasData, target: x.targetSelesai })),
    ...pr.map((x) => ({ id: x.id, nama: x.namaProyek, tipe: "Proyek", unit: x.unitPeminta, status: x.status, suratStatus: x.suratStatus, suratTugasData: x.suratTugasData, target: x.targetSelesai })),
  ].slice(0, 8);

  return (
    <div className="dashboard-stack">
      <div className="dashboard-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Panel Operator</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Manajemen Layanan UPA TIK</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.75, fontSize: 14 }}>Pantau pekerjaan, proyek, dan administrasi surat tugas dari satu tempat.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Total Pekerjaan" value={totalPk} color="#3B6BDB" />
        <StatCard icon="" label="Total Proyek" value={totalPr} color="#7C3AED" />
        <StatCard icon="" label="Belum Ada Surat" value={belumSurat} color="#D94040" sub="perlu dibuat surat tugas" />
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
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <ChartCard title="Volume Layanan per Bulan" subtitle="Pekerjaan vs Proyek berdasarkan target selesai">
          <StackedVBarChart pekerjaan={pkByMonth} proyek={prByMonth} height={130} />
        </ChartCard>
        <ChartCard title="Top Unit Peminta" subtitle="Unit kerja paling aktif mengajukan layanan">
          <HBarChart data={topUnit} color="#3B6BDB" maxItems={6} />
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
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th><th className="th-center">Tipe</th><th>Unit Peminta</th>
                <th className="th-center">Status</th><th className="th-center">Surat Tugas</th><th className="th-center">Target</th>
              </tr>
            </thead>
            <tbody>
              {terbaru.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nama}</strong></td>
                  <td className="td-center"><span className={`badge ${item.tipe === "Proyek" ? "badge-blue" : "badge-cyan"}`}>{item.tipe}</span></td>
                  <td className="text-small">{item.unit}</td>
                  <td className="td-center"><span className="badge" style={{ background: `${STATUS_COLOR[item.status]}20`, color: STATUS_COLOR[item.status] }}>{STATUS_LABEL[item.status]}</span></td>
                  <td className="td-center">
                    {item.suratStatus === "published" ? <span className="badge badge-indigo">Published</span>
                      : item.suratTugasData ? <span className="badge badge-yellow">Preview</span>
                      : <span className="text-muted text-small">Belum Ada</span>}
                  </td>
                  <td className="td-center text-small">{item.target}</td>
                </tr>
              ))}
              {terbaru.length === 0 && <tr className="empty-row"><td colSpan={6}>Belum ada data.</td></tr>}
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
  const adaPenolakan = all.reduce((s, x) => s + x.assignees.filter((a) => a.statusKonfirmasi === "rejected" || a.statusKonfirmasi === "rejected").length, 0);
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
    { label: "Menunggu", val: menungguKonfirmasi, color: "#7C3AED" },
    { label: "Diterima", val: all.reduce((s, x) => s + x.assignees.filter((a) => a.statusKonfirmasi === "accepted").length, 0), color: "#3B6BDB" },
    { label: "Ditolak", val: adaPenolakan, color: "#D94040" },
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
      x.assignees.some((a) => a.statusKonfirmasi === "rejected" || a.statusKonfirmasi === "rejected") &&
      !x.assignees.some((a) => a.statusKonfirmasi === "accepted" || a.statusKonfirmasi === "pending")
    ) ||
    x.status === "review"
  ).slice(0, 6);

  return (
    <div className="dashboard-stack">
      <div className="dashboard-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Kepala Divisi</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{divisi || "Dashboard Kadiv"}</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.75, fontSize: 14 }}>Pantau beban kerja tim, konfirmasi staf, dan tinjauan kinerja divisi Anda.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Belum Disposisi" value={belumDisposisi} color="#D94040" sub="perlu ditugaskan staf" />
        <StatCard icon="" label="Menunggu Konfirmasi" value={menungguKonfirmasi} color="#7C3AED" />
        <StatCard icon="" label="Penolakan Staf" value={adaPenolakan} color="#D97706" />
        <StatCard icon="" label="Menunggu ACC" value={menungguACC} color="#D97706" sub="tinjauan kinerja" />
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
            color="#16a34a" height={110}
          />
        </ChartCard>
      </div>

      {/* Beban kerja staf */}
      <ChartCard title="Beban Kerja Staf" subtitle="Jumlah tugas aktif per staf di divisi Anda">
        {topStaf.length > 0
          ? <HBarChart data={topStaf} color="#3B6BDB" maxItems={8} />
          : <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Belum ada beban kerja staf di divisi ini.</p>
        }
      </ChartCard>

      {/* Alert */}
      {adaPenolakan > 0 && (
        <AlertBanner color="#D94040" icon=""
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
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Nama</th><th className="th-center">Tipe</th><th className="th-center">Status</th><th className="th-center">Hal yang Perlu Dilakukan</th></tr>
              </thead>
              <tbody>
                {aksi.map((item) => {
                  const isPk = "namaPekerjaan" in item;
                  const nama = isPk ? (item as Pekerjaan).namaPekerjaan : (item as Proyek).namaProyek;
                  const needDisposisi = item.assignees.length === 0;
                  const needReassign = item.assignees.some((a) => a.statusKonfirmasi === "rejected" || a.statusKonfirmasi === "rejected") &&
                    !item.assignees.some((a) => a.statusKonfirmasi === "accepted" || a.statusKonfirmasi === "pending");
                  const needACC = item.status === "review";
                  return (
                    <tr key={item.id}>
                      <td><strong>{nama}</strong></td>
                      <td className="td-center"><span className={`badge ${isPk ? "badge-cyan" : "badge-blue"}`}>{isPk ? "Pekerjaan" : "Proyek"}</span></td>
                      <td className="td-center"><span className="badge" style={{ background: `${STATUS_COLOR[item.status]}20`, color: STATUS_COLOR[item.status] }}>{STATUS_LABEL[item.status]}</span></td>
                      <td className="td-center">
                        {needACC ? <a href="/tinjauan-kinerja" className="btn-success btn-sm">ACC</a>
                          : needReassign ? <a href={isPk ? "/pekerjaan" : "/proyek"} className="btn-warning btn-sm">Penugasan Ulang</a>
                          : needDisposisi ? <a href={isPk ? "/pekerjaan" : "/proyek"} className="btn-edit btn-sm">Disposisi</a>
                          : <span className="text-muted text-small">—</span>}
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
    <div className="dashboard-stack">
      <div className="dashboard-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Portal Staf</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Selamat datang, {user?.nama?.split(" ")[0] || "Staf"}</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.75, fontSize: 14 }}>Lihat ringkasan tugas Anda, status konfirmasi, dan progres pekerjaan hari ini.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Menunggu Konfirmasi" value={menunggu} color="#7C3AED" />
        <StatCard icon="" label="Diterima" value={diterima} color="#3B6BDB" />
        <StatCard icon="" label="Sedang Dikerjakan" value={berjalan} color="#D97706" />
        <StatCard icon="" label="Dalam Tinjauan" value={review} color="#D97706" />
        <StatCard icon="" label="Selesai" value={done} color="#16a34a" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>
        <ChartCard title="Status Tugas Saya" subtitle="Distribusi semua tugas yang ditugaskan">
          <DonutChart segments={statusSeg.filter((s) => s.val > 0)} size={84} />
        </ChartCard>
        <ChartCard title="Distribusi Target Selesai" subtitle="Jumlah tugas berdasarkan bulan target">
          <VBarChart
            data={BULAN_SINGKAT.map((b, i) => ({ label: b, val: tugasByMonth[i] }))}
            color="#3B6BDB" height={110}
          />
        </ChartCard>
      </div>

      {/* Alert */}
      {menunggu > 0 && (
        <AlertBanner color="#7C3AED" icon=""
          title={`${menunggu} tugas menunggu konfirmasi Anda`}
          desc="Buka halaman Pekerjaan atau Proyek untuk menerima atau menolak penugasan."
          href="/pekerjaan" linkLabel="Lihat Tugas" />
      )}

      {/* Tabel tugas */}
      <ChartCard title="Semua Tugas Saya" subtitle="Daftar lengkap pekerjaan & proyek yang ditugaskan">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th><th className="th-center">Tipe</th><th className="th-center">Status Saya</th>
                <th className="th-center">Status Tugas</th><th className="th-center">Target</th>
              </tr>
            </thead>
            <tbody>
              {all.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nama}</strong></td>
                  <td className="td-center"><span className={`badge ${item.tipe === "Proyek" ? "badge-blue" : "badge-cyan"}`}>{item.tipe}</span></td>
                  <td className="td-center">
                    <span className="badge" style={{ background: "#7C3AED20", color: "#7C3AED", fontSize: 11 }}>
                      {item.statusSaya === "pending" ? "Menunggu Konfirmasi"
                        : item.statusSaya === "accepted" ? "Diterima"
                        : item.statusSaya === "rejected" ? "Ditolak"
                        : item.statusSaya}
                    </span>
                  </td>
                  <td className="td-center">
                    <span className="badge" style={{ background: `${STATUS_COLOR[item.status] || "#F3F5F9"}20`, color: STATUS_COLOR[item.status] || "#475569" }}>
                      {STATUS_LABEL[item.status] || item.status || "—"}
                    </span>
                  </td>
                  <td className="td-center text-small">{item.target}</td>
                </tr>
              ))}
              {all.length === 0 && <tr className="empty-row"><td colSpan={5}>Belum ada tugas yang ditugaskan kepada Anda.</td></tr>}
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
    <div className="dashboard-stack">
      <div className="dashboard-hero">
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Kepala UPA</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Monitoring Kinerja UPA TIK</h1>
            <p style={{ margin: "8px 0 0", opacity: 0.75, fontSize: 14 }}>Gambaran menyeluruh kinerja layanan, beban tim, dan kepuasan klien.</p>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
        <StatCard icon="" label="Total Layanan" value={total} color="#3B6BDB" />
        <StatCard icon="" label="Berjalan" value={berjalan} color="#D97706" />
        <StatCard icon="" label="Dalam Tinjauan" value={tinjauan} color="#7C3AED" />
        <StatCard icon="" label="Selesai" value={selesai} color="#16a34a" />
        <StatCard icon="" label="Terlambat" value={terlambat} color="#D94040" sub="melebihi target" />
        <StatCard icon="" label="Laporan Siap" value={laporanSiap} color="#0D9488" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}>
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
          <HBarChart data={topUnit} color="#3B6BDB" maxItems={7} />
        </ChartCard>
        <ChartCard title="Beban per Divisi Pelaksana" subtitle="Divisi dengan tugas terbanyak">
          <HBarChart data={topDivisi} color="#7C3AED" maxItems={6} />
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Beban Kerja Staf" subtitle="Jumlah tugas aktif per staf">
          {topStaf.length > 0
            ? <HBarChart data={topStaf} color="#0D9488" maxItems={8} />
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
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1E3A5F", minWidth: 26 }}>{avg.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, fontSize: 11, color: "#94A3B8" }}>{surveys.length} responden</div>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Belum ada data survei klien.</p>
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
  const [surveys, setSurveys] = useState<HasilSurvey[]>([]);

  useEffect(() => {
    seedIfEmpty();
    setPk(getPekerjaan());
    setPr(getProyek());
    setSurveys(getHasilSurvey());
  }, []);

  if (role === "operator")     return <DashboardOperator pk={pk} pr={pr} />;
  if (role === "kepala-divisi") return <DashboardKadiv pk={pk} pr={pr} user={user} />;
  if (role === "staf")         return <DashboardStaf pk={pk} pr={pr} user={user} />;
  if (role === "kepala-upa")   return <DashboardKepalaUPA pk={pk} pr={pr} surveys={surveys} />;

  // Fallback loading / publik
  return (
    <div className="dashboard-stack">
      <div className="dashboard-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Sistem Manajemen Layanan</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.75 }}>UPA Teknologi Informasi dan Komunikasi — Universitas Lampung</p>
        </div>
      </div>
    </div>
  );
}
