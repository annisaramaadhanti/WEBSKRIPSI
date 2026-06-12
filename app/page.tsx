"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPekerjaan, getProyek } from "@/lib/storage";
import { unitPemintaList } from "@/lib/data";
import type { Pekerjaan, Proyek } from "@/types";

const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const STATUS_LABEL: Record<string,string> = {
  assigned:"Ditugaskan", in_progress:"Sedang Berlangsung",
  review:"Dalam Tinjauan", done:"Selesai",
};
const STATUS_COLOR: Record<string,string> = {
  assigned:"#7C3AED", in_progress:"#2563EB", review:"#D97706", done:"#16A34A",
};
const STATUS_BG: Record<string,string> = {
  assigned:"#F0EAFB", in_progress:"#EBF2FF", review:"#FEF9E7", done:"#E8F5EE",
};

type AnyItem = {
  id:string; nama:string; tipe:"Pekerjaan"|"Proyek";
  unitPeminta:string; divisi:string[]; status:string; targetSelesai:string;
};

export default function PublicDashboard() {
  const [pk, setPk] = useState<Pekerjaan[]>([]);
  const [pr, setPr] = useState<Proyek[]>([]);
  const [filterTahun, setFilterTahun] = useState("semua");
  const [filterBulan, setFilterBulan] = useState("semua");
  const [filterTipe, setFilterTipe] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterUnit, setFilterUnit] = useState("semua");
  const [sortBy, setSortBy] = useState("terbaru");

  useEffect(() => { setPk(getPekerjaan()); setPr(getProyek()); }, []);

  const tahunList = Array.from(new Set(
    [...pk,...pr].map(x => new Date(x.targetSelesai).getFullYear()).filter(y => !isNaN(y))
  )).sort((a,b) => b-a);

  // Status kinerja valid — tidak tampilkan status konfirmasi staf
  const STATUS_KINERJA = ["assigned", "in_progress", "review", "done"];

  const all: AnyItem[] = [
    ...pk.map(x => ({ id:x.id, nama:x.namaPekerjaan, tipe:"Pekerjaan" as const, unitPeminta:x.unitPeminta||"—", divisi:x.divisi, status:x.status, targetSelesai:x.targetSelesai })),
    ...pr.map(x => ({ id:x.id, nama:x.namaProyek, tipe:"Proyek" as const, unitPeminta:x.unitPeminta||"—", divisi:x.divisi, status:x.status, targetSelesai:x.targetSelesai })),
  ].filter(x => STATUS_KINERJA.includes(x.status)); // hanya status kinerja

  const filtered = all.filter(x => {
    const d = new Date(x.targetSelesai);
    if (filterTahun !== "semua" && d.getFullYear() !== Number(filterTahun)) return false;
    if (filterBulan !== "semua" && d.getMonth() !== Number(filterBulan)) return false;
    if (filterTipe !== "semua" && x.tipe !== filterTipe) return false;
    if (filterStatus !== "semua" && x.status !== filterStatus) return false;
    if (filterUnit !== "semua" && x.unitPeminta !== filterUnit) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "terbaru") return new Date(b.targetSelesai).getTime() - new Date(a.targetSelesai).getTime();
    if (sortBy === "terlama") return new Date(a.targetSelesai).getTime() - new Date(b.targetSelesai).getTime();
    if (sortBy === "nama") return a.nama.localeCompare(b.nama);
    return 0;
  });

  const total = filtered.length;
  const totalPk = filtered.filter(x => x.tipe==="Pekerjaan").length;
  const totalPr = filtered.filter(x => x.tipe==="Proyek").length;
  const berjalan = filtered.filter(x => x.status==="in_progress").length;
  const tinjauan = filtered.filter(x => x.status==="review").length;
  const selesai = filtered.filter(x => x.status==="done").length;

  const trafficPerBulan = BULAN.map((_,i) => filtered.filter(x => new Date(x.targetSelesai).getMonth()===i).length);
  const maxTraffic = Math.max(...trafficPerBulan, 1);

  const unitCount: Record<string,number> = {};
  filtered.forEach(x => { unitCount[x.unitPeminta] = (unitCount[x.unitPeminta]||0)+1; });
  const topUnit = Object.entries(unitCount).sort((a,b) => b[1]-a[1]).slice(0,7);
  const maxUnit = topUnit[0]?.[1] || 1;

  const divisiCount: Record<string,number> = {};
  filtered.forEach(x => x.divisi.forEach(d => { divisiCount[d] = (divisiCount[d]||0)+1; }));
  const topDivisi = Object.entries(divisiCount).sort((a,b) => b[1]-a[1]).slice(0,6);
  const maxDivisi = topDivisi[0]?.[1] || 1;

  const statusData = [
    { label:"Ditugaskan", val:filtered.filter(x=>x.status==="assigned").length, color:"#7C3AED" },
    { label:"Sedang Berlangsung", val:berjalan, color:"#2563EB" },
    { label:"Dalam Tinjauan", val:tinjauan, color:"#D97706" },
    { label:"Selesai", val:selesai, color:"#16A34A" },
  ];

  // Donut SVG
  const donutSize = 96;
  const r = 32; const cx = 48; const cy = 48;
  let angle = -90;
  const donutPaths = statusData.filter(s => s.val > 0).map(({ val, color }) => {
    const pct = val / (total || 1);
    const sweep = pct * 360;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(angle));
    const y1 = cy + r * Math.sin(toRad(angle));
    const x2 = cx + r * Math.cos(toRad(angle + sweep - 0.5));
    const y2 = cy + r * Math.sin(toRad(angle + sweep - 0.5));
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    angle += sweep;
    return { d, color };
  });

  return (
    <>
<div className="pub-root">
        {/* NAV */}
        <nav className="pub-nav">
          <div className="pub-nav-brand">
            <img src="/logo-upa.png" alt="UPA TIK Unila" className="pub-nav-logo" />
            <div className="pub-nav-divider" />
            <span className="pub-nav-title">SIMPROTIK</span>
            <span className="pub-nav-badge">Dashboard Publik</span>
          </div>
          <Link href="/login" className="pub-nav-cta">
            Masuk ke Sistem
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </nav>

        {/* HERO */}
        <div className="pub-hero">
          <div className="pub-hero-inner">
            <div className="pub-hero-eyebrow">
              <span className="pub-hero-eyebrow-dot" />
              UPA Teknologi Informasi dan Komunikasi
            </div>
            <h1 className="pub-hero-title">Statistik Layanan — Universitas Lampung</h1>
            <p className="pub-hero-sub">Data pekerjaan dan proyek yang tercatat di sistem SIMPROTIK</p>
          </div>
        </div>

        <div className="pub-content">

          {/* FILTER BAR */}
          <div className="pub-filter-bar">
            <span className="pub-filter-label">Filter</span>
            <select className="pub-select" value={filterTahun} onChange={e=>setFilterTahun(e.target.value)}>
              <option value="semua">Semua Tahun</option>
              {tahunList.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <select className="pub-select" value={filterBulan} onChange={e=>setFilterBulan(e.target.value)}>
              <option value="semua">Semua Bulan</option>
              {BULAN.map((b,i)=><option key={i} value={i}>{b}</option>)}
            </select>
            <select className="pub-select" value={filterTipe} onChange={e=>setFilterTipe(e.target.value)}>
              <option value="semua">Semua Tipe</option>
              <option value="Pekerjaan">Pekerjaan</option>
              <option value="Proyek">Proyek</option>
            </select>
            <select className="pub-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="semua">Semua Status</option>
              <option value="assigned">Ditugaskan</option>
              <option value="in_progress">Sedang Berlangsung</option>
              <option value="review">Dalam Tinjauan</option>
              <option value="done">Selesai</option>
            </select>
            <select className="pub-select pub-select-unit" value={filterUnit} onChange={e=>setFilterUnit(e.target.value)}>
              <option value="semua">Semua Unit Kerja</option>
              {unitPemintaList.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
            <select className="pub-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="terbaru">Target Terbaru</option>
              <option value="terlama">Target Terlama</option>
              <option value="nama">Nama A–Z</option>
            </select>
          </div>

          {/* STAT CARDS */}
          <div className="pub-stats-grid">
            {[
              { label:"Total Layanan", val:total, cls:"c-navy" },
              { label:"Total Pekerjaan", val:totalPk, cls:"c-blue" },
              { label:"Total Proyek", val:totalPr, cls:"c-purple" },
              { label:"Sedang Berlangsung", val:berjalan, cls:"c-orange" },
              { label:"Dalam Tinjauan", val:tinjauan, cls:"c-amber" },
              { label:"Selesai", val:selesai, cls:"c-green" },
            ].map(s=>(
              <div key={s.label} className={`pub-stat-card ${s.cls}`}>
                <div className="pub-stat-label">{s.label}</div>
                <div className="pub-stat-val">{s.val}</div>
              </div>
            ))}
          </div>

          {/* CHART ROW 1: Traffic + Donut */}
          <div className="pub-chart-grid-2">
            <div className="pub-chart-card">
              <div className="pub-chart-title">Traffic Layanan per Bulan</div>
              <div className="pub-chart-sub">Berdasarkan target selesai</div>
              <div className="pub-bar-col-wrap">
                {trafficPerBulan.map((v,i)=>(
                  <div key={i} className="pub-bar-col">
                    {v>0 && <span className="pub-bar-val">{v}</span>}
                    <div className={`pub-bar-fill${v===0?" empty":""}`} style={{ height:`${Math.max((v/maxTraffic)*100,v>0?8:4)}%` }} />
                    <span className="pub-bar-lbl">{BULAN[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pub-chart-card">
              <div className="pub-chart-title">Komposisi Status</div>
              <div className="pub-chart-sub">Distribusi semua layanan</div>
              {total > 0 ? (
                <div className="pub-donut-wrap">
                  <svg viewBox="0 0 96 96" width={96} height={96} style={{ flexShrink:0 }}>
                    {donutPaths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.92}/>)}
                    <circle cx="48" cy="48" r="18" fill="white"/>
                    <text x="48" y="49" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#0B1E4B">{total}</text>
                  </svg>
                  <div className="pub-donut-legend">
                    {statusData.map(s=>(
                      <div key={s.label} className="pub-donut-item">
                        <span className="pub-donut-dot" style={{ background:s.color }}/>
                        <span className="pub-donut-txt">{s.label}</span>
                        <span className="pub-donut-num">{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize:12, color:"#8A95A3", margin:0 }}>Belum ada data.</p>
              )}
            </div>
          </div>

          {/* CHART ROW 2: Top Unit + Top Divisi */}
          <div className="pub-chart-grid-2b">
            <div className="pub-chart-card">
              <div className="pub-chart-title">Top Unit Kerja Peminta</div>
              <div className="pub-chart-sub">Unit yang paling banyak mengajukan layanan</div>
              {topUnit.length > 0 ? topUnit.map(([label,val],i)=>(
                <div key={label} className="pub-hbar-row">
                  <span className="pub-hbar-lbl" title={label}>{label}</span>
                  <div className="pub-hbar-track">
                    <div className="pub-hbar-fill" style={{ width:`${(val/maxUnit)*100}%`, background:"#2563EB", opacity:1-i*0.08 }}/>
                  </div>
                  <span className="pub-hbar-num">{val}</span>
                </div>
              )) : <p style={{ fontSize:12, color:"#8A95A3", margin:0 }}>Belum ada data.</p>}
            </div>
            <div className="pub-chart-card">
              <div className="pub-chart-title">Top Divisi Pelaksana</div>
              <div className="pub-chart-sub">Divisi yang paling banyak menangani layanan</div>
              {topDivisi.length > 0 ? topDivisi.map(([label,val],i)=>(
                <div key={label} className="pub-hbar-row">
                  <span className="pub-hbar-lbl" title={label}>{label}</span>
                  <div className="pub-hbar-track">
                    <div className="pub-hbar-fill" style={{ width:`${(val/maxDivisi)*100}%`, background:"#7C3AED", opacity:1-i*0.08 }}/>
                  </div>
                  <span className="pub-hbar-num">{val}</span>
                </div>
              )) : <p style={{ fontSize:12, color:"#8A95A3", margin:0 }}>Belum ada data.</p>}
            </div>
          </div>

          {/* TABLE */}
          <div className="pub-table-card">
            <div className="pub-table-head">
              <span className="pub-table-head-title">Daftar Layanan</span>
              <span className="pub-table-head-count">{filtered.length} layanan</span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table className="pub-table">
                <thead>
                  <tr>
                    <th>Nama Layanan</th>
                    <th>Tipe</th>
                    <th>Unit Peminta</th>
                    <th>Divisi</th>
                    <th>Status</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map(item=>(
                    <tr key={item.id}>
                      <td>
                        <div className="pub-td-nama">{item.nama}</div>
                      </td>
                      <td>
                        <span className={`pub-badge-tipe ${item.tipe==="Proyek"?"proyek":"pekerjaan"}`}>
                          {item.tipe}
                        </span>
                      </td>
                      <td style={{ color:"#475569", fontSize:12 }}>{item.unitPeminta}</td>
                      <td style={{ color:"#475569", fontSize:12 }}>{item.divisi.join(", ")||"—"}</td>
                      <td>
                        <span className="pub-badge-status" style={{ background:STATUS_BG[item.status]||"#F3F5F9", color:STATUS_COLOR[item.status]||"#475569" }}>
                          {STATUS_LABEL[item.status]||item.status}
                        </span>
                      </td>
                      <td style={{ color:"#475569", fontSize:12, whiteSpace:"nowrap" }}>{item.targetSelesai}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="pub-empty">Belum ada data layanan yang sesuai filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <footer className="pub-footer">
          <div className="pub-footer-left">
            <img src="/logo-upa.png" alt="UPA TIK" className="pub-footer-logo" />
            <span className="pub-footer-text">UPA Teknologi Informasi dan Komunikasi — Universitas Lampung</span>
          </div>
          <span className="pub-footer-right">© 2025 SIMPROTIK. All rights reserved.</span>
        </footer>
      </div>
    </>
  );
}
