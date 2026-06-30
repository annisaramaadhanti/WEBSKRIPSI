"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPekerjaanList, getProyekList, getMasterUnitKerja } from "@/lib/api";
import { mapPekerjaan, mapProyek, extractList } from "@/lib/api-mapper";
import type { Pekerjaan, Proyek } from "@/types";

const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const STATUS_LABEL: Record<string,string> = {
  assigned:"Ditugaskan", in_progress:"Sedang Berlangsung",
  review:"Dalam Tinjauan", done:"Selesai",
};
const STATUS_BG: Record<string,string> = {
  assigned:"#0891B2", in_progress:"#2563EB", review:"#E11D48", done:"#16A34A",
};
const STAT_BORDER: Record<string,string> = {
  "c-navy":   "border-t-[3px] border-t-[#0B1E4B]",
  "c-blue":   "border-t-[3px] border-t-[#2563EB]",
  "c-purple": "border-t-[3px] border-t-[#0891B2]",
  "c-orange": "border-t-[3px] border-t-[#E11D48]",
  "c-amber":  "border-t-[3px] border-t-[#D97706]",
  "c-green":  "border-t-[3px] border-t-[#16A34A]",
};
const SELECT_CLS = "cursor-pointer outline-none flex-1 appearance-none px-[12px] pr-[32px] py-[8px] border-[1.5px] border-[#E8ECF4] rounded-lg text-[12px] font-semibold text-[#0B1E4B] min-w-[100px] transition-[border-color,box-shadow] focus:border-[#0B1E4B] focus:shadow-[0_0_0_3px_rgba(11,30,75,0.10)] hover:border-[#B0BCCE]";
const SELECT_STYLE = { background: `#F8FAFC url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238A95A3' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E") no-repeat right 10px center` };
const CHART_CARD = "bg-white border border-[rgba(148,163,184,0.25)] rounded-[16px] px-[22px] py-[20px] shadow-[0_3px_14px_rgba(15,23,42,0.09)]";

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
  const [unitKerjaList, setUnitKerjaList] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingData(true);

    Promise.all([
      getPekerjaanList({}),
      getProyekList({}),
      getMasterUnitKerja(),
    ])
      .then(([pkRes, prRes, unitRes]: any[]) => {
        if (!active) return;
        setPk(extractList(pkRes).map(mapPekerjaan));
        setPr(extractList(prRes).map(mapProyek));
        setUnitKerjaList(extractList(unitRes).map((u: any) => u.nama_unit));
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const tahunList = Array.from(new Set(
    [...pk,...pr].map(x => new Date(x.targetSelesai).getFullYear()).filter(y => !isNaN(y))
  )).sort((a,b) => b-a);

  const STATUS_KINERJA = ["assigned", "in_progress", "review", "done"];

  const all: AnyItem[] = [
    ...pk.map(x => ({ id:x.id, nama:x.namaPekerjaan, tipe:"Pekerjaan" as const, unitPeminta:x.unitPeminta||"—", divisi:x.divisi, status:x.status, targetSelesai:x.targetSelesai })),
    ...pr.map(x => ({ id:x.id, nama:x.namaProyek, tipe:"Proyek" as const, unitPeminta:x.unitPeminta||"—", divisi:x.divisi, status:x.status, targetSelesai:x.targetSelesai })),
  ].filter(x => STATUS_KINERJA.includes(x.status));

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
    { label:"Ditugaskan", val:filtered.filter(x=>x.status==="assigned").length, color:"#0891B2" },
    { label:"Sedang Berlangsung", val:berjalan, color:"#2563EB" },
    { label:"Dalam Tinjauan", val:tinjauan, color:"#D97706" },
    { label:"Selesai", val:selesai, color:"#16A34A" },
  ];

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
    <div className="min-h-screen bg-white text-[#0B1E4B]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between z-[100] h-[58px] px-[16px] md:px-[48px] bg-[rgba(255,255,255,0.97)] [backdrop-filter:blur(16px)] border-b border-[#E8ECF4] shadow-[0_1px_8px_rgba(11,30,75,0.06)]">
        <div className="flex items-center gap-[11px]">
          <img src="/logo-upa.png" alt="UPA TIK Unila" className="object-contain h-[34px] w-auto" />
          <div className="w-px h-[22px] bg-[#DDE3EF]" />
          <span className="font-bold text-[15px] text-[#0B1E4B] tracking-[-0.3px]">SIMPROTIK</span>
          <span className="font-semibold text-[10px] text-[#8A95A3] bg-[#F3F5F9] border border-[#DDE3EF] rounded-full px-[10px] py-[2px] ml-[2px]">Dashboard Publik</span>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center no-underline font-semibold gap-[6px] px-[20px] py-[8px] rounded-lg bg-[#0B1E4B] text-white text-[13px] border-none transition-all shadow-[0_2px_8px_rgba(11,30,75,0.22)] hover:bg-[#0F2150] hover:-translate-y-px [&_svg]:transition-transform hover:[&_svg]:translate-x-[3px]"
        >
          Masuk ke Sistem
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </nav>

      {/* HERO */}
      <div
        className="relative overflow-hidden mt-[58px] px-[16px] md:px-[48px] pt-[32px] md:pt-[42px] pb-[32px] md:pb-[36px] text-white before:content-[''] before:absolute before:pointer-events-none before:top-[-60px] before:right-[-60px] before:w-[280px] before:h-[280px] before:rounded-full before:border-[44px] before:border-[rgba(198,168,75,0.10)] after:content-[''] after:absolute after:pointer-events-none after:bottom-[-40px] after:left-[30%] after:w-[180px] after:h-[180px] after:rounded-full after:border-[28px] after:border-[rgba(255,255,255,0.04)]"
        style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0B1E4B 60%, #0F2150 100%)" }}
      >
        <div className="relative z-[1]">
          <div className="inline-flex items-center font-bold uppercase gap-[7px] text-[10px] tracking-[2px] text-[#C6A84B] bg-[rgba(198,168,75,0.12)] border border-[rgba(198,168,75,0.25)] rounded-full px-[14px] py-[4px] mb-[14px]">
            <span className="rounded-full shrink-0 w-[5px] h-[5px] bg-[#C6A84B] shadow-[0_0_0_3px_rgba(198,168,75,0.25)]" />
            UPA Teknologi Informasi dan Komunikasi
          </div>
          <h1 className="font-bold m-0 tracking-[-0.6px] mb-[6px] leading-[1.15]" style={{ fontSize: "clamp(22px,3vw,30px)" }}>
            Statistik Layanan — Universitas Lampung
          </h1>
          <p className="m-0 text-[13px] text-[rgba(255,255,255,0.55)]">Data pekerjaan dan proyek yang tercatat di sistem SIMPROTIK</p>
        </div>
      </div>

      <div className="px-[16px] md:px-[48px] pt-[28px] pb-[48px]">

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center bg-white border border-[rgba(148,163,184,0.25)] rounded-[16px] px-[20px] py-[16px] mb-[22px] gap-[10px] shadow-[0_3px_14px_rgba(15,23,42,0.09)]">
          <span className="font-bold uppercase text-[11px] text-[#8A95A3] tracking-[0.5px] mr-[4px]">Filter</span>
          <select className={SELECT_CLS} style={SELECT_STYLE} value={filterTahun} onChange={e=>setFilterTahun(e.target.value)}>
            <option value="semua">Semua Tahun</option>
            {tahunList.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <select className={SELECT_CLS} style={SELECT_STYLE} value={filterBulan} onChange={e=>setFilterBulan(e.target.value)}>
            <option value="semua">Semua Bulan</option>
            {BULAN.map((b,i)=><option key={i} value={i}>{b}</option>)}
          </select>
          <select className={SELECT_CLS} style={SELECT_STYLE} value={filterTipe} onChange={e=>setFilterTipe(e.target.value)}>
            <option value="semua">Semua Tipe</option>
            <option value="Pekerjaan">Pekerjaan</option>
            <option value="Proyek">Proyek</option>
          </select>
          <select className={SELECT_CLS} style={SELECT_STYLE} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="semua">Semua Status</option>
            <option value="assigned">Ditugaskan</option>
            <option value="in_progress">Sedang Berlangsung</option>
            <option value="review">Dalam Tinjauan</option>
            <option value="done">Selesai</option>
          </select>
          <select className={`${SELECT_CLS} flex-[2] min-w-[160px]`} style={SELECT_STYLE} value={filterUnit} onChange={e=>setFilterUnit(e.target.value)}>
            <option value="semua">Semua Unit Kerja</option>
            {unitKerjaList.map(u=><option key={u} value={u}>{u}</option>)}
          </select>
          <select className={SELECT_CLS} style={SELECT_STYLE} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="terbaru">Target Terbaru</option>
            <option value="terlama">Target Terlama</option>
            <option value="nama">Nama A–Z</option>
          </select>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[16px] mb-[22px]">
          {[
            { label:"Total Layanan", val:loadingData ? "..." : total, cls:"c-navy" },
            { label:"Total Pekerjaan", val:loadingData ? "..." : totalPk, cls:"c-blue" },
            { label:"Total Proyek", val:loadingData ? "..." : totalPr, cls:"c-purple" },
            { label:"Sedang Berlangsung", val:loadingData ? "..." : berjalan, cls:"c-orange" },
            { label:"Dalam Tinjauan", val:loadingData ? "..." : tinjauan, cls:"c-amber" },
            { label:"Selesai", val:loadingData ? "..." : selesai, cls:"c-green" },
          ].map(s=>(
            <div key={s.label} className={`relative overflow-hidden rounded-[14px] px-[20px] pt-[18px] pb-[16px] bg-white border border-[#D4E3FF] shadow-[0_2px_12px_rgba(11,30,75,0.07)] transition-[transform,box-shadow] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(11,30,75,0.12)] ${STAT_BORDER[s.cls]}`}>
              <div className="font-bold uppercase text-[10px] tracking-[0.6px] text-[#7A90B0] mb-[8px]">{s.label}</div>
              <div className="font-extrabold text-[28px] tracking-[-1px] leading-none text-[#0B1E4B]">{s.val}</div>
            </div>
          ))}
        </div>

        {/* CHART ROW 1: Traffic + Donut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[20px]">
          <div className={CHART_CARD}>
            <div className="font-bold text-[14px] text-[#0B1E4B] mb-[3px]">Traffic Layanan per Bulan</div>
            <div className="text-[12px] text-[#94A3B8] pb-[12px] border-b-[1.5px] border-[#EEF2FA] mb-[16px]">Berdasarkan target selesai</div>
            <div className="flex items-end gap-[5px] h-[130px]">
              {trafficPerBulan.map((v,i)=>(
                <div key={i} className="flex flex-col items-center gap-[3px] flex-1">
                  {v>0 && <span className="font-bold text-[9px] text-[#0B1E4B] leading-none">{v}</span>}
                  <div
                    className={`w-full rounded-[4px_4px_2px_2px] transition-[height_0.4s] ${v===0?"bg-[#F1F5F9]":"bg-[#0B1E4B]"}`}
                    style={{ height:`${Math.max((v/maxTraffic)*100,v>0?8:4)}%` }}
                  />
                  <span className="whitespace-nowrap text-[8px] text-[#94A3B8]">{BULAN[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={CHART_CARD}>
            <div className="font-bold text-[14px] text-[#0B1E4B] mb-[3px]">Komposisi Status</div>
            <div className="text-[12px] text-[#94A3B8] pb-[12px] border-b-[1.5px] border-[#EEF2FA] mb-[16px]">Distribusi semua layanan</div>
            {total > 0 ? (
              <div className="flex items-center gap-[20px]">
                <svg viewBox="0 0 96 96" width={96} height={96} style={{ flexShrink:0 }}>
                  {donutPaths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.92}/>)}
                  <circle cx="48" cy="48" r="18" fill="white"/>
                  <text x="48" y="49" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#0B1E4B">{total}</text>
                </svg>
                <div className="flex flex-col flex-1">
                  {statusData.map(s=>(
                    <div key={s.label} className="flex items-center gap-[8px] text-[12px] py-[7px] border-b border-[#F1F5F9] last:border-b-0">
                      <span className="rounded-full shrink-0 w-[8px] h-[8px]" style={{ background:s.color }}/>
                      <span className="flex-1 text-[#64748B]">{s.label}</span>
                      <span className="font-bold text-right text-[#0B1E4B] min-w-[24px]">{s.val}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[22px]">
          <div className={CHART_CARD}>
            <div className="font-bold text-[14px] text-[#0B1E4B] mb-[3px]">Top Unit Kerja Peminta</div>
            <div className="text-[12px] text-[#94A3B8] pb-[12px] border-b-[1.5px] border-[#EEF2FA] mb-[16px]">Unit yang paling banyak mengajukan layanan</div>
            {loadingData ? <p style={{ fontSize:12, color:"#8A95A3", margin:0 }}>Mengambil data terbaru...</p> : topUnit.length > 0 ? topUnit.map(([label,val],i)=>(
              <div key={label} className="flex items-center gap-[10px] mb-[10px]">
                <span className="overflow-hidden whitespace-nowrap shrink-0 text-[11px] text-[#475569] w-[170px]" style={{ textOverflow:"ellipsis" }} title={label}>{label}</span>
                <div className="flex-1 overflow-hidden h-[8px] bg-[#F1F5F9] rounded-full">
                  <div className="h-full rounded-full transition-[width_0.5s]" style={{ width:`${(val/maxUnit)*100}%`, background:"#0B1E4B", opacity:1-i*0.08 }}/>
                </div>
                <span className="font-bold text-right text-[11px] text-[#0B1E4B] min-w-[18px]">{val}</span>
              </div>
            )) : <p style={{ fontSize:12, color:"#8A95A3", margin:0 }}>Belum ada data.</p>}
          </div>
          <div className={CHART_CARD}>
            <div className="font-bold text-[14px] text-[#0B1E4B] mb-[3px]">Top Divisi Pelaksana</div>
            <div className="text-[12px] text-[#94A3B8] pb-[12px] border-b-[1.5px] border-[#EEF2FA] mb-[16px]">Divisi yang paling banyak menangani layanan</div>
            {loadingData ? <p style={{ fontSize:12, color:"#8A95A3", margin:0 }}>Mengambil data terbaru...</p> : topDivisi.length > 0 ? topDivisi.map(([label,val],i)=>(
              <div key={label} className="flex items-center gap-[10px] mb-[10px]">
                <span className="overflow-hidden whitespace-nowrap shrink-0 text-[11px] text-[#475569] w-[170px]" style={{ textOverflow:"ellipsis" }} title={label}>{label}</span>
                <div className="flex-1 overflow-hidden h-[8px] bg-[#F1F5F9] rounded-full">
                  <div className="h-full rounded-full transition-[width_0.5s]" style={{ width:`${(val/maxDivisi)*100}%`, background:"#0B1E4B", opacity:1-i*0.08 }}/>
                </div>
                <span className="font-bold text-right text-[11px] text-[#0B1E4B] min-w-[18px]">{val}</span>
              </div>
            )) : <p style={{ fontSize:12, color:"#8A95A3", margin:0 }}>Belum ada data.</p>}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden bg-white border border-[rgba(148,163,184,0.25)] rounded-[16px] shadow-[0_3px_14px_rgba(15,23,42,0.09)]">
          <div className="flex items-baseline px-[22px] py-[16px] border-b-[1.5px] border-[#EEF2FA] gap-[10px]">
            <span className="font-bold text-[14px] text-[#0B1E4B]">Daftar Layanan</span>
            <span className="text-[12px] text-[#8A95A3]">{filtered.length} layanan</span>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table className="w-full border-collapse text-[12px] [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:font-bold [&_th]:px-[16px] [&_th]:py-[10px] [&_th]:text-[10px] [&_th]:tracking-[0.5px] [&_th]:text-[#8A95A3] [&_th]:bg-[#F8FAFC] [&_th]:border-b [&_th]:border-[#F1F5F9] [&_td]:align-middle [&_td]:px-[16px] [&_td]:py-[13px] [&_td]:border-b [&_td]:border-[rgba(241,245,249,0.8)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(37,99,235,0.02)]">
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
                {loadingData ? (
                  <tr><td colSpan={6} className="text-center px-[32px] py-[32px] text-[#8A95A3] text-[13px]">Mengambil data terbaru...</td></tr>
                ) : filtered.length > 0 ? filtered.map(item=>(
                  <tr key={item.id}>
                    <td>
                      <div className="font-semibold text-[#0B1E4B]">{item.nama}</div>
                    </td>
                    <td>
                      <span className={`inline-flex font-semibold px-[10px] py-[3px] rounded-full text-[11px] text-white ${item.tipe==="Proyek"?"bg-[#2563EB]":"bg-[#0891B2]"}`}>
                        {item.tipe}
                      </span>
                    </td>
                    <td style={{ color:"#475569", fontSize:12 }}>{item.unitPeminta}</td>
                    <td style={{ color:"#475569", fontSize:12 }}>{item.divisi.join(", ")||"—"}</td>
                    <td>
                      <span className="inline-flex font-semibold px-[10px] py-[3px] rounded-full text-[11px] text-white" style={{ background:STATUS_BG[item.status]||"#64748B" }}>
                        {STATUS_LABEL[item.status]||item.status}
                      </span>
                    </td>
                    <td style={{ color:"#475569", fontSize:12, whiteSpace:"nowrap" }}>{item.targetSelesai}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center px-[32px] py-[32px] text-[#8A95A3] text-[13px]">Belum ada data layanan yang sesuai filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="flex items-center justify-between flex-wrap border-t border-[#E8ECF4] px-[36px] py-[18px] gap-[10px] bg-white">
        <div className="flex items-center gap-[10px]">
          <img src="/logo-upa.png" alt="UPA TIK" className="object-contain h-[24px] w-auto" />
          <span className="text-[12px] text-[#8A95A3]">UPA Teknologi Informasi dan Komunikasi — Universitas Lampung</span>
        </div>
        <span className="text-[11px] text-[#B0BCCE]">© 2025 SIMPROTIK. All rights reserved.</span>
      </footer>

    </div>
  );
}
