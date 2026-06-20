"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import { getTinjauanList, getTinjauanDetail, accTinjauan, urlLaporanPdf, urlDokumen } from "@/lib/api";
import { extractList } from "@/lib/api-mapper";
import { PERTANYAAN_SURVEY } from "@/lib/data";
import type { StatusPekerjaan, Dokumentasi, HasilSurvey } from "@/types";

type TinjauanItem = {
  id: string;
  jenis: "PEKERJAAN" | "PROYEK";
  judul: string;
  unitPeminta: string;
  divisi: string[];
  staf: string | null;
  status: StatusPekerjaan;
  catatan: string | null;
  catatanKadiv?: string | null;
  targetSelesai: string;
  accBy?: { stafId: string; nama: string; nip: string; jabatan: string } | null;
  accAt?: string | null;
};

function ImgWithFallback({ src, alt, filePath, onOpenFile }: { src: string; alt: string; filePath: string; onOpenFile: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    fetch(src, { headers: { Accept: "image/*", "ngrok-skip-browser-warning": "true" } })
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
      .catch(() => setFailed(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);

  if (failed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="text-[12px] text-[var(--text-muted)]">{filePath}</span>
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenFile(); }} className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]">Buka File</a>
      </div>
    );
  }
  if (!blobUrl) {
    return <div className="text-[12px] text-[var(--text-muted)]">Memuat gambar...</div>;
  }
  return (
    <img
      src={blobUrl}
      alt={alt}
      style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-soft)', display: 'block' }}
    />
  );
}


const STATUS_LABEL: Record<string, string> = {
  "pending":     "Menunggu Konfirmasi",
  "accepted":    "Diterima",
  "rejected":    "Ditolak",
  "assigned":    "Ditugaskan",
  "in_progress": "Sedang Berlangsung",
  "review":      "Dalam Tinjauan",
  "done":        "Selesai",
};

const TINJAUAN_STATUSES: StatusPekerjaan[] = ["review", "done"];

export default function TinjauanKinerjaPage() {
  const { role, user } = useRole();
  const [items, setItems] = useState<TinjauanItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterJenis, setFilterJenis] = useState<string>("semua");

  const [showACC, setShowACC] = useState<TinjauanItem | null>(null);
  const [catatanACC, setCatatanACC] = useState("");
  const [showDoc, setShowDoc] = useState<TinjauanItem | null>(null);
  const [docDokList, setDocDokList] = useState<Dokumentasi[]>([]);
  const [showSurvei, setShowSurvei] = useState<TinjauanItem | null>(null);
  const [surveiList, setSurveiList] = useState<HasilSurvey[]>([]);
  const [showRingkasan, setShowRingkasan] = useState<TinjauanItem | null>(null);

  const load = () => {
    getTinjauanList()
      .then((res: any) => {
        const list = extractList(res);
        setItems(list.map((t: any): TinjauanItem => {
          const stafList: any[] = t.pekerjaan?.staf ?? t.proyek?.staf ?? [];
          const divisi: string[] = [...new Set(stafList.map((s: any) => s.divisi?.nama_divisi).filter(Boolean))] as string[];
          const stafNama = stafList.map((s: any) => s.pengguna?.nama_lengkap ?? "").filter(Boolean).join(", ") || null;
          const status: string = t.hasil_tinjauan === "disetujui" ? "done" : "review";
          return {
            id: t.id_tinjauan ?? "",
            jenis: t.id_pekerjaan ? "PEKERJAAN" : "PROYEK",
            judul: t.pekerjaan?.nama_pekerjaan ?? t.proyek?.nama_proyek ?? "",
            unitPeminta: t.pekerjaan?.unit_kerja?.nama_unit ?? t.proyek?.unit_kerja?.nama_unit ?? "—",
            divisi,
            status: status as TinjauanItem["status"],
            catatan: t.catatan ?? null,
            catatanKadiv: null,
            targetSelesai: t.pekerjaan?.target_selesai ?? t.proyek?.target_selesai ?? "",
            staf: stafNama,
            accBy: t.peninjau ? {
              stafId: t.peninjau.uuid ?? "",
              nama: t.peninjau.nama_lengkap ?? "",
              nip: t.peninjau.NIP ?? "",
              jabatan: t.peninjau.peran ?? "",
            } : null,
            accAt: t.ditinjau_at ?? null,
          };
        }));
      })
      .catch(console.error);
  };

  useEffect(() => { load(); }, []);

  if (role === "staf") {
    return (
      <div>
        <div className="flex flex-wrap justify-between items-end mb-7 gap-3.5"><h1 className="m-0 font-bold text-[clamp(24px,2.5vw,32px)] tracking-[-0.6px]">Tinjauan Kinerja</h1></div>
        <div className="bg-[var(--surface)] border border-[var(--border-soft)] rounded-[var(--r-xl)] p-[22px] shadow-[var(--shadow-sm)] text-center p-10 text-[var(--text-soft)]">
          <p>Halaman ini hanya dapat diakses oleh Kepala Divisi, Operator, dan Kepala UPA.</p>
        </div>
      </div>
    );
  }

  const filtered = items.filter((x) => {
    if (!TINJAUAN_STATUSES.includes(x.status)) return false;
    if (role === "kepala-divisi" && !x.divisi.includes(user?.divisi || "")) return false;
    if (filterStatus !== "semua" && x.status !== filterStatus) return false;
    if (filterJenis !== "semua" && x.jenis !== filterJenis) return false;
    return true;
  });

  const handleACC = async () => {
    if (!showACC || !user?.id) return;
    try {
      await accTinjauan(showACC.id, {
        id_ditinjau_oleh: user.id,
        catatan: catatanACC || "",
      });
      setShowACC(null); setCatatanACC(""); load();
    } catch (e: any) {
      alert("Gagal ACC: " + e.message);
    }
  };

  const openDoc = (item: TinjauanItem) => {
    getTinjauanDetail(item.id)
      .then((res: any) => {
        const rawData = res.data ?? res;
        const dok = rawData.dokumen;
        const docs: Dokumentasi[] = dok ? [{
          id: dok.id_dokumen ?? "",
          refId: item.id,
          jenis: item.jenis,
          judul: dok.nama_dokumen ?? dok.file_path ?? "",
          filePath: dok.file_path ?? "",
          tanggal: rawData.created_at?.split("T")[0] ?? "",
          uploadedBy: "",
          fileData: undefined,
        }] : [];
        setDocDokList(docs);
        setShowDoc(item);
      })
      .catch(console.error);
  };

  const openSurvei = (item: TinjauanItem) => {
    getTinjauanDetail(item.id)
      .then((res: any) => {
        const rawData = res.data ?? res;
        const sv = rawData.jawaban_survei;
        if (!sv) { setSurveiList([]); setShowSurvei(item); return; }
        const jawaban = PERTANYAAN_SURVEY.map((q, i) => {
          const n = i + 1;
          return q.tipeJawaban === "pilihan"
            ? { pertanyaanId: q.id, nilaiPilihan: sv[`jawaban${n}`] ?? undefined }
            : { pertanyaanId: q.id, teksJawaban: sv[`jawaban${n}`] ?? "" };
        });
        setSurveiList([{
          id: sv.id_jawaban ?? "",
          refId: item.id,
          jenis: item.jenis,
          tanggalSurvey: sv.created_at?.split("T")[0] ?? "",
          surveyor: "",
          namaKlien: sv.nama_klien ?? "",
          nipKlien: sv.nip_klien ?? "",
          jawaban,
        }]);
        setShowSurvei(item);
      })
      .catch(console.error);
  };

  const openLaporan = (item: TinjauanItem) => {
    if (item.status !== "done") return;
    window.open(urlLaporanPdf(item.id), "_blank");
  };

  const openPDF = (d: Dokumentasi) => {
    if ((d as any).id) {
      window.open(urlDokumen((d as any).id), "_blank");
    } else if (d.fileData) {
      const byteChars = atob(d.fileData);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob), "_blank");
    } else { alert(`File: ${d.filePath}`); }
  };

  const fmt = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const countByStatus = (s: string) => items.filter(x => {
    if (!TINJAUAN_STATUSES.includes(x.status as StatusPekerjaan)) return false;
    if (x.status !== s) return false;
    if (role === "kepala-divisi") return x.divisi.includes(user?.divisi || "");
    return true;
  }).length;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Tinjauan Kinerja</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.7, fontSize: 13 }}>
            {role === "kepala-divisi" ? "Tinjau hasil pekerjaan dan berikan ACC untuk menyelesaikan."
              : role === "operator" ? "Pantau status tinjauan dan laporan pekerjaan serta proyek."
              : "Monitoring status tinjauan kinerja di semua divisi."}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {[
          { s: "review", label: "Menunggu ACC", color: "#D97706" },
          { s: "done",   label: "Disetujui",    color: "#16a34a" },
        ].map(({ s, label, color }) => (
          <div
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "semua" : s)}
            style={{
              background: "#fff",
              borderRadius: 14,
              border: filterStatus === s ? `1px solid ${color}` : "1px solid #D4E3FF",
              borderTop: `3px solid ${color}`,
              padding: "16px 20px 14px",
              boxShadow: "0 2px 12px rgba(11,30,75,0.07)",
              cursor: "pointer",
              transition: "box-shadow 0.15s",
              outline: filterStatus === s ? `2px solid ${color}40` : "none",
            }}
          >
            <div style={{ fontSize: 10, color: "#7A90B0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0B1E4B", lineHeight: 1.1 }}>{countByStatus(s)}</div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border-soft)] rounded-[var(--r-xl)] p-[22px] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap mb-[14px] gap-2">
          <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="px-3 py-[7px] rounded border border-[var(--border)] text-[12px] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--navy-600)] focus:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
            <option value="semua">Semua Jenis</option>
            <option value="PEKERJAAN">Pekerjaan</option>
            <option value="PROYEK">Proyek</option>
          </select>
        </div>
        <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
          <table className="w-full border-collapse min-w-[1100px] [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
            <thead>
              <tr>
                <th className="text-left min-w-[240px]">Nama</th>
                <th className="text-center w-[80px]">Tipe</th>
                <th className="text-left w-[160px]">Unit Peminta</th>
                <th className="text-left min-w-[200px]">Divisi</th>
                <th className="text-left w-[140px]">Staf</th>
                <th className="text-center w-[90px]">Dokumentasi</th>
                <th className="text-center w-[80px]">Survei</th>
                <th className="text-center w-[120px]">Status Tinjauan</th>
                <th className="text-center w-[80px]">Laporan</th>
                <th className="text-center w-[140px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((item) => (
                <tr key={`${item.jenis}-${item.id}`}>
                  <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.judul}</strong></div></td>
                  <td className="text-center">
                    <span className={item.jenis === "PROYEK" ? "inline-flex items-center font-semibold whitespace-nowrap px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] bg-[#2563EB] text-white" : "inline-flex items-center font-semibold whitespace-nowrap px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] bg-[#0891B2] text-white"}>
                      {item.jenis === "PROYEK" ? "Proyek" : "Pekerjaan"}
                    </span>
                  </td>
                  <td className="text-[12px]">{item.unitPeminta}</td>
                  <td className="!whitespace-normal text-[12px] max-w-[240px]"><div className="line-clamp-2">{item.divisi.join(", ") || "—"}</div></td>
                  <td className="text-[12px]">{item.staf || <span className="text-[var(--text-muted)] text-[12px]">—</span>}</td>

                  {/* Dokumentasi */}
                  <td className="text-center">
                    <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => openDoc(item)}>
                      Lihat File
                    </button>
                  </td>

                  {/* Survei */}
                  <td className="text-center">
                    <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => openSurvei(item)}>
                      Lihat Survei
                    </button>
                  </td>

                  {/* Status Tinjauan */}
                  <td className="text-center">
                    {item.status === "review"
                      ? <span className="inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] before:content-[''] before:shrink-0 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[rgba(255,255,255,0.85)] bg-[#D97706] text-white">Menunggu</span>
                      : <span className="inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] before:content-[''] before:shrink-0 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[rgba(255,255,255,0.85)] bg-[#16A34A] text-white">Disetujui</span>
                    }
                  </td>

                  {/* Laporan - hanya saat sudah ACC (done) */}
                  <td className="text-center">
                    {item.status === "done"
                      ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openLaporan(item)}>PDF Laporan</button>
                      : <span className="text-[var(--text-muted)] text-[12px]">Belum Tersedia</span>
                    }
                  </td>

                  {/* Aksi per role dan status */}
                  <td className="text-center">
                    <div className="flex items-center flex-wrap justify-center gap-[6px]">
                      <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>
                        Ringkasan
                      </button>
                      {/* ACC: hanya Kadiv, hanya saat Menunggu */}
                      {role === "kepala-divisi" && item.status === "review" && (
                        <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#16A34A] text-white text-[11px] shadow-[0_2px_8px_rgba(22,163,74,0.28)] transition-all hover:bg-[#15803D] hover:-translate-y-px" onClick={() => { setCatatanACC(""); setShowACC(item); }}>
                          ACC
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={10} className="text-center text-[var(--text-muted)]">Tidak ada item yang sesuai filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL ACC ─── */}
      {showACC && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2 className="text-[#16A34A]"> Konfirmasi ACC</h2>
            <p className="text-[var(--text-muted)] text-[12px] mt-3">Anda akan memberikan ACC untuk:</p>
            <p className="font-semibold mt-2">{showACC.judul}</p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1 mb-4">
              Status akan berubah menjadi <strong>Selesai</strong> dan laporan PDF akan tersedia.
            </p>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Catatan Kadiv <span className="text-[var(--text-muted)] text-[12px]">(opsional)</span></label>
              <textarea
                value={catatanACC}
                onChange={(e) => setCatatanACC(e.target.value)}
                placeholder="Catatan atau komentar untuk laporan..."
                rows={3}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] bg-[#16A34A] text-white text-[12px] shadow-[0_2px_8px_rgba(22,163,74,0.28)] transition-all hover:bg-[#15803D] hover:-translate-y-px" onClick={handleACC}>Ya, ACC</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowACC(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL RINGKASAN ─── */}
      {showRingkasan && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>Ringkasan Tinjauan</h2>
            <div className="bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
              <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Data {showRingkasan.jenis === "PROYEK" ? "Proyek" : "Pekerjaan"}</div>
              <table><tbody>
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Nama</td><td>: <strong>{showRingkasan.judul}</strong></td></tr>
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Tipe</td><td>: {showRingkasan.jenis === "PROYEK" ? "Proyek" : "Pekerjaan"}</td></tr>
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Unit Peminta</td><td>: {showRingkasan.unitPeminta}</td></tr>
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Divisi</td><td>: {showRingkasan.divisi.join(", ") || "—"}</td></tr>
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Staf</td><td>: {showRingkasan.staf || "—"}</td></tr>
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Target Selesai</td><td>: {showRingkasan.targetSelesai}</td></tr>
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Status Tinjauan</td><td>: {showRingkasan.status === "review" ? <span className="inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] before:content-[''] before:shrink-0 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[rgba(255,255,255,0.85)] bg-[#D97706] text-white">Menunggu</span> : <span className="inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] before:content-[''] before:shrink-0 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[rgba(255,255,255,0.85)] bg-[#16A34A] text-white">Disetujui</span>}</td></tr>
              </tbody></table>
            </div>

            {/* Data tinjauan Kadiv jika sudah Selesai */}
            {showRingkasan.status === "done" && showRingkasan.accBy && (
              <div className="mt-4 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
                <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Hasil Tinjauan Kadiv</div>
                <table><tbody>
                  <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Disetujui Oleh</td><td>: {showRingkasan.accBy.nama}</td></tr>
                  <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Jabatan</td><td>: {showRingkasan.accBy.jabatan}</td></tr>
                  <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Tanggal ACC</td><td>: {showRingkasan.accAt}</td></tr>
                  {showRingkasan.catatanKadiv && (
                    <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Catatan</td><td>: {showRingkasan.catatanKadiv}</td></tr>
                  )}
                </tbody></table>
              </div>
            )}

            {showRingkasan.catatan && (
              <div className="mt-4 bg-[#FEFBF0] border border-[#FAE8A0] rounded-[var(--r-lg)] p-4 [&_p]:m-0">
                <div className="font-bold text-[13px] mb-1">Catatan:</div>
                <div className="text-[12px]">{showRingkasan.catatan}</div>
              </div>
            )}

            {showRingkasan.status === "done" && (
              <div className="mt-4 bg-[var(--success-50)] border border-[#A8DFC0] rounded-[var(--r-lg)] p-4 [&_p]:m-0 [&_a]:font-bold">
                <div className="font-bold text-[13px] mb-1">Laporan Tersedia</div>
                <div className="text-[12px] mb-2">Pekerjaan/proyek telah selesai dan laporan bisa diexport.</div>
                <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openLaporan(showRingkasan)}>
                  PDF Laporan
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DOC (Dokumentasi Akhir) ─── */}
      {showDoc && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2> Dokumentasi Akhir</h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-1 mb-4">{showDoc.judul}</p>

            {docDokList.length > 0 ? (
              <div>
                {docDokList.map((d) => {
                  const ext = d.filePath?.split('.').pop()?.toLowerCase() || '';
                  const isImg = ['jpg','jpeg','png','gif','webp','bmp'].includes(ext);
                  const isPdf = ext === 'pdf';
                  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
                  return (
                    <div key={d.id} style={{ marginBottom: 16, padding: 14, background: 'var(--surface-alt)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{d.judul}</div>
                      <div className="text-[12px] text-[var(--text-muted)]" style={{ marginBottom: 10 }}>{d.uploadedBy} · {d.tanggal}</div>
                      {isImg ? (
                        d.fileData ? (
                          <img
                            src={`data:${mimeType};base64,${d.fileData}`}
                            alt={d.judul}
                            style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-soft)', display: 'block' }}
                          />
                        ) : d.id ? (
                          <ImgWithFallback
                            src={urlDokumen(d.id)}
                            alt={d.judul}
                            filePath={d.filePath}
                            onOpenFile={() => window.open(urlDokumen(d.id), '_blank')}
                          />
                        ) : null
                      ) : isPdf ? (
                        d.fileData ? (
                          <iframe
                            src={`data:application/pdf;base64,${d.fileData}`}
                            title={d.judul}
                            style={{ width: '100%', height: 420, borderRadius: 8, border: '1px solid var(--border-soft)', display: 'block' }}
                          />
                        ) : d.id ? (
                          <iframe
                            src={urlDokumen(d.id)}
                            title={d.judul}
                            style={{ width: '100%', height: 420, borderRadius: 8, border: '1px solid var(--border-soft)', display: 'block' }}
                          />
                        ) : null
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="text-[12px] text-[var(--text-muted)]">{d.filePath}{d.fileSize ? ` · ${fmt(d.fileSize)}` : ''}</span>
                          {(d.fileData || d.id) && <a href="#" onClick={(e) => { e.preventDefault(); openPDF(d); }} className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]">Buka File</a>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-[var(--text-muted)]">
                <div className="text-[28px] mb-2 opacity-35"></div>
                <p>Belum ada dokumentasi yang dikirim dari mobile.</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowDoc(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SURVEI KLIEN ─── */}
      {showSurvei && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>Hasil Survei Klien</h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-1 mb-4">{showSurvei.judul}</p>

            {surveiList.length > 0 ? (
              <div>
                {surveiList.map((sv) => {
                  const pilihanQ = sv.jawaban.filter(j => typeof j.nilaiPilihan === "number");
                  const avg = pilihanQ.length > 0 ? pilihanQ.reduce((s, j) => s + (j.nilaiPilihan ?? 0), 0) / pilihanQ.length : 0;
                  const saran = sv.jawaban.find(j => j.teksJawaban)?.teksJawaban;
                  return (
                    <div key={sv.id} style={{ marginBottom: 20, padding: 16, background: "var(--surface-alt)", borderRadius: 10, border: "1px solid var(--border-soft)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border-soft)" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{sv.namaKlien || sv.surveyor || "Klien"}</div>
                          {sv.nipKlien && <div className="text-[12px] text-[var(--text-muted)]">NIP: {sv.nipKlien}</div>}
                          <div className="text-[12px] text-[var(--text-muted)]">{sv.tanggalSurvey}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: avg >= 4 ? "#16A34A" : avg >= 3 ? "#D97706" : "#DC2626", lineHeight: 1 }}>{avg.toFixed(1)}</div>
                          <div className="text-[12px] text-[var(--text-muted)]">/ 5.0</div>
                        </div>
                      </div>
                      <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]" style={{ marginBottom: saran ? 10 : 0 }}>
                        <table className="w-full border-collapse [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[10px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:text-left [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[10px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0">
                          <thead><tr><th className="text-center w-[40px]">No</th><th>Pertanyaan</th><th className="text-center w-[60px]">Nilai</th></tr></thead>
                          <tbody>
                            {sv.jawaban.filter(j => typeof j.nilaiPilihan === "number").map((j, qi) => (
                              <tr key={j.pertanyaanId}>
                                <td className="text-center">{qi + 1}</td>
                                <td style={{ whiteSpace: "normal" }}>
                                  {PERTANYAAN_SURVEY.find(q => q.id === j.pertanyaanId)?.teks || j.pertanyaanId}
                                </td>
                                <td className="text-center">
                                  <span style={{ fontWeight: 700, color: (j.nilaiPilihan ?? 0) >= 4 ? "#16A34A" : (j.nilaiPilihan ?? 0) >= 3 ? "#D97706" : "#DC2626" }}>
                                    {j.nilaiPilihan}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {saran && (
                        <div style={{ padding: "10px 12px", background: "#FEFCE8", border: "1px solid #FEF08A", borderRadius: 8, fontSize: 12, color: "#713F12" }}>
                          <strong>Kritik &amp; Saran:</strong> {saran}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-[var(--text-muted)]">
                <div className="text-[28px] mb-2 opacity-35"></div>
                <p>Belum ada data survei klien.</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowSurvei(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
