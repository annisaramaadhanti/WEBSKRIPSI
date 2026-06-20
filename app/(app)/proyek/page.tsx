"use client";

import { useEffect, useRef, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import {
  getProyekList,
  tambahProyek as apiTambahProyek, editProyek as apiEditProyek,
  disposisiProyek, terimaProyek, tolakProyek, mulaiProyek,
  buatSuratTugasProyek, publishSuratTugas, urlPdfSuratTugas, urlDokumen, urlLaporanPdf,
  getMasterUnitKerja, getMasterStaf,
  getProgressProyek, tambahProgressProyek,
} from "@/lib/api";
import { mapProyek, mapProgress, extractList } from "@/lib/api-mapper";
import type { Assignee, Proyek, Progress, SuratDetail } from "@/types";

const TW_BADGE_BASE = "inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] before:content-[''] before:shrink-0 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[rgba(255,255,255,0.85)]";
const TW_BTN = "inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] text-[12px] transition-all no-underline";
const TW_BTN_PRIMARY = `${TW_BTN} bg-[#0B1E4B] text-white shadow-[0_2px_8px_rgba(11,30,75,0.22)] hover:bg-[#0F2150] hover:-translate-y-px`;

const STATUS_BADGE: Record<string, string> = {
  "pending":     `${TW_BADGE_BASE} bg-[#D97706] text-white`,
  "accepted":    `${TW_BADGE_BASE} bg-[#0891B2] text-white`,
  "rejected":    `${TW_BADGE_BASE} bg-[#DC2626] text-white`,
  "assigned":    `${TW_BADGE_BASE} bg-[#7C3AED] text-white`,
  "in_progress": `${TW_BADGE_BASE} bg-[#2563EB] text-white`,
  "review":      `${TW_BADGE_BASE} bg-[#EA580C] text-white`,
  "done":        `${TW_BADGE_BASE} bg-[#16A34A] text-white`,
};

const STATUS_LABEL: Record<string, string> = {
  "pending": "Menunggu Konfirmasi",
  "assigned": "Ditugaskan",
  "accepted": "Diterima",
  "rejected": "Ditolak",
  "in_progress": "Sedang Berlangsung",
  "review": "Dalam Tinjauan",
  "done": "Selesai",
};

// ─── Lihat Progress Modal ───
function ProgressModal({
  proyek, role, userId, userName, onClose,
}: {
  proyek: Proyek; role: string; userId?: string; userName?: string; onClose: () => void;
}) {
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [progressForm, setProgressForm] = useState({ keteranganProgress: "", catatan: "", file: null as File | null });
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProgress = () => {
    getProgressProyek(proyek.id)
      .then((res: any) => setProgressData(extractList(res).map(mapProgress)))
      .catch(console.error);
  };

  useEffect(() => { loadProgress(); }, [proyek.id]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert("Maks 20 MB."); e.target.value = ""; return; }
    setProgressForm(prev => ({ ...prev, file }));
  };

  const handleSimpan = async () => {
    if (!progressForm.keteranganProgress) return alert("Keterangan progress wajib diisi.");
    try {
      await tambahProgressProyek({
        id_proyek: proyek.id,
        id_pengguna: userId!,
        keterangan: progressForm.keteranganProgress,
        ...(progressForm.file ? { lampiran: [progressForm.file] } : {}),
      });
      loadProgress();
      setProgressForm({ keteranganProgress: "", catatan: "", file: null });
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
    } catch (e: any) { alert("Gagal simpan progress: " + e.message); }
  };

  // Staf dapat tambah progress hanya saat in_progress
  const canTambah = role === "staf" && proyek.status === "in_progress" && proyek.assignees.some(a => a.stafId === userId);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
      <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2>Progress Proyek</h2>
            <p className="text-[var(--text-muted)] text-[12px] mt-1">{proyek.namaProyek}</p>
          </div>
          {canTambah && !showForm && (
            <button type="button" className={TW_BTN_PRIMARY} onClick={() => setShowForm(true)}>Tambah Progress</button>
          )}
        </div>

        <div className="mb-4 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
          <table><tbody>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Unit Peminta</td><td>: {proyek.unitPeminta || "-"}</td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Lokasi</td><td>: {proyek.lokasi || "-"}</td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Target Selesai</td><td>: {proyek.targetSelesai}</td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Status</td><td>: <span className={STATUS_BADGE[proyek.status] ?? STATUS_BADGE.assigned}>{STATUS_LABEL[proyek.status]}</span></td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Staf</td><td>: {proyek.assignees.map(a => a.nama).join(", ") || proyek.staf || "-"}</td></tr>
          </tbody></table>
        </div>

        {showForm && (
          <div className="bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-4">
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Keterangan Progress *</label>
              <input value={progressForm.keteranganProgress} onChange={(e) => setProgressForm({ ...progressForm, keteranganProgress: e.target.value })} placeholder="Keterangan progress" />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Upload Lampiran (Foto/Dokumen)</label>
              <div className="flex flex-col gap-[7px]">
                <input ref={fileRef} type="file" id="progress-file" className="hidden" onChange={handleFile} />
                <label htmlFor="progress-file" className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] transition-all w-fit hover:bg-[var(--navy-100)] hover:border-[var(--navy-700)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  {progressForm.file ? "Ganti File" : "Pilih File"}
                </label>
                {progressForm.file && (
                  <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] [&_span]:break-all">
                    <span> {progressForm.file.name}</span>
                    <button type="button" className="ml-auto text-[#1A3E8A] opacity-60 hover:opacity-100 text-[14px] leading-none cursor-pointer border-none bg-transparent p-0" onClick={() => { setProgressForm({ ...progressForm, file: null }); if (fileRef.current) fileRef.current.value = ""; }}></button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Catatan (opsional)</label>
              <input value={progressForm.catatan} onChange={(e) => setProgressForm({ ...progressForm, catatan: e.target.value })} placeholder="Catatan tambahan" />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className={TW_BTN_PRIMARY} onClick={handleSimpan}>Simpan Progress</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => { setShowForm(false); setProgressForm({ keteranganProgress: "", catatan: "", file: null }); if (fileRef.current) fileRef.current.value = ""; }}>Batal</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
          <table className="w-full border-collapse min-w-[720px] [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:text-left [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
            <thead><tr><th className="text-center">No</th><th className="text-center">Tanggal</th><th className="text-center">Pengunggah</th><th className="text-center">Keterangan</th><th className="text-center">Lampiran</th></tr></thead>
            <tbody>
              {progressData.length > 0 ? progressData.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td className="text-[12px]">{p.tanggalProgress}</td>
                  <td className="text-[12px]">{p.stafPelapor}</td>
                  <td>{p.keteranganProgress}</td>
                  <td>{p.lampiran ? <span className="text-[var(--navy-600)] text-[12px]"> {p.lampiran}</span> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                </tr>
              )) : (
                <tr className=""><td colSpan={5}>Belum ada progress.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ringkasan Modal ───
function RingkasanModal({ item, onClose }: { item: Proyek; onClose: () => void }) {
  const openSurat = () => {
    if (!item.id_surat_tugas) { alert("Surat tugas belum tersedia."); return; }
    window.open(urlPdfSuratTugas(item.id_surat_tugas), "_blank");
  };

  const handleOpenLaporan = () => {
    if (!item.id_tinjauan) { alert("Laporan belum tersedia."); return; }
    window.open(urlLaporanPdf(item.id_tinjauan), "_blank");
  };

  const isDone = item.status === "done";
  const isReviewOrDone = item.status === "review" || item.status === "done";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
      <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
        <h2>Ringkasan Proyek</h2>
        <div className="bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
          <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Data Proyek</div>
          <table><tbody>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Nama</td><td>: <strong>{item.namaProyek}</strong></td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Unit Peminta</td><td>: {item.unitPeminta || "-"}</td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Lokasi</td><td>: {item.lokasi || "-"}</td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Target Selesai</td><td>: {item.targetSelesai}</td></tr>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Status</td><td>: <span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.assigned}>{STATUS_LABEL[item.status]}</span></td></tr>
          </tbody></table>
        </div>

        {(
          <div className="mt-4 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
            <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Data Surat Masuk</div>
            <table><tbody>
              <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Nomor Surat Masuk</td><td>: {item.nomorSuratMasuk || "—"}</td></tr>
              <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Perihal Surat Masuk</td><td>: {item.perihalSuratMasuk || "—"}</td></tr>
              {item.suratMasuk && <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">PDF Surat Masuk</td><td>: <span className="text-[var(--text-muted)] text-[12px]"> {item.suratMasuk}</span></td></tr>}
            </tbody></table>
          </div>
        )}

        {item.assignees.length > 0 && (
          <div className="mt-4 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
            <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Data Staf</div>
            <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
              <table className="w-full border-collapse min-w-[720px] [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:text-left [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
                <thead><tr><th className="text-center">Nama</th><th className="text-center">NIP</th><th className="text-center">Divisi</th><th className="text-center">Konfirmasi Staf</th><th className="text-center">Surat Tugas</th></tr></thead>
                <tbody>
                  {item.assignees.map((a, i) => (
                    <tr key={i}>
                      <td><strong>{a.nama}</strong></td>
                      <td className="text-[12px]">{a.nip}</td>
                      <td className="text-[12px]">{a.divisi}</td>
                      <td className="text-center"><span className={STATUS_BADGE[a.statusKonfirmasi] ?? STATUS_BADGE.pending}>{STATUS_LABEL[a.statusKonfirmasi]}</span></td>
                      <td className="text-center">{a.masukSurat !== false ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {item.suratDetail && (
          <div className="mt-4 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
            <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Data Surat Tugas</div>
            <table><tbody>
              <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Nomor Surat</td><td>: {item.suratDetail.nomorSurat}</td></tr>
              <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Status</td><td>: <span className={item.suratStatus === "published" ? `${TW_BADGE_BASE} bg-[#6D28D9] text-white` : `${TW_BADGE_BASE} bg-[#D97706] text-white`}>{item.suratStatus === "published" ? "Published" : "Preview"}</span></td></tr>
              <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Tanggal Surat</td><td>: {item.suratDetail.tanggalSuratKeluar}</td></tr>
              <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Tanggal Pelaksanaan</td><td>: {item.suratDetail.tanggalPelaksanaan}</td></tr>
              <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Lokasi Pelaksanaan</td><td>: {item.suratDetail.lokasiPembuatan}</td></tr>
            </tbody></table>
            {item.id_surat_tugas && (
              <button type="button" className="mt-3 inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={openSurat}>
                {item.suratStatus === "published" ? " Buka PDF Surat Tugas" : " Buka PDF Preview"}
              </button>
            )}
          </div>
        )}

        {/* Data Tinjauan — tampil jika Dalam Tinjauan atau Selesai */}
        {isReviewOrDone && (
          <div className="mt-4 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
            <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Data Tinjauan</div>
            <table><tbody>
              <tr>
                <td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Status Tinjauan</td>
                <td>: {isDone ? <span className={STATUS_BADGE.done}>Disetujui</span> : <span className={STATUS_BADGE.pending}>Menunggu ACC</span>}</td>
              </tr>
              {isDone && item.accBy && (
                <>
                  <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Disetujui Oleh</td><td>: {item.accBy.nama}</td></tr>
                  <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Tanggal ACC</td><td>: {item.accAt}</td></tr>
                  {item.catatanKadiv && <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Catatan Kadiv</td><td>: {item.catatanKadiv}</td></tr>}
                </>
              )}
            </tbody></table>
          </div>
        )}

        {/* Hasil Laporan — tampil jika Selesai */}
        {isDone && (
          <div className="mt-4 bg-[var(--success-50)] border border-[#A8DFC0] rounded-[var(--r-lg)] p-4 [&_p]:m-0 [&_a]:font-bold">
            <div className="font-bold text-[13px] mb-1">Laporan Tersedia</div>
            <div className="text-[12px] mb-2">Proyek telah selesai dan laporan bisa diexport.</div>
            <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={handleOpenLaporan}>
              PDF Laporan
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default function ProyekPage() {
  const { role, user } = useRole();
  const [data, setData] = useState<Proyek[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showTambah, setShowTambah] = useState(false);
  const [showEdit, setShowEdit] = useState<Proyek | null>(null);
  const [showDisposisi, setShowDisposisi] = useState<Proyek | null>(null);
  const [showProgress, setShowProgress] = useState<Proyek | null>(null);
  const [showSuratModal, setShowSuratModal] = useState<{ item: Proyek; mode: "buat" | "edit" } | null>(null);
  const [showPublishKonfirm, setShowPublishKonfirm] = useState<Proyek | null>(null);
  const [showTolakModal, setShowTolakModal] = useState<Proyek | null>(null);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [showRingkasan, setShowRingkasan] = useState<Proyek | null>(null);

  const [unitKerjaList, setUnitKerjaList] = useState<{ id_unit: string; nama_unit: string }[]>([]);
  const [form, setForm] = useState({
    namaProyek: "", targetSelesai: "",
    lokasi: "", id_unit: "", nomorSurat: "", perihalSurat: "",
    file: null as File | null,
  });
  const [editForm, setEditForm] = useState({
    namaProyek: "", targetSelesai: "",
    lokasi: "", id_unit: "", nomorSurat: "", perihalSurat: "",
    file: null as File | null,
  });
  const [suratForm, setSuratForm] = useState<SuratDetail>({
    nomorSurat: "", perihal: "", tujuan: "",
    tanggalPelaksanaan: "", lokasiPembuatan: "", tanggalSuratKeluar: "",
  });

  const [formUploadProgress] = useState(false);
  const [editUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    const filter = role === "staf" ? { id_pengguna_staf: user?.id } : {};
    getProyekList(filter)
      .then((res: any) => setData(extractList(res).map(mapProyek)))
      .catch(console.error);
  };
  useEffect(() => { load(); }, [role, user?.id]);
  useEffect(() => {
    getMasterUnitKerja()
      .then((res: any) => setUnitKerjaList(extractList(res)))
      .catch(console.error);
  }, []);

  const fmt = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const filteredData = (() => {
    const q = searchQuery.trim().toLowerCase();
    const base = role === "staf"
      ? data.filter((d) => d.assignees.some((a) => a.stafId === user?.id))
      : role === "kepala-divisi"
        ? data.filter((d) => d.assignees.length === 0 || d.divisi.includes(user?.divisi || ""))
        : data;
    if (!q) return base;
    return base.filter((d) =>
      [d.namaProyek, d.lokasi, d.unitPeminta, d.status, d.suratMasuk || "", d.divisi.join(" "), d.assignees.map(a => a.nama).join(" "), d.staf || ""]
        .join(" ").toLowerCase().includes(q)
    );
  })();

  const handleFormFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Hanya file PDF."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { alert("Maks 10 MB."); e.target.value = ""; return; }
    setForm(prev => ({ ...prev, file }));
  };

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Hanya file PDF."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { alert("Maks 10 MB."); e.target.value = ""; return; }
    setEditForm(prev => ({ ...prev, file }));
  };

  const openEdit = (item: Proyek) => {
    const unitMatch = unitKerjaList.find(u => u.nama_unit === item.unitPeminta);
    setEditForm({
      namaProyek: item.namaProyek,
      targetSelesai: item.targetSelesai,
      lokasi: item.lokasi,
      id_unit: unitMatch?.id_unit ?? "",
      nomorSurat: item.nomorSuratMasuk || "",
      perihalSurat: item.perihalSuratMasuk || "",
      file: null,
    });
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setShowEdit(item);
  };

  const handleSaveEdit = async () => {
    if (!showEdit) return;
    if (!editForm.namaProyek || !editForm.targetSelesai) return alert("Lengkapi field wajib.");
    if (!editForm.id_unit) return alert("Pilih Unit Peminta.");
    if (!editForm.lokasi) return alert("Isi Lokasi proyek.");
    if (!editForm.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!editForm.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    try {
      await apiEditProyek(showEdit.id, {
        id_unit: editForm.id_unit,
        nama_proyek: editForm.namaProyek,
        lokasi: editForm.lokasi,
        target_selesai: editForm.targetSelesai,
        nomor_surat: editForm.nomorSurat,
        perihal: editForm.perihalSurat,
        ...(editForm.file ? { dokumen_surat: editForm.file } : {}),
      });
      setShowEdit(null); load();
    } catch (e: any) { alert("Gagal edit: " + e.message); }
  };

  const handleTambah = async () => {
    if (!form.namaProyek || !form.targetSelesai) return alert("Lengkapi field wajib.");
    if (!form.id_unit) return alert("Pilih Unit Peminta.");
    if (!form.lokasi) return alert("Isi Lokasi proyek.");
    if (!form.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!form.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    if (!form.file) return alert("Dokumen surat masuk (PDF) wajib diunggah.");
    try {
      await apiTambahProyek({
        id_pengguna: user!.id,
        id_unit: form.id_unit,
        nama_proyek: form.namaProyek,
        lokasi: form.lokasi,
        target_selesai: form.targetSelesai,
        nomor_surat: form.nomorSurat,
        perihal: form.perihalSurat,
        dokumen_surat: form.file,
      });
      setShowTambah(false);
      setForm({ namaProyek: "", targetSelesai: "", lokasi: "", id_unit: "", nomorSurat: "", perihalSurat: "", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (e: any) { alert("Gagal tambah: " + e.message); }
  };

  const handleDisposisi = async (proyek: Proyek, stafList: Array<{ stafId: string; nama: string; nip: string; jabatan: string; divisi: string; masukSurat: boolean }>) => {
    try {
      await disposisiProyek(proyek.id, stafList.map(s => ({
        id_pengguna: s.stafId,
        sertakan_dalam_surat: s.masukSurat,
      })));
      setShowDisposisi(null); load();
    } catch (e: any) { alert("Gagal disposisi: " + e.message); }
  };

  const handleTerima = async (item: Proyek) => {
    const assignee = item.assignees.find(a => a.stafId === user?.id);
    const idStaf = assignee?.id_proyek_staf;
    if (!idStaf) { alert("ID staf tidak ditemukan."); return; }
    try {
      await terimaProyek(idStaf);
      load();
    } catch (e: any) { alert("Gagal terima: " + e.message); }
  };

  const handleTolak = async () => {
    if (!alasanTolak.trim()) return alert("Wajib mengisi alasan penolakan.");
    const assignee = showTolakModal!.assignees.find(a => a.stafId === user?.id);
    const idStaf = assignee?.id_proyek_staf;
    if (!idStaf) { alert("ID staf tidak ditemukan."); return; }
    try {
      await tolakProyek(idStaf, alasanTolak);
      setShowTolakModal(null); setAlasanTolak(""); load();
    } catch (e: any) { alert("Gagal tolak: " + e.message); }
  };

  const handleMulai = async (item: Proyek) => {
    try {
      await mulaiProyek(item.id, user!.id);
      load();
    } catch (e: any) { alert("Gagal mulai: " + e.message); }
  };

  const openSuratModal = (item: Proyek, mode: "buat" | "edit") => {
    const defaultDetail: SuratDetail = {
      nomorSurat: item.suratDetail?.nomorSurat ?? "",
      perihal: item.suratDetail?.perihal ?? item.perihalSuratMasuk ?? "",
      tujuan: item.suratDetail?.tujuan ?? "",
      tanggalPelaksanaan: item.suratDetail?.tanggalPelaksanaan ?? "",
      lokasiPembuatan: item.suratDetail?.lokasiPembuatan ?? "Bandar Lampung",
      tanggalSuratKeluar: item.suratDetail?.tanggalSuratKeluar ?? new Date().toISOString().split("T")[0],
    };
    setSuratForm(defaultDetail);
    setShowSuratModal({ item, mode });
  };

  const handleSimpanPreview = async () => {
    if (!suratForm.nomorSurat || !suratForm.tujuan || !suratForm.tanggalPelaksanaan) return alert("Lengkapi semua field surat.");
    const item = showSuratModal!.item;
    try {
      await buatSuratTugasProyek(item.id, {
        nomor_surat: suratForm.nomorSurat,
        perihal: suratForm.perihal,
        tujuan: suratForm.tujuan,
        tanggal_pelaksanaan: suratForm.tanggalPelaksanaan,
        lokasi_pelaksanaan: item.lokasi,
        lokasi_surat: suratForm.lokasiPembuatan,
        tanggal_surat: suratForm.tanggalSuratKeluar,
      });
      setShowSuratModal(null); load();
    } catch (e: any) { alert("Gagal simpan preview: " + e.message); }
  };

  const handlePublish = async () => {
    const item = showPublishKonfirm!;
    if (!item.id_surat_tugas) { alert("ID surat tugas tidak ditemukan."); return; }
    try {
      await publishSuratTugas(item.id_surat_tugas);
      setShowPublishKonfirm(null); load();
    } catch (e: any) { alert("Gagal publish: " + e.message); }
  };

  const openSuratPDF = (item: Proyek) => {
    if (!item.id_surat_tugas) { alert("Surat tugas belum tersedia."); return; }
    window.open(urlPdfSuratTugas(item.id_surat_tugas), "_blank");
  };

  const openLaporan = (item: Proyek) => {
    if (item.status !== "done") return;
    if (!item.id_tinjauan) { alert("Laporan belum tersedia."); return; }
    window.open(urlLaporanPdf(item.id_tinjauan), "_blank");
  };

  const openSuratMasuk = (item: Proyek) => {
    if (!item.id_dokumen_surat) { alert("Dokumen surat masuk tidak tersedia."); return; }
    window.open(urlDokumen(item.id_dokumen_surat), "_blank");
  };

  // ─── Render header berdasarkan role ───
  const renderHeader = () => {
    if (role === "operator") {
      return (
        <tr>
          <th className="text-left min-w-[240px]">Nama Proyek</th>
          <th className="text-left w-[160px]">Unit Peminta</th>
          <th className="text-center w-[110px]">Status</th>
          <th className="text-left min-w-[140px]">Staf</th>
          <th className="text-center w-[90px]">Target</th>
          <th className="text-center w-[90px]">Surat Masuk</th>
          <th className="text-center w-[90px]">Surat Tugas</th>
          <th className="text-center w-[80px]">Progress</th>
          <th className="text-center w-[80px]">Laporan</th>
          <th className="text-center w-[100px]">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-divisi") {
      return (
        <tr>
          <th className="text-left min-w-[240px]">Nama Proyek</th>
          <th className="text-left w-[160px]">Unit Peminta</th>
          <th className="text-center w-[110px]">Status</th>
          <th className="text-center w-[120px]">Konfirmasi Staf</th>
          <th className="text-left min-w-[140px]">Staf</th>
          <th className="text-center w-[90px]">Target</th>
          <th className="text-center w-[90px]">Surat Masuk</th>
          <th className="text-center w-[90px]">Surat Tugas</th>
          <th className="text-center w-[80px]">Progress</th>
          <th className="text-center w-[80px]">Laporan</th>
          <th className="text-center w-[140px]">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-upa") {
      return (
        <tr>
          <th className="text-left min-w-[240px]">Nama Proyek</th>
          <th className="text-left w-[160px]">Unit Peminta</th>
          <th className="text-center w-[110px]">Status</th>
          <th className="text-left min-w-[220px]">Divisi</th>
          <th className="text-left min-w-[140px]">Staf</th>
          <th className="text-center w-[90px]">Target</th>
          <th className="text-center w-[90px]">Surat Masuk</th>
          <th className="text-center w-[90px]">Surat Tugas</th>
          <th className="text-center w-[80px]">Progress</th>
          <th className="text-center w-[80px]">Laporan</th>
          <th className="text-center w-[100px]">Aksi</th>
        </tr>
      );
    }
    // staf
    return (
      <tr>
        <th className="text-left min-w-[240px]">Nama Proyek</th>
        <th className="text-left w-[160px]">Unit Peminta</th>
        <th className="text-center w-[110px]">Status Proyek</th>
        <th className="text-center w-[110px]">Status Saya</th>
        <th className="text-center w-[90px]">Target</th>
        <th className="text-center w-[90px]">Surat Tugas</th>
        <th className="text-center w-[80px]">Progress</th>
        <th className="text-center w-[80px]">Laporan</th>
        <th className="text-center w-[100px]">Aksi</th>
      </tr>
    );
  };

  const getColspan = () => {
    if (role === "operator") return 10;
    if (role === "kepala-divisi") return 11;
    if (role === "kepala-upa") return 11;
    return 9; // staf
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Manajemen Proyek</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.7, fontSize: 13 }}>
            {role === "operator" ? "Buat dan kelola proyek beserta surat tugas terverifikasi."
              : role === "kepala-divisi" ? "Disposisi staf dan pantau progres proyek divisi Anda."
              : role === "staf" ? "Lihat progres dan dokumentasi proyek yang Anda kerjakan."
              : "Pantau semua proyek aktif di seluruh divisi UPA TIK."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-[10px] mb-4">
        <input type="text" className="outline-none w-[min(100%,300px)] px-[13px] py-[9px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:border-[var(--navy-600)] focus:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"
          placeholder="Cari proyek, lokasi, unit, divisi, atau staf..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {role === "operator" && (
          <button type="button" className={TW_BTN_PRIMARY} onClick={() => setShowTambah(true)}>+ Tambah Proyek</button>
        )}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border-soft)] rounded-[var(--r-xl)] p-[22px] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
          <table className="w-full border-collapse min-w-[1100px] [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
            <thead>{renderHeader()}</thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((item) => {
                const isDone = item.status === "done";
                const isAssigned = item.status === "assigned";
                const isInProgress = item.status === "in_progress";
                const isReview = item.status === "review";
                const isActive = isInProgress || isReview || isDone;

                const hasRejected = item.assignees.some(a => a.statusKonfirmasi === "rejected");
                const myAssigneeAll = item.assignees.filter(a => a.stafId === user?.id);
                const myAssignee = myAssigneeAll[myAssigneeAll.length - 1];
                const activeAssignees = item.assignees.filter(a => a.statusKonfirmasi !== "rejected");
                const stafRingkas = activeAssignees.length > 0
                  ? activeAssignees.length === 1 ? activeAssignees[0].nama
                  : `${activeAssignees[0].nama} +${activeAssignees.length - 1}` : null;
                const canBuatPreview = item.assignees.length > 0 &&
                  item.assignees.every(a => a.statusKonfirmasi === "accepted") &&
                  item.suratStatus !== "published";
                const isProgressVisible = isInProgress || isReview || isDone;

                const konfirmasiStafBadge = () => {
                  const total = item.assignees.length;
                  if (total === 0) return <span className="text-[var(--text-muted)] text-[12px]">—</span>;
                  const rejected = item.assignees.filter(a => a.statusKonfirmasi === "rejected").length;
                  const accepted = item.assignees.filter(a => a.statusKonfirmasi === "accepted").length;
                  if (rejected > 0) return <span className={STATUS_BADGE.rejected}>{rejected} Ditolak</span>;
                  if (accepted === total) return <span className={STATUS_BADGE.accepted}>Semua Diterima</span>;
                  return <span className={STATUS_BADGE.assigned}>Menunggu</span>;
                };
                const divisiRingkas = item.divisi.length > 0 ? item.divisi.join(", ") : <span className="text-[var(--text-muted)] text-[12px]">—</span>;

                const suratCell = (roleView: string) => {
                  if (roleView === "operator") {
                    if (!item.suratStatus && canBuatPreview) return <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => openSuratModal(item, "buat")}>Buat Preview</button>;
                    if (!item.suratStatus) return <span className="text-[var(--text-muted)] text-[12px]">Belum Ada</span>;
                    if (item.suratStatus === "draft") return <div className="flex flex-col items-center gap-1">
                      <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF Preview</button>
                      <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => openSuratModal(item, "edit")}>Edit Preview</button>
                      <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#D97706] text-white text-[11px] shadow-[0_2px_8px_rgba(217,119,6,0.28)] transition-all hover:bg-[#B45309] hover:-translate-y-px" onClick={() => setShowPublishKonfirm(item)}>Publish</button>
                    </div>;
                    return <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF</button>;
                  }
                  if (!item.suratStatus) return <span className="text-[var(--text-muted)] text-[12px]">—</span>;
                  if (item.suratStatus === "draft") return <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF Preview</button>;
                  return <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF</button>;
                };

                const progressCell = (canAdd: boolean) => {
                  if (!isProgressVisible) return <span className="text-[var(--text-muted)] text-[12px]">—</span>;
                  return <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowProgress(item)}>Lihat Progress</button>;
                };

                const laporanCell = () => isDone
                  ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openLaporan(item)}>PDF Laporan</button>
                  : <span className="text-[var(--text-muted)] text-[12px]">Belum Tersedia</span>;

                return (
                  <tr key={item.id}>
                    {/* ─── OPERATOR ─── */}
                    {role === "operator" && (<>
                      <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaProyek}</strong>{item.deskripsi && <span className="text-[var(--text-muted)] text-[12px]"> — {item.deskripsi}</span>}</div></td>
                      <td className="text-[12px]">{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                      <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      <td className="text-[12px]">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-[var(--text-muted)] text-[12px]">Belum ditugaskan</span>}</td>
                      <td className="text-center text-[12px]">{item.targetSelesai}</td>
                      <td className="text-center">{item.suratMasuk ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                      <td className="text-center">{suratCell("operator")}</td>
                      <td className="text-center">{progressCell(false)}</td>
                      <td className="text-center">{laporanCell()}</td>
                      <td className="text-center">
                        <div className="flex items-center flex-wrap justify-center gap-[6px]">
                          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                          {isAssigned && item.suratStatus !== "published" && (
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={() => openEdit(item)}>Edit</button>
                          )}
                        </div>
                      </td>
                    </>)}

                    {/* ─── KEPALA DIVISI ─── */}
                    {role === "kepala-divisi" && (<>
                      <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaProyek}</strong>{item.deskripsi && <span className="text-[var(--text-muted)] text-[12px]"> — {item.deskripsi}</span>}</div></td>
                      <td className="text-[12px]">{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                      <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      {isAssigned ? <td className="text-center">{konfirmasiStafBadge()}</td> : <td className="text-center"><span className="text-[var(--text-muted)] text-[12px]">—</span></td>}
                      <td className="text-[12px]">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-[var(--text-muted)] text-[12px]">Belum ditugaskan</span>}</td>
                      <td className="text-center text-[12px]">{item.targetSelesai}</td>
                      <td className="text-center">{item.suratMasuk ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                      <td className="text-center">{suratCell("kadiv")}</td>
                      <td className="text-center">{progressCell(false)}</td>
                      <td className="text-center">{laporanCell()}</td>
                      <td className="text-center">
                        <div className="flex items-center flex-wrap justify-center gap-[6px]">
                          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                          {item.assignees.length === 0 && isAssigned && item.suratStatus !== "published" && <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={() => setShowDisposisi(item)}>Disposisi</button>}
                          {hasRejected && isAssigned && item.suratStatus !== "published" && <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#D97706] text-white text-[11px] shadow-[0_2px_8px_rgba(217,119,6,0.28)] transition-all hover:bg-[#B45309] hover:-translate-y-px" onClick={() => setShowDisposisi(item)}>Penugasan Ulang</button>}
                        </div>
                      </td>
                    </>)}

                    {/* ─── KEPALA UPA ─── */}
                    {role === "kepala-upa" && (<>
                      <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaProyek}</strong>{item.deskripsi && <span className="text-[var(--text-muted)] text-[12px]"> — {item.deskripsi}</span>}</div></td>
                      <td className="text-[12px]">{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                      <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      <td className="!whitespace-normal text-[12px] max-w-[260px]"><div className="line-clamp-2">{divisiRingkas}</div></td>
                      <td className="text-[12px]">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-[var(--text-muted)] text-[12px]">Belum ditugaskan</span>}</td>
                      <td className="text-center text-[12px]">{item.targetSelesai}</td>
                      <td className="text-center">{item.suratMasuk ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                      <td className="text-center">{suratCell("kepala-upa")}</td>
                      <td className="text-center">{progressCell(false)}</td>
                      <td className="text-center">{laporanCell()}</td>
                      <td className="text-center"><button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button></td>
                    </>)}

                    {/* ─── STAF ─── */}
                    {role === "staf" && (<>
                      <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaProyek}</strong>{item.deskripsi && <span className="text-[var(--text-muted)] text-[12px]"> — {item.deskripsi}</span>}</div></td>
                      <td className="text-[12px]">{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                      <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      <td className="text-center">
                        {myAssignee ? <span className={STATUS_BADGE[myAssignee.statusKonfirmasi] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[myAssignee.statusKonfirmasi] || myAssignee.statusKonfirmasi}</span> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}
                      </td>
                      <td className="text-center text-[12px]">{item.targetSelesai}</td>
                      <td className="text-center">
                        {item.suratStatus === "published" ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF</button> : <span className="text-[var(--text-muted)] text-[12px]">Belum Terbit</span>}
                      </td>
                      {/* Progress staf: in_progress = Lihat (Tambah ada di modal), review/done = Lihat, assigned = - */}
                      <td className="text-center">
                        {isProgressVisible
                          ? <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowProgress(item)}>Lihat Progress</button>
                          : <span className="text-[var(--text-muted)] text-[12px]">—</span>}
                      </td>
                      <td className="text-center">{laporanCell()}</td>
                      <td className="text-center">
                        <div className="flex items-center flex-wrap justify-center gap-[6px]">
                          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                          {myAssignee?.statusKonfirmasi === "pending" && isAssigned && (<>
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer shrink-0 w-[28px] h-[28px] p-0 border-none rounded-[var(--r-sm)] bg-[#16A34A] text-white shadow-[0_1px_4px_rgba(22,163,74,0.25)] transition-all hover:bg-[#15803D] hover:-translate-y-px" title="Terima" onClick={() => handleTerima(item)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer shrink-0 w-[28px] h-[28px] p-0 border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white shadow-[0_1px_4px_rgba(220,38,38,0.25)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" title="Tolak" onClick={() => { setAlasanTolak(""); setShowTolakModal(item); }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                          </>)}
                          {myAssignee?.statusKonfirmasi === "accepted" && item.suratStatus === "published" && isAssigned && (
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={() => handleMulai(item)}>Mulai</button>
                          )}
                        </div>
                      </td>
                    </>)}
                  </tr>
                );
              }) : (
                <tr className=""><td colSpan={getColspan()}>Belum ada data proyek.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL TAMBAH PROYEK ─── */}
      {showTambah && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>+ Tambah Proyek</h2>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Nama Proyek *</label><input value={form.namaProyek} onChange={(e) => setForm({ ...form, namaProyek: e.target.value })} placeholder="Nama proyek" /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Unit Peminta *</label>
              <select value={form.id_unit} onChange={(e) => setForm({ ...form, id_unit: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitKerjaList.map(u => <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Lokasi *</label>
              <textarea value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Contoh: Gedung UPA TIK Lantai 3" rows={2} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Target Selesai *</label><input type="date" value={form.targetSelesai} onChange={(e) => setForm({ ...form, targetSelesai: e.target.value })} /></div>
            <div className="flex items-center uppercase font-bold gap-2 text-[10px] tracking-[0.8px] text-[var(--navy-700)] my-2 mb-4 px-3 py-[7px] bg-[var(--navy-50)] rounded-lg border-l-[3px] border-[var(--navy-600)]">Surat Masuk</div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Nomor Surat Masuk *</label><input value={form.nomorSurat} onChange={(e) => setForm({ ...form, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26/TI/2026" /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Perihal Surat Masuk *</label>
              <textarea value={form.perihalSurat} onChange={(e) => setForm({ ...form, perihalSurat: e.target.value })} placeholder="Perihal surat masuk" rows={2} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Dokumen Surat Masuk (PDF) *</label>
              <div className="flex flex-col gap-[7px]">
                <input ref={fileInputRef} type="file" accept="application/pdf" id="form-proyek-file" className="hidden" onChange={handleFormFile} />
                <label htmlFor="form-proyek-file" className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] transition-all w-fit hover:bg-[var(--navy-100)] hover:border-[var(--navy-700)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  {form.file ? "Ganti File" : "Pilih File PDF"}
                </label>
                {form.file && <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] [&_span]:break-all"><span> {form.file.name}</span></div>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className={TW_BTN_PRIMARY} onClick={handleTambah}>Simpan</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => { setShowTambah(false); setForm({ namaProyek: "", targetSelesai: "", lokasi: "", id_unit: "", nomorSurat: "", perihalSurat: "", file: null }); }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL EDIT PROYEK ─── */}
      {showEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>Edit Proyek</h2>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Nama Proyek *</label><input value={editForm.namaProyek} onChange={(e) => setEditForm({ ...editForm, namaProyek: e.target.value })} /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Unit Peminta *</label>
              <select value={editForm.id_unit} onChange={(e) => setEditForm({ ...editForm, id_unit: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitKerjaList.map(u => <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Lokasi *</label><textarea value={editForm.lokasi} onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })} rows={2} /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Target Selesai *</label><input type="date" value={editForm.targetSelesai} onChange={(e) => setEditForm({ ...editForm, targetSelesai: e.target.value })} /></div>
            <div className="flex items-center uppercase font-bold gap-2 text-[10px] tracking-[0.8px] text-[var(--navy-700)] my-2 mb-4 px-3 py-[7px] bg-[var(--navy-50)] rounded-lg border-l-[3px] border-[var(--navy-600)]">Surat Masuk</div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Nomor Surat Masuk *</label><input value={editForm.nomorSurat} onChange={(e) => setEditForm({ ...editForm, nomorSurat: e.target.value })} /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Perihal Surat Masuk *</label><textarea value={editForm.perihalSurat} onChange={(e) => setEditForm({ ...editForm, perihalSurat: e.target.value })} rows={2} /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Ganti Dokumen Surat Masuk (PDF) <span className="text-[var(--text-muted)] text-[12px]">— biarkan kosong untuk tetap gunakan file saat ini</span></label>
              <div className="flex flex-col gap-[7px]">
                <input ref={editFileInputRef} type="file" accept="application/pdf" id="edit-proyek-file" className="hidden" onChange={handleEditFile} />
                <label htmlFor="edit-proyek-file" className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] transition-all w-fit hover:bg-[var(--navy-100)] hover:border-[var(--navy-700)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  {editForm.file ? "Ganti File" : "Pilih File PDF Baru"}
                </label>
                {editForm.file && <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] [&_span]:break-all"><span>{editForm.file.name}</span></div>}
                {!editForm.file && showEdit.suratMasuk && <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] [&_span]:break-all"><span>{showEdit.suratMasuk}</span><span className="ml-auto whitespace-nowrap text-[10px] text-[var(--text-muted)] font-medium">File saat ini</span></div>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className={TW_BTN_PRIMARY} onClick={handleSaveEdit}>Simpan Perubahan</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowEdit(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL BUAT / EDIT PREVIEW SURAT TUGAS ─── */}
      {showSuratModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>{showSuratModal.mode === "buat" ? "Buat Preview Surat Tugas" : "Edit Preview Surat Tugas"}</h2>
            <p className="text-[var(--text-muted)] text-[12px] mb-4">PDF Preview memiliki watermark PREVIEW dan bisa dilihat Kadiv & Kepala UPA sebelum Publish.</p>
            {/* Info otomatis dari data proyek */}
            <div className="mb-4 text-[12px] bg-[#EEF5FF] border border-[#C9DEFF] text-[var(--navy-800)] rounded-[var(--r-lg)] p-4 [&_p]:m-0">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td style={{ color: "var(--text-muted)", width: 160, paddingBottom: 4 }}>Unit Peminta</td><td>: {showSuratModal.item.unitPeminta}</td></tr>
                  <tr><td style={{ color: "var(--text-muted)", paddingBottom: 4 }}>Nomor Surat Masuk</td><td>: {showSuratModal.item.nomorSuratMasuk || "—"}</td></tr>
                  <tr><td style={{ color: "var(--text-muted)" }}>Perihal Surat Masuk</td><td>: {showSuratModal.item.perihalSuratMasuk || "—"}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
                <label>Nomor Surat Tugas *</label>
                <input value={suratForm.nomorSurat} onChange={(e) => setSuratForm({ ...suratForm, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26.TIK/ST.PRO/2026" />
              </div>
              <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
                <label>Tanggal Surat *</label>
                <input type="date" value={suratForm.tanggalSuratKeluar} onChange={(e) => setSuratForm({ ...suratForm, tanggalSuratKeluar: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Tujuan Penugasan *</label><input value={suratForm.tujuan} onChange={(e) => setSuratForm({ ...suratForm, tujuan: e.target.value })} placeholder="Contoh: Melaksanakan pengembangan dan implementasi sistem informasi akademik terpadu" /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Tanggal Pelaksanaan *</label><input type="date" value={suratForm.tanggalPelaksanaan} onChange={(e) => setSuratForm({ ...suratForm, tanggalPelaksanaan: e.target.value })} /></div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Lokasi Surat Dibuat *</label><input value={suratForm.lokasiPembuatan} onChange={(e) => setSuratForm({ ...suratForm, lokasiPembuatan: e.target.value })} placeholder="Contoh: Bandar Lampung" /></div>
            <div className="text-[12px] bg-[#EEF5FF] border border-[#BFD4FF] text-[var(--navy-800)] rounded-[var(--r-lg)] p-4 [&_p]:m-0">
              <div className="font-bold text-[13px] mb-1">Staf yang masuk surat tugas:</div>
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").map((a, i) => (
                <div key={i}>{i + 1}. {a.nama} — NIP: {a.nip}</div>
              ))}
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").length === 0 && (
                <div className="text-[var(--text-muted)] text-[12px]">Belum ada staf. Lakukan Disposisi terlebih dahulu.</div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[12px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={handleSimpanPreview}>Simpan Preview</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowSuratModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── KONFIRMASI PUBLISH ─── */}
      {showPublishKonfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>Konfirmasi Publish Surat Tugas</h2>
            <p className="text-[var(--text-muted)] text-[12px] mt-4">Surat tugas akan diterbitkan sebagai dokumen final.</p>
            <div className="mt-4 bg-[#FEFBF0] border border-[#FAE8A0] rounded-[var(--r-lg)] p-4 [&_p]:m-0">
              Setelah dipublish, data surat tugas <strong>tidak dapat diedit lagi</strong>.<br/>
              Pastikan nomor surat, tanggal, lokasi, tujuan, dan daftar staf sudah benar.
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[12px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={handlePublish}>Ya, Publish</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowPublishKonfirm(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DISPOSISI ─── */}
      {showDisposisi && (
        <DisposisiModal
          judul={showDisposisi.namaProyek}
          isReassign={showDisposisi.assignees.some(a => a.statusKonfirmasi === "rejected")}
          rejectedCount={showDisposisi.assignees.filter(a => a.statusKonfirmasi === "rejected").length}
          onClose={() => setShowDisposisi(null)}
          onSave={(stafList) => handleDisposisi(showDisposisi, stafList)}
        />
      )}

      {/* ─── MODAL TOLAK ─── */}
      {showTolakModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2 className="text-[var(--danger-600)]">Tolak Penugasan</h2>
            <p className="mt-4 text-muted">Anda menolak penugasan proyek: <strong>{showTolakModal.namaProyek}</strong></p>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Alasan Penolakan *</label>
              <textarea value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Contoh: sedang sakit, bentrok jadwal, dll." rows={4} className="resize-none" />
              <div className="text-[11px] text-[var(--text-muted)] mt-4">Alasan ini akan dilihat Kepala Divisi untuk penugasan ulang.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white text-[12px] shadow-[0_2px_8px_rgba(220,38,38,0.28)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" onClick={handleTolak}>Kirim Penolakan</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowTolakModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SURVEI KLIEN ─── */}
      {/* ─── MODAL PROGRESS ─── */}
      {showProgress && (
        <ProgressModal
          proyek={showProgress}
          role={role || ""}
          userId={user?.id}
          userName={user?.nama}
          onClose={() => setShowProgress(null)}
        />
      )}

      {/* ─── MODAL RINGKASAN ─── */}
      {showRingkasan && (
        <RingkasanModal item={showRingkasan} onClose={() => setShowRingkasan(null)} />
      )}
    </div>
  );
}

function DisposisiModal({ judul, isReassign, rejectedCount = 1, onClose, onSave }: {
  judul: string; isReassign: boolean; rejectedCount?: number;
  onClose: () => void;
  onSave: (stafList: Array<{ stafId: string; nama: string; nip: string; jabatan: string; divisi: string; masukSurat: boolean }>) => void;
}) {
  const [allStaf, setAllStaf] = useState<any[]>([]);
  useEffect(() => {
    getMasterStaf()
      .then((res: any) => setAllStaf(extractList(res)))
      .catch(console.error);
  }, []);
  const [selectedMap, setSelectedMap] = useState<Record<string, { masukSurat: boolean }>>({});
  const [search, setSearch] = useState("");

  const handleSave = () => {
    const valid = Object.keys(selectedMap);
    if (!valid.length) return alert("Pilih minimal satu staf.");
    onSave(valid.map(id => {
      const s = allStaf.find((u: any) => (u.uuid ?? u.id) === id) ?? {};
      return {
        stafId: id,
        nama: s.nama_lengkap ?? s.nama ?? "",
        nip: s.NIP ?? s.nip ?? "",
        jabatan: s.peran ?? s.jabatan ?? "",
        divisi: s.divisi?.nama_divisi ?? (typeof s.divisi === "string" ? s.divisi : ""),
        masukSurat: selectedMap[id].masukSurat,
      };
    }));
  };

  const avatarInitials = (nama: string) =>
    nama.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();

  const q = search.toLowerCase();
  const filteredStaf = allStaf.filter((s: any) => {
    const nama = (s.nama_lengkap ?? s.nama ?? "").toLowerCase();
    const nip = (s.NIP ?? s.nip ?? "");
    const divisi = (s.divisi?.nama_divisi ?? s.divisi ?? "").toLowerCase();
    return !q || nama.includes(q) || nip.includes(q) || divisi.includes(q);
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
      <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
        <h2>{isReassign ? "Penugasan Ulang" : "Disposisi Staf"}</h2>
        <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Proyek</label><input readOnly value={judul} /></div>
        {isReassign && (
          <div className="bg-[#FEFBF0] border border-[#FAE8A0] rounded-[var(--r-lg)] p-4 [&_p]:m-0" style={{ marginBottom: 14 }}>
            <div className="font-bold text-[13px] mb-1">{rejectedCount} staf menolak penugasan</div>
            <div className="text-[12px]">Pilih staf pengganti dari daftar di bawah.</div>
          </div>
        )}
        <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
          <label>Pilih Staf *</label>
          <input
            type="text"
            placeholder="Cari nama, NIP, atau divisi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8, maxHeight: 300, overflowY: "auto", padding: "2px 2px 4px" }}>
            {filteredStaf.map((s: any) => {
              const sid = s.uuid ?? s.id;
              const snama = s.nama_lengkap ?? s.nama ?? "";
              const snip = s.NIP ?? s.nip ?? "";
              const sel = !!selectedMap[sid];
              return (
                <div
                  key={sid}
                  onClick={() => setSelectedMap(prev => {
                    if (prev[sid]) { const n = { ...prev }; delete n[sid]; return n; }
                    return { ...prev, [sid]: { masukSurat: true } };
                  })}
                  style={{
                    border: sel ? "2px solid var(--navy-600)" : "1.5px solid var(--border-soft)",
                    borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                    background: sel ? "var(--navy-50)" : "var(--surface)",
                    transition: "border-color 0.14s, background 0.14s", position: "relative",
                  }}
                >
                  {sel && (
                    <span style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: "var(--navy-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>✓</span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: sel ? "var(--navy-600)" : "var(--navy-100)", color: sel ? "#fff" : "var(--navy-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                      {avatarInitials(snama)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{snama}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.divisi?.nama_divisi ?? s.divisi ?? ""}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", paddingLeft: 39 }}>{snip}</div>
                  {sel && (
                    <label onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7, paddingTop: 7, borderTop: "1px solid var(--border-soft)", fontSize: 11, color: "var(--text-soft)", cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedMap[sid]?.masukSurat !== false}
                        onChange={() => setSelectedMap(prev => ({ ...prev, [sid]: { masukSurat: !prev[sid]?.masukSurat } }))} />
                      Masuk Surat Tugas
                    </label>
                  )}
                </div>
              );
            })}
            {filteredStaf.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-muted)", padding: 20, fontSize: 13 }}>Tidak ada staf yang sesuai.</div>
            )}
          </div>
        </div>
        {Object.keys(selectedMap).length > 0 && (
          <div className="bg-[#EEF5FF] border border-[#BFD4FF] text-[var(--navy-800)] rounded-[var(--r-lg)] p-4 [&_p]:m-0" style={{ marginBottom: 12 }}>
            <div className="font-bold text-[13px] mb-1">{Object.keys(selectedMap).length} staf terpilih</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {Object.keys(selectedMap).map(id => {
                const s = allStaf.find((u: any) => (u.uuid ?? u.id) === id); if (!s) return null;
                return (
                  <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--navy-50)", border: "1px solid var(--navy-100)", borderRadius: 20, padding: "3px 8px 3px 10px", fontSize: 12, fontWeight: 600 }}>
                    {s.nama_lengkap ?? s.nama}
                    <button type="button" onClick={() => setSelectedMap(prev => { const n = { ...prev }; delete n[id]; return n; })}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 15, color: "var(--text-muted)", lineHeight: 1, display: "flex", alignItems: "center" }}>×</button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
          <button type="button" className={`${TW_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`} onClick={handleSave} disabled={!Object.keys(selectedMap).length}>
            {isReassign ? "Simpan Penugasan Ulang" : "Simpan Disposisi"}
          </button>
          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
