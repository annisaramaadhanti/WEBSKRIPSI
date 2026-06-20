"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import {
  getPekerjaanList,
  tambahPekerjaan as apiTambah, editPekerjaan as apiEdit,
  disposisiPekerjaan, terimaPekerjaan, tolakPekerjaan, mulaiPekerjaan,
  buatSuratTugasPekerjaan, publishSuratTugas, urlPdfSuratTugas, urlDokumen, urlLaporanPdf,
  getMasterUnitKerja, getMasterStaf, getMasterDivisi, getMasterPengguna,
} from "@/lib/api";
import { mapPekerjaan, extractList } from "@/lib/api-mapper";
import type { Pekerjaan, Assignee, SuratDetail } from "@/types";

const TW_BADGE_BASE = "inline-flex items-center font-semibold whitespace-nowrap gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] tracking-[0.15px] before:content-[''] before:shrink-0 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[rgba(255,255,255,0.85)]";
const TW_BTN_SM = "inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] text-[11px] shadow-none transition-all no-underline";
const TW_BTN = "inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] text-[12px] transition-all no-underline";
const INPUT_CLS = "w-full outline-none px-[13px] py-[10px] border border-[var(--border)] rounded-[var(--r-sm)] text-[13px] text-[var(--text)] bg-[var(--surface)] transition-all focus:border-[var(--navy-600)] focus:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]";

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

// ─── Ringkasan Modal ───
function RingkasanModal({ item, onClose }: { item: Pekerjaan; onClose: () => void }) {
  const openSurat = () => {
    if (item.id_surat_tugas) window.open(urlPdfSuratTugas(item.id_surat_tugas), "_blank");
    else alert("Surat tugas belum tersedia.");
  };

  const openSuratPreview = () => {
    if (item.id_surat_tugas) window.open(urlPdfSuratTugas(item.id_surat_tugas), "_blank");
    else alert("Preview belum tersedia.");
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
        <h2>Ringkasan Pekerjaan</h2>

        <div className="bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-lg)] px-5 pt-5 pb-4 mb-3 text-[13px] overflow-hidden [&_table]:w-full [&_table]:border-collapse [&_td]:py-[7px] [&_td]:px-2 [&_td]:text-[var(--text)] [&_td]:align-top">
          <div className="uppercase font-bold text-[10px] tracking-[0.6px] text-[var(--text-muted)] mb-3 pb-2 border-b border-[var(--border-soft)]">Data Pekerjaan</div>
          <table><tbody>
            <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Nama</td><td>: <strong>{item.namaPekerjaan}</strong></td></tr>
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
              {item.lokasiSuratMasuk && <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">Lokasi Surat</td><td>: {item.lokasiSuratMasuk}</td></tr>}
              {item.suratMasuk && (
                <tr><td className="w-[180px] text-[var(--text-muted)] text-[12px] whitespace-nowrap">PDF Surat Masuk</td><td>: <span className="text-[var(--text-muted)] text-[12px]"> {item.suratMasuk}</span></td></tr>
              )}
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
            {item.suratStatus === "draft" && (
              <button type="button" className="mt-3 inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={openSuratPreview}> Buka PDF Preview</button>
            )}
            {item.suratStatus === "published" && (
              <button type="button" className="mt-3 inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={openSurat}> Buka PDF Surat Tugas</button>
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
        {isDone && item.id_tinjauan && (
          <div className="mt-4 bg-[var(--success-50)] border border-[#A8DFC0] rounded-[var(--r-lg)] p-4 [&_p]:m-0 [&_a]:font-bold">
            <div className="font-bold text-[13px] mb-1">Laporan Tersedia</div>
            <div className="text-[12px] mb-2">Pekerjaan telah selesai dan laporan bisa diexport.</div>
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

export default function PekerjaanPage() {
  const { role, user } = useRole();
  const [data, setData] = useState<Pekerjaan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unitKerjaList, setUnitKerjaList] = useState<{ id_unit: string; nama_unit: string }[]>([]);
  const [divisiList, setDivisiList] = useState<{ uuid: string; nama_divisi: string }[]>([]);

  // Modals
  const [showTambah, setShowTambah] = useState(false);
  const [showEdit, setShowEdit] = useState<Pekerjaan | null>(null);
  const [showDisposisi, setShowDisposisi] = useState<Pekerjaan | null>(null);
  const [showTolakModal, setShowTolakModal] = useState<Pekerjaan | null>(null);
  const [showSuratModal, setShowSuratModal] = useState<{ item: Pekerjaan; mode: "buat" | "edit" } | null>(null);
  const [showPublishKonfirm, setShowPublishKonfirm] = useState<Pekerjaan | null>(null);
  const [showRingkasan, setShowRingkasan] = useState<Pekerjaan | null>(null);

  // Tambah pekerjaan form
  const [form, setForm] = useState({
    namaPekerjaan: "", targetSelesai: "",
    lokasi: "", id_unit: "", id_divisi: [] as string[],
    nomorSurat: "", perihalSurat: "",
    file: null as File | null,
  });

  // Edit pekerjaan form
  const [editForm, setEditForm] = useState({
    namaPekerjaan: "", targetSelesai: "",
    lokasi: "", id_unit: "",
    nomorSurat: "", perihalSurat: "",
    file: null as File | null,
  });
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editUploadProgress, setEditUploadProgress] = useState(false);

  // Surat form (untuk buat/edit preview)
  const [suratForm, setSuratForm] = useState<SuratDetail>({
    nomorSurat: "", perihal: "", tujuan: "",
    tanggalPelaksanaan: "", lokasiPembuatan: "", tanggalSuratKeluar: "",
  });

  // Tolak form
  const [alasanTolak, setAlasanTolak] = useState("");

  const [formUploadProgress, setFormUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = (dl?: typeof divisiList) => {
    const effectiveDivisiList = dl ?? divisiList;
    const filter: any = {};
    if (role === "staf") filter.id_pengguna_staf = user?.id;
    if (role === "kepala-divisi" && user?.divisi) {
      const myDiv = effectiveDivisiList.find((d) => d.nama_divisi === user.divisi);
      if (myDiv) filter.id_divisi = myDiv.uuid;
    }
    getPekerjaanList(filter)
      .then((res: any) => setData(extractList(res).map(mapPekerjaan)))
      .catch(console.error);
  };

  useEffect(() => { if (divisiList.length > 0 || role !== "kepala-divisi") load(); }, [role, user?.id, divisiList]);
  useEffect(() => {
    getMasterUnitKerja()
      .then((res: any) => setUnitKerjaList(extractList(res)))
      .catch(console.error);
    getMasterDivisi()
      .then((res: any) => {
        const list = extractList(res);
        setDivisiList(list);
      })
      .catch(console.error);
  }, []);

  const fmt = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      [d.namaPekerjaan, d.lokasi, d.unitPeminta, d.status, d.suratMasuk || "", d.divisi.join(" "), d.assignees.map((a) => a.nama).join(" ")]
        .join(" ").toLowerCase().includes(q)
    );
  })();

  const handleFormFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Hanya file PDF."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { alert("Maks 10 MB."); e.target.value = ""; return; }
    setForm((prev) => ({ ...prev, file }));
  };

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Hanya file PDF."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { alert("Maks 10 MB."); e.target.value = ""; return; }
    setEditForm((prev) => ({ ...prev, file }));
  };

  const resolveBackendUserId = async () => {
    if (!user) throw new Error("User belum login.");

    const response: any = await getMasterPengguna();
    const users = extractList(response);
    const matched = users.find((item: any) => item.NIP === user.nip)
      ?? users.find((item: any) => item.peran === "Operator");

    return matched?.uuid ?? user.id;
  };

  const openEdit = (item: Pekerjaan) => {
    const unitMatch = unitKerjaList.find(u => u.nama_unit === item.unitPeminta || u.nama_unit === item.unitPeminta);
    setEditForm({
      namaPekerjaan: item.namaPekerjaan,
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
    if (!editForm.namaPekerjaan || !editForm.targetSelesai) return alert("Lengkapi field wajib.");
    if (!editForm.id_unit) return alert("Pilih Unit Peminta.");
    if (!editForm.lokasi) return alert("Isi Lokasi pekerjaan.");
    if (!editForm.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!editForm.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    try {
      await apiEdit(showEdit.id, {
        id_unit: editForm.id_unit,
        nama_pekerjaan: editForm.namaPekerjaan,
        lokasi: editForm.lokasi,
        target_selesai: editForm.targetSelesai,
        nomor_surat: editForm.nomorSurat,
        perihal: editForm.perihalSurat,
        ...(editForm.file ? { dokumen_surat: editForm.file } : {}),
      });
      setShowEdit(null);
      load();
    } catch (e: any) { alert("Gagal edit: " + e.message); }
  };

  const handleTambah = async () => {
    if (!form.namaPekerjaan || !form.targetSelesai) return alert("Lengkapi field wajib.");
    if (!form.id_unit) return alert("Pilih Unit Peminta.");
    if (form.id_divisi.length === 0) return alert("Pilih minimal satu Divisi Penanggungjawab.");
    if (!form.lokasi) return alert("Isi Lokasi pekerjaan.");
    if (!form.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!form.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    if (!form.file) return alert("Dokumen surat masuk (PDF) wajib diunggah.");
    try {
      const idPengguna = await resolveBackendUserId();
      await apiTambah({
        id_pengguna: idPengguna,
        id_unit: form.id_unit,
        id_divisi: form.id_divisi,
        nama_pekerjaan: form.namaPekerjaan,
        lokasi: form.lokasi,
        target_selesai: form.targetSelesai,
        nomor_surat: form.nomorSurat,
        perihal: form.perihalSurat,
        dokumen_surat: form.file,
      });
      setShowTambah(false);
      setForm({ namaPekerjaan: "", targetSelesai: "", lokasi: "", id_unit: "", id_divisi: [], nomorSurat: "", perihalSurat: "", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (e: any) { alert("Gagal tambah: " + e.message); }
  };

  const handleTerima = async (item: Pekerjaan) => {
    const assignee = myAssignee(item);
    const idStaf = assignee?.id_pekerjaan_staf;
    if (!idStaf) { alert("ID staf tidak ditemukan."); return; }
    try {
      await terimaPekerjaan(idStaf);
      load();
    } catch (e: any) { alert("Gagal terima: " + e.message); }
  };

  const openTolak = (item: Pekerjaan) => { setAlasanTolak(""); setShowTolakModal(item); };

  const handleTolak = async () => {
    if (!alasanTolak.trim()) return alert("Wajib mengisi alasan penolakan.");
    const assignee = myAssignee(showTolakModal!);
    const idStaf = assignee?.id_pekerjaan_staf;
    if (!idStaf) { alert("ID staf tidak ditemukan."); return; }
    try {
      await tolakPekerjaan(idStaf, alasanTolak);
      setShowTolakModal(null); setAlasanTolak(""); load();
    } catch (e: any) { alert("Gagal tolak: " + e.message); }
  };

  const handleMulai = async (item: Pekerjaan) => {
    try {
      await mulaiPekerjaan(item.id, user!.id);
      load();
    } catch (e: any) { alert("Gagal mulai: " + e.message); }
  };

  const handleDisposisi = async (pekerjaan: Pekerjaan, finalAssignees: Assignee[]) => {
    try {
      await disposisiPekerjaan(pekerjaan.id, finalAssignees.map(a => ({
        id_pengguna: a.stafId,
        sertakan_dalam_surat: a.masukSurat !== false,
      })));
      setShowDisposisi(null); load();
    } catch (e: any) { alert("Gagal disposisi: " + e.message); }
  };

  const openSuratModal = (item: Pekerjaan, mode: "buat" | "edit") => {
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
      await buatSuratTugasPekerjaan(item.id, {
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

  const openSuratPDF = (item: Pekerjaan) => {
    if (!item.id_surat_tugas) { alert("Surat tugas belum tersedia."); return; }
    window.open(urlPdfSuratTugas(item.id_surat_tugas), "_blank");
  };

  const openSuratMasuk = (item: Pekerjaan) => {
    if (!item.id_dokumen_surat) { alert("Dokumen surat masuk tidak tersedia."); return; }
    window.open(urlDokumen(item.id_dokumen_surat), "_blank");
  };

  // Ambil assignee terbaru (terakhir) untuk staf yang login - hindari deteksi entri lama
  const myAssignee = (item: Pekerjaan) => {
    const all = item.assignees.filter(a => a.stafId === user?.id);
    return all[all.length - 1]; // ambil yang terbaru
  };

  const canBuatPreview = (item: Pekerjaan) =>
    item.assignees.length > 0 &&
    item.assignees.every(a => a.statusKonfirmasi === "accepted") &&
    item.suratStatus !== "published";

  const openLaporan = (item: Pekerjaan) => {
    if (item.status !== "done") return;
    if (!item.id_tinjauan) { alert("Laporan belum tersedia."); return; }
    window.open(urlLaporanPdf(item.id_tinjauan), "_blank");
  };

  // ─── Hitung kolom header & colspan berdasarkan role ───
  const renderHeader = () => {
    if (role === "operator") {
      return (
        <tr>
          <th className="text-left min-w-[240px]">Nama Pekerjaan</th>
          <th className="text-left w-[160px]">Unit Peminta</th>
          <th className="text-center w-[110px]">Status</th>
          <th className="text-left min-w-[220px]">Divisi</th>
          <th className="text-left min-w-[140px]">Staf</th>
          <th className="text-center w-[90px]">Target</th>
          <th className="text-center w-[90px]">Surat Masuk</th>
          <th className="text-center w-[90px]">Surat Tugas</th>
          <th className="text-center w-[80px]">Laporan</th>
          <th className="text-center w-[100px]">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-divisi") {
      return (
        <tr>
          <th className="text-left min-w-[240px]">Nama Pekerjaan</th>
          <th className="text-left w-[160px]">Unit Peminta</th>
          <th className="text-center w-[110px]">Status</th>
          <th className="text-center w-[120px]">Konfirmasi Staf</th>
          <th className="text-left min-w-[220px]">Divisi</th>
          <th className="text-left min-w-[140px]">Staf</th>
          <th className="text-center w-[90px]">Target</th>
          <th className="text-center w-[90px]">Surat Masuk</th>
          <th className="text-center w-[90px]">Surat Tugas</th>
          <th className="text-center w-[80px]">Laporan</th>
          <th className="text-center w-[140px]">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-upa") {
      return (
        <tr>
          <th className="text-left min-w-[240px]">Nama Pekerjaan</th>
          <th className="text-left w-[160px]">Unit Peminta</th>
          <th className="text-center w-[110px]">Status</th>
          <th className="text-left min-w-[220px]">Divisi</th>
          <th className="text-left min-w-[140px]">Staf</th>
          <th className="text-center w-[90px]">Target</th>
          <th className="text-center w-[90px]">Surat Masuk</th>
          <th className="text-center w-[90px]">Surat Tugas</th>
          <th className="text-center w-[80px]">Laporan</th>
          <th className="text-center w-[100px]">Aksi</th>
        </tr>
      );
    }
    // staf
    return (
      <tr>
        <th className="text-left min-w-[240px]">Nama Pekerjaan</th>
        <th className="text-left w-[160px]">Unit Peminta</th>
        <th className="text-center w-[110px]">Status Tugas</th>
        <th className="text-center w-[110px]">Status Saya</th>
        <th className="text-center w-[90px]">Target</th>
        <th className="text-center w-[90px]">Surat Tugas</th>
        <th className="text-center w-[80px]">Laporan</th>
        <th className="text-center w-[100px]">Aksi</th>
      </tr>
    );
  };

  const getColspan = () => {
    if (role === "operator") return 10;
    if (role === "kepala-divisi") return 11;
    if (role === "kepala-upa") return 10;
    return 8; // staf
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="relative overflow-hidden isolate text-white py-[18px] px-[28px] rounded-[var(--r-2xl)] shadow-[0_16px_48px_rgba(11,30,75,0.30)] after:content-[''] after:absolute after:-bottom-[60px] after:-right-[40px] after:w-[200px] after:h-[200px] after:rounded-full after:border-[28px] after:border-[rgba(198,168,75,0.14)] after:pointer-events-none" style={{ background: "linear-gradient(135deg, #0B1E4B 0%, #0F2150 52%, #0F2150 100%)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Manajemen Pekerjaan</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.7, fontSize: 13 }}>
            {role === "operator" ? "Kelola dan distribusikan pekerjaan ke divisi terkait."
              : role === "kepala-divisi" ? "Disposisi staf dan pantau progres pekerjaan divisi Anda."
              : role === "staf" ? "Konfirmasi dan kerjakan pekerjaan yang ditugaskan kepada Anda."
              : "Pantau semua pekerjaan aktif di seluruh divisi UPA TIK."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-[10px] mb-4">
        <input
          type="text" className="outline-none w-[min(100%,300px)] px-[13px] py-[9px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:border-[var(--navy-600)] focus:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"
          placeholder="Cari pekerjaan, lokasi, unit, divisi, atau staf..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
        {role === "operator" && (
          <button type="button" className={`${TW_BTN} bg-[#0B1E4B] text-white shadow-[0_2px_8px_rgba(11,30,75,0.22)] hover:bg-[#0F2150] hover:-translate-y-px`} onClick={() => setShowTambah(true)}>+ Tambah Pekerjaan</button>
        )}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border-soft)] rounded-[var(--r-xl)] p-[22px] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
          <table className="w-full border-collapse min-w-[1100px] [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
            <thead>{renderHeader()}</thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((item) => {
                const assignee = myAssignee(item);
                const isAssigned = item.status === "assigned";
                const isInProgress = item.status === "in_progress";
                const isReview = item.status === "review";
                const isDone = item.status === "done";
                const isActive = isInProgress || isReview || isDone;

                const hasRejected = item.assignees.some(a => a.statusKonfirmasi === "rejected");

                const allAccepted = item.assignees.length > 0 &&
                  item.assignees.every(a => a.statusKonfirmasi === "accepted");

                const activeAssignees = item.assignees.filter(a => a.statusKonfirmasi !== "rejected");
                const stafRingkas = activeAssignees.length > 0
                  ? activeAssignees.length === 1
                    ? activeAssignees[0].nama
                    : `${activeAssignees[0].nama} +${activeAssignees.length - 1}`
                  : null;

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

                // Surat tugas cell per role
                const suratTugasCell = (roleView: string) => {
                  if (roleView === "operator") {
                    if (!item.suratStatus && canBuatPreview(item))
                      return <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => openSuratModal(item, "buat")}>Buat Preview</button>;
                    if (!item.suratStatus)
                      return <span className="text-[var(--text-muted)] text-[12px]">Belum Ada</span>;
                    if (item.suratStatus === "draft")
                      return <div className="flex flex-col items-center gap-1">
                        <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF Preview</button>
                        <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => openSuratModal(item, "edit")}>Edit Preview</button>
                        <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#D97706] text-white text-[11px] shadow-[0_2px_8px_rgba(217,119,6,0.28)] transition-all hover:bg-[#B45309] hover:-translate-y-px" onClick={() => setShowPublishKonfirm(item)}>Publish</button>
                      </div>;
                    return <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF</button>;
                  }
                  if (roleView === "kadiv" || roleView === "kepala-upa") {
                    if (!item.suratStatus) return <span className="text-[var(--text-muted)] text-[12px]">—</span>;
                    if (item.suratStatus === "draft")
                      return <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF Preview</button>;
                    return <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF</button>;
                  }
                  // staf - hanya lihat kalau published
                  if (item.suratStatus === "published")
                    return <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratPDF(item)}>PDF</button>;
                  return <span className="text-[var(--text-muted)] text-[12px]">Belum Terbit</span>;
                };

                // Laporan cell
                const laporanCell = () => isDone && item.id_tinjauan
                  ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openLaporan(item)}>PDF Laporan</button>
                  : <span className="text-[var(--text-muted)] text-[12px]">Belum Tersedia</span>;

                return (
                  <tr key={item.id}>
                    {/* ─── OPERATOR ─── */}
                    {role === "operator" && (
                      <>
                        <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaPekerjaan}</strong></div></td>
                        <td>{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">—</span>}</td>
                        <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        <td className="!whitespace-normal text-[12px] max-w-[260px]"><div className="line-clamp-2">{divisiRingkas}</div></td>
                        <td className="text-[12px]">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-[var(--text-muted)] text-[12px]">Belum ditugaskan</span>}</td>
                        <td className="text-center text-[12px]">{item.targetSelesai}</td>
                        <td className="text-center">{item.suratMasuk ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                        <td className="text-center">{suratTugasCell("operator")}</td>
                        <td className="text-center">{laporanCell()}</td>
                        <td className="text-center">
                          <div className="flex items-center flex-wrap justify-center gap-[6px]">
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {isAssigned && item.suratStatus !== "published" && (
                              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={() => openEdit(item)}>Edit</button>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* ─── KEPALA DIVISI ─── */}
                    {role === "kepala-divisi" && (
                      <>
                        <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaPekerjaan}</strong></div></td>
                        <td>{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">—</span>}</td>
                        <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        {/* Konfirmasi Staf: hanya tampil saat assigned */}
                        {isAssigned
                          ? <td className="text-center">{konfirmasiStafBadge()}</td>
                          : <td className="text-center"><span className="text-[var(--text-muted)] text-[12px]">—</span></td>
                        }
                        <td className="!whitespace-normal text-[12px] max-w-[260px]"><div className="line-clamp-2">{divisiRingkas}</div></td>
                        <td className="text-[12px]">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-[var(--text-muted)] text-[12px]">Belum ditugaskan</span>}</td>
                        <td className="text-center text-[12px]">{item.targetSelesai}</td>
                        <td className="text-center">{item.suratMasuk ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                        <td className="text-center">{suratTugasCell("kadiv")}</td>
                        <td className="text-center">{laporanCell()}</td>
                        <td className="text-center">
                          <div className="flex items-center flex-wrap justify-center gap-[6px]">
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {/* Disposisi: belum ada staf, masih assigned, surat belum published */}
                            {item.assignees.length === 0 && isAssigned && item.suratStatus !== "published" && (
                              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={() => setShowDisposisi(item)}>Disposisi</button>
                            )}
                            {/* Penugasan Ulang: ada yang ditolak, masih assigned, surat belum published */}
                            {hasRejected && isAssigned && item.suratStatus !== "published" && (
                              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#D97706] text-white text-[11px] shadow-[0_2px_8px_rgba(217,119,6,0.28)] transition-all hover:bg-[#B45309] hover:-translate-y-px" onClick={() => setShowDisposisi(item)}>Penugasan Ulang</button>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* ─── KEPALA UPA ─── */}
                    {role === "kepala-upa" && (
                      <>
                        <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaPekerjaan}</strong></div></td>
                        <td>{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">—</span>}</td>
                        <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        <td className="!whitespace-normal text-[12px] max-w-[260px]"><div className="line-clamp-2">{divisiRingkas}</div></td>
                        <td className="text-[12px]">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-[var(--text-muted)] text-[12px]">Belum ditugaskan</span>}</td>
                        <td className="text-center text-[12px]">{item.targetSelesai}</td>
                        <td className="text-center">{item.suratMasuk ? <button type="button" className="inline-flex items-center no-underline whitespace-nowrap font-semibold cursor-pointer gap-[5px] text-[12px] text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[var(--r-sm)] px-[10px] py-[5px] transition-all hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D28D9]" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-[var(--text-muted)] text-[12px]">-</span>}</td>
                        <td className="text-center">{suratTugasCell("kepala-upa")}</td>
                        <td className="text-center">{laporanCell()}</td>
                        <td className="text-center"><button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button></td>
                      </>
                    )}

                    {/* ─── STAF ─── */}
                    {role === "staf" && (
                      <>
                        <td className="!whitespace-normal max-w-[280px]"><div className="line-clamp-2"><strong>{item.namaPekerjaan}</strong></div></td>
                        <td>{item.unitPeminta || <span className="text-[var(--text-muted)] text-[12px]">—</span>}</td>
                        <td className="text-center"><span className={STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        <td className="text-center">
                          {assignee
                            ? <span className={STATUS_BADGE[assignee.statusKonfirmasi] ?? STATUS_BADGE.in_progress}>{STATUS_LABEL[assignee.statusKonfirmasi] || assignee.statusKonfirmasi}</span>
                            : <span className="text-[var(--text-muted)] text-[12px]">-</span>}
                        </td>
                        <td className="text-center text-[12px]">{item.targetSelesai}</td>
                        <td className="text-center">{suratTugasCell("staf")}</td>
                        <td className="text-center">{laporanCell()}</td>
                        <td className="text-center">
                          <div className="flex items-center flex-wrap justify-center gap-[6px]">
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {/* Terima/Tolak: pending & masih assigned */}
                            {assignee?.statusKonfirmasi === "pending" && isAssigned && (
                              <>
                                <button type="button" className="inline-flex items-center justify-center cursor-pointer shrink-0 w-[28px] h-[28px] p-0 border-none rounded-[var(--r-sm)] bg-[#16A34A] text-white shadow-[0_1px_4px_rgba(22,163,74,0.25)] transition-all hover:bg-[#15803D] hover:-translate-y-px" title="Terima" onClick={() => handleTerima(item)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                <button type="button" className="inline-flex items-center justify-center cursor-pointer shrink-0 w-[28px] h-[28px] p-0 border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white shadow-[0_1px_4px_rgba(220,38,38,0.25)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" title="Tolak" onClick={() => openTolak(item)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                              </>
                            )}
                            {/* Mulai: accepted + published + assigned */}
                            {assignee?.statusKonfirmasi === "accepted" && item.suratStatus === "published" && isAssigned && (
                              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={() => handleMulai(item)}>Mulai</button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              }) : (
                <tr className=""><td colSpan={getColspan()}>Belum ada data pekerjaan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL TAMBAH PEKERJAAN ─── */}
      {showTambah && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>+ Tambah Pekerjaan</h2>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Nama Pekerjaan *</label>
              <input value={form.namaPekerjaan} onChange={(e) => setForm({ ...form, namaPekerjaan: e.target.value })} placeholder="Nama pekerjaan" />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Unit Peminta *</label>
              <select value={form.id_unit} onChange={(e) => setForm({ ...form, id_unit: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitKerjaList.map((u) => <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Divisi Penanggungjawab *</label>
              <div className="flex flex-col gap-[6px] mt-[4px]">
                {divisiList.filter(d => d.nama_divisi !== "UPA TIK (Pusat)").map((d) => (
                  <label key={d.uuid} className="flex items-center gap-[8px] cursor-pointer text-[13px] text-[var(--text)] py-[2px]">
                    <input
                      type="checkbox"
                      checked={form.id_divisi.includes(d.uuid)}
                      onChange={() => setForm((prev) => ({
                        ...prev,
                        id_divisi: prev.id_divisi.includes(d.uuid)
                          ? prev.id_divisi.filter((id) => id !== d.uuid)
                          : [...prev.id_divisi, d.uuid],
                      }))}
                    />
                    {d.nama_divisi}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Lokasi *</label>
              <textarea value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                placeholder="Contoh: Gedung Rektorat Lantai 2, Ruang Sidang" rows={2} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Target Selesai *</label>
              <input type="date" value={form.targetSelesai} onChange={(e) => setForm({ ...form, targetSelesai: e.target.value })} />
            </div>
            <div className="flex items-center uppercase font-bold gap-2 text-[10px] tracking-[0.8px] text-[var(--navy-700)] my-2 mb-4 px-3 py-[7px] bg-[var(--navy-50)] rounded-lg border-l-[3px] border-[var(--navy-600)]">Surat Masuk</div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Nomor Surat Masuk *</label>
              <input value={form.nomorSurat} onChange={(e) => setForm({ ...form, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26/TI/2026" />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Perihal Surat Masuk *</label>
              <textarea value={form.perihalSurat} onChange={(e) => setForm({ ...form, perihalSurat: e.target.value })}
                placeholder="Perihal surat masuk" rows={2} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Dokumen Surat Masuk (PDF) *</label>
              <div className="flex flex-col gap-[7px]">
                <input ref={fileInputRef} type="file" accept="application/pdf" id="form-pekerjaan-file" className="hidden" onChange={handleFormFile} />
                <label htmlFor="form-pekerjaan-file" className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] transition-all w-fit hover:bg-[var(--navy-100)] hover:border-[var(--navy-700)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {form.file ? "Ganti File" : "Pilih File PDF"}
                </label>
                {form.file && <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] [&_span]:break-all"><span>{form.file.name}</span></div>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className={`${TW_BTN} bg-[#0B1E4B] text-white shadow-[0_2px_8px_rgba(11,30,75,0.22)] hover:bg-[#0F2150] hover:-translate-y-px`} onClick={handleTambah}>Simpan</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => {
                setShowTambah(false);
                setForm({ namaPekerjaan: "", targetSelesai: "", lokasi: "", id_unit: "", id_divisi: [], nomorSurat: "", perihalSurat: "", file: null });
              }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL EDIT PEKERJAAN ─── */}
      {showEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2>Edit Pekerjaan</h2>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Nama Pekerjaan *</label>
              <input value={editForm.namaPekerjaan} onChange={(e) => setEditForm({ ...editForm, namaPekerjaan: e.target.value })} placeholder="Nama pekerjaan" />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Unit Peminta *</label>
              <select value={editForm.id_unit} onChange={(e) => setEditForm({ ...editForm, id_unit: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitKerjaList.map((u) => <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Lokasi *</label>
              <textarea value={editForm.lokasi} onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })} rows={2} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Target Selesai *</label>
              <input type="date" value={editForm.targetSelesai} onChange={(e) => setEditForm({ ...editForm, targetSelesai: e.target.value })} />
            </div>
            <div className="flex items-center uppercase font-bold gap-2 text-[10px] tracking-[0.8px] text-[var(--navy-700)] my-2 mb-4 px-3 py-[7px] bg-[var(--navy-50)] rounded-lg border-l-[3px] border-[var(--navy-600)]">Surat Masuk</div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Nomor Surat Masuk *</label>
              <input value={editForm.nomorSurat} onChange={(e) => setEditForm({ ...editForm, nomorSurat: e.target.value })} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Perihal Surat Masuk *</label>
              <textarea value={editForm.perihalSurat} onChange={(e) => setEditForm({ ...editForm, perihalSurat: e.target.value })} rows={2} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Ganti Dokumen Surat Masuk (PDF) <span className="text-[var(--text-muted)] text-[12px]">— biarkan kosong untuk tetap gunakan file saat ini</span></label>
              <div className="flex flex-col gap-[7px]">
                <input ref={editFileInputRef} type="file" accept="application/pdf" id="edit-pekerjaan-file" className="hidden" onChange={handleEditFile} />
                <label htmlFor="edit-pekerjaan-file" className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] transition-all w-fit hover:bg-[var(--navy-100)] hover:border-[var(--navy-700)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {editForm.file ? "Ganti File" : "Pilih File PDF Baru"}
                </label>
                {editForm.file && <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] [&_span]:break-all"><span>{editForm.file.name}</span></div>}
                {!editForm.file && showEdit.suratMasuk && <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] [&_span]:break-all"><span>{showEdit.suratMasuk}</span><span className="ml-auto whitespace-nowrap text-[10px] text-[var(--text-muted)] font-medium">File saat ini</span></div>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className={`${TW_BTN} bg-[#0B1E4B] text-white shadow-[0_2px_8px_rgba(11,30,75,0.22)] hover:bg-[#0F2150] hover:-translate-y-px`} onClick={handleSaveEdit}>Simpan Perubahan</button>
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
            <p className="text-[var(--text-muted)] text-[12px] mb-4">
              Preview akan bisa dilihat Kadiv dan Kepala UPA sebelum di-Publish. PDF Preview memiliki watermark PREVIEW.
            </p>
            {/* Info otomatis dari data pekerjaan */}
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
                <input value={suratForm.nomorSurat} onChange={(e) => setSuratForm({ ...suratForm, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26.TIK/ST.PEK/2026" />
              </div>
              <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
                <label>Tanggal Surat *</label>
                <input type="date" value={suratForm.tanggalSuratKeluar} onChange={(e) => setSuratForm({ ...suratForm, tanggalSuratKeluar: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Tujuan Penugasan *</label>
              <input value={suratForm.tujuan} onChange={(e) => setSuratForm({ ...suratForm, tujuan: e.target.value })} placeholder="Contoh: Melaksanakan perbaikan dan pemasangan jaringan wifi di ruang dosen" />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Tanggal Pelaksanaan *</label>
              <input type="date" value={suratForm.tanggalPelaksanaan} onChange={(e) => setSuratForm({ ...suratForm, tanggalPelaksanaan: e.target.value })} />
            </div>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Lokasi Surat Dibuat *</label>
              <input value={suratForm.lokasiPembuatan} onChange={(e) => setSuratForm({ ...suratForm, lokasiPembuatan: e.target.value })} placeholder="Contoh: Bandar Lampung" />
            </div>
            <div className="text-[12px] bg-[#EEF5FF] border border-[#BFD4FF] text-[var(--navy-800)] rounded-[var(--r-lg)] p-4 [&_p]:m-0">
              <div className="font-bold text-[13px] mb-1">Staf yang masuk surat tugas:</div>
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").map((a, i) => (
                <div key={i}>{i + 1}. {a.nama} — NIP: {a.nip}</div>
              ))}
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").length === 0 && (
                <div className="text-[var(--text-muted)] text-[12px]">Belum ada staf yang dipilih untuk surat tugas. Lakukan Disposisi terlebih dahulu.</div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[12px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={handleSimpanPreview}>Simpan Preview</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowSuratModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── POP-UP KONFIRMASI PUBLISH ─── */}
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

      {/* ─── MODAL DISPOSISI / PENUGASAN ULANG ─── */}
      {showDisposisi && (
        <DisposisiModal
          pekerjaan={showDisposisi}
          onClose={() => setShowDisposisi(null)}
          onSave={(finalAssignees) => handleDisposisi(showDisposisi, finalAssignees)}
          isReassign={showDisposisi.assignees.some((a) => a.statusKonfirmasi === "rejected")}
        />
      )}

      {/* ─── MODAL TOLAK ─── */}
      {showTolakModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
          <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[520px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
            <h2 className="text-[var(--danger-600)]">Tolak Penugasan</h2>
            <p className="mt-4 text-muted">
              Anda menolak penugasan: <strong>{showTolakModal.namaPekerjaan}</strong>
            </p>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Alasan Penolakan *</label>
              <textarea value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Contoh: sedang sakit, kecelakaan, bentrok jadwal, dll."
                rows={4} className="resize-none" />
              <div className="text-[11px] text-[var(--text-muted)] mt-4">
                Alasan ini akan dilihat oleh Kepala Divisi untuk melakukan penugasan ulang.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[16px] py-[8px] border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white text-[12px] shadow-[0_2px_8px_rgba(220,38,38,0.28)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" onClick={handleTolak}>Kirim Penolakan</button>
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[14px] py-[7px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[12px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => setShowTolakModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SURVEI KLIEN ─── */}
      {/* ─── MODAL RINGKASAN ─── */}
      {showRingkasan && (
        <RingkasanModal item={showRingkasan} onClose={() => setShowRingkasan(null)} />
      )}
    </div>
  );
}

// ─── Disposisi Modal ───
function DisposisiModal({
  pekerjaan, onClose, onSave, isReassign,
}: {
  pekerjaan: Pekerjaan;
  onClose: () => void;
  onSave: (finalAssignees: Assignee[]) => void;
  isReassign: boolean;
}) {
  const [allStaf, setAllStaf] = useState<any[]>([]);
  useEffect(() => {
    getMasterStaf()
      .then((res: any) => setAllStaf(extractList(res)))
      .catch(console.error);
  }, []);

  // ── Initial disposisi: dropdown + table ──
  const [selectedMap, setSelectedMap] = useState<Record<string, { masukSurat: boolean }>>({});
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingStafId, setPendingStafId] = useState("");

  // ── Reassign mode state ──
  type ExistingAction = {
    action: "keep" | "remove" | "replace";
    replacementId: string;
    replacementSearch: string;
    replacementOpen: boolean;
    replacementMasukSurat: boolean;
  };
  type AddRow = { uid: number; stafId: string; search: string; open: boolean; masukSurat: boolean };

  const [existingActions, setExistingActions] = useState<ExistingAction[]>(() =>
    pekerjaan.assignees.map(() => ({
      action: "keep" as const,
      replacementId: "",
      replacementSearch: "",
      replacementOpen: false,
      replacementMasukSurat: true,
    }))
  );
  const [addRows, setAddRows] = useState<AddRow[]>([]);
  const [nextUid, setNextUid] = useState(0);

  const updateExisting = (i: number, patch: Partial<ExistingAction>) =>
    setExistingActions(prev => prev.map((x, j) => j === i ? { ...x, ...patch } : x));
  const addNewRow = () => { setAddRows(prev => [...prev, { uid: nextUid, stafId: "", search: "", open: false, masukSurat: true }]); setNextUid(n => n + 1); };
  const removeAddRow = (uid: number) => setAddRows(prev => prev.filter(r => r.uid !== uid));
  const updateAddRow = (uid: number, patch: Partial<AddRow>) =>
    setAddRows(prev => prev.map(r => r.uid === uid ? { ...r, ...patch } : r));

  const occupiedIds = (() => {
    const ids = new Set<string>();
    if (isReassign) {
      pekerjaan.assignees.forEach((a, i) => {
        // Staf yang sudah rejected tidak boleh dipilih lagi di manapun
        if (a.statusKonfirmasi === "rejected") { ids.add(a.stafId); return; }
        if (existingActions[i]?.action === "keep") ids.add(a.stafId);
        // Staf yang sedang di-replace juga tidak bisa jadi pengganti diri sendiri
        if (existingActions[i]?.action === "replace") ids.add(a.stafId);
        if (existingActions[i]?.action === "replace" && existingActions[i].replacementId)
          ids.add(existingActions[i].replacementId);
      });
      addRows.forEach(r => { if (r.stafId) ids.add(r.stafId); });
    } else {
      Object.keys(selectedMap).forEach(id => ids.add(id));
    }
    return ids;
  })();

  const handleSave = () => {
    if (!isReassign) {
      const valid = Object.keys(selectedMap);
      if (valid.length === 0) return alert("Pilih minimal satu staf.");
      onSave(valid.map(id => {
        const s = allStaf.find(u => (u.uuid ?? u.id) === id) ?? {};
        return {
          stafId: id,
          nama: s.nama_lengkap ?? s.nama ?? "",
          nip: s.NIP ?? s.nip ?? "",
          jabatan: s.peran ?? s.jabatan ?? "",
          divisi: s.divisi?.nama_divisi ?? (typeof s.divisi === "string" ? s.divisi : ""),
          statusPekerjaan: "assigned" as const,
          statusKonfirmasi: "pending" as const,
          masukSurat: selectedMap[id].masukSurat,
        };
      }));
      return;
    }
    if (existingActions.some(ea => ea.action === "replace" && !ea.replacementId))
      return alert("Pilih staf pengganti untuk semua yang akan diganti.");
    const final: Assignee[] = [];
    pekerjaan.assignees.forEach((a, i) => {
      const ea = existingActions[i];
      if (ea.action === "keep") { final.push(a); return; }
      if (ea.action === "replace" && ea.replacementId) {
        const s = allStaf.find((u: any) => (u.uuid ?? u.id) === ea.replacementId) ?? {};
        final.push({ stafId: ea.replacementId, nama: s.nama_lengkap ?? s.nama ?? "", nip: s.NIP ?? s.nip ?? "", jabatan: s.peran ?? s.jabatan ?? "", divisi: s.divisi?.nama_divisi ?? (typeof s.divisi === "string" ? s.divisi : ""),
          statusPekerjaan: "assigned" as const, statusKonfirmasi: "pending" as const, masukSurat: ea.replacementMasukSurat });
      }
    });
    addRows.forEach(r => {
      if (!r.stafId) return;
      const s = allStaf.find((u: any) => (u.uuid ?? u.id) === r.stafId) ?? {};
      final.push({ stafId: r.stafId, nama: s.nama_lengkap ?? s.nama ?? "", nip: s.NIP ?? s.nip ?? "", jabatan: s.peran ?? s.jabatan ?? "", divisi: s.divisi?.nama_divisi ?? (typeof s.divisi === "string" ? s.divisi : ""),
        statusPekerjaan: "assigned" as const, statusKonfirmasi: "pending" as const, masukSurat: r.masukSurat });
    });
    if (final.length === 0) return alert("Minimal harus ada satu staf.");
    onSave(final);
  };

  const avatarInitials = (nama: string) =>
    nama.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();

  const statusBadge = (a: Assignee) => {
    if (a.statusKonfirmasi === "accepted") return <span className={STATUS_BADGE.accepted}>Diterima</span>;
    if (a.statusKonfirmasi === "rejected") return <span className={STATUS_BADGE.rejected}>Ditolak</span>;
    return <span className={STATUS_BADGE.assigned}>Menunggu</span>;
  };

  const q = search.toLowerCase();
  const filteredStaf = allStaf.filter((s: any) => {
    const nm = (s.nama_lengkap ?? s.nama ?? "").toLowerCase();
    const np = (s.NIP ?? s.nip ?? "");
    return !q || nm.includes(q) || np.includes(q) || (s.divisi?.nama_divisi ?? s.divisi ?? "").toLowerCase().includes(q);
  });

  const handleAddStaf = () => {
    if (!pendingStafId) return;
    setSelectedMap(prev => ({ ...prev, [pendingStafId]: { masukSurat: true } }));
    setPendingStafId("");
    setSearch("");
  };

  const pendingStaf = pendingStafId ? allStaf.find((s: any) => (s.uuid ?? s.id) === pendingStafId) : null;
  const selectedEntries = Object.keys(selectedMap).map(id => ({ id, ...selectedMap[id], staf: allStaf.find((s: any) => (s.uuid ?? s.id) === id)! })).filter(e => e.staf);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px] [animation:overlayIn_var(--dur-base)_var(--ease)]">
      <div className="overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-w-[840px] max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [animation:modalIn_var(--dur-slow)_var(--ease)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]">
        <h2>{isReassign ? "Penugasan Ulang" : "Disposisi Staf"}</h2>
        <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"><label>Pekerjaan</label><input readOnly value={pekerjaan.namaPekerjaan} /></div>

        {/* ── Initial disposisi: dropdown + summary + table ── */}
        {!isReassign && (
          <>
            <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
              <label>Pilih Staf *</label>
              <div>
                <input
                  type="text"
                  placeholder="Cari nama, NIP, atau divisi..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPendingStafId(""); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 180)}
                  className="w-full outline-none px-[13px] py-[10px] border border-[var(--border)] rounded-[var(--r-sm)] text-[13px] text-[var(--text)] bg-[var(--surface)] focus:border-[var(--navy-600)] focus:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]"
                />
                {dropdownOpen && (
                  <div className="absolute overflow-y-auto top-[calc(100%+4px)] left-0 right-0 z-[9999] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] shadow-[0_8px_24px_rgba(11,30,75,0.15)] max-h-[320px]" style={{ position: "static", marginTop: 4 }}>
                    {filteredStaf.filter((s: any) => !selectedMap[s.uuid ?? s.id]).map((s: any) => {
                      const sid = s.uuid ?? s.id;
                      const snama = s.nama_lengkap ?? s.nama ?? "";
                      return (
                      <div key={sid} className="cursor-pointer flex flex-col px-[13px] py-[10px] border-b border-[var(--border-soft)] transition-all gap-0.5 hover:bg-[var(--navy-50)] last:border-b-0"
                        onMouseDown={e => { e.preventDefault(); setPendingStafId(sid); setSearch(snama); setDropdownOpen(false); }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy-100)", color: "var(--navy-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {avatarInitials(snama)}
                          </div>
                          <div>
                            <div className="font-semibold text-small">{snama}</div>
                            <div className="text-[var(--text-muted)] text-[11px]">{s.NIP ?? s.nip} · {s.divisi?.nama_divisi ?? s.divisi ?? ""}</div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    {filteredStaf.filter((s: any) => !selectedMap[s.uuid ?? s.id]).length === 0 && (
                      <div style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 13 }}>Tidak ada staf yang sesuai.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Ringkasan staf yang dipilih dari dropdown */}
              {pendingStaf && (
                <div style={{ marginTop: 10, padding: "12px 14px", border: "1.5px solid var(--navy-200)", borderRadius: 10, background: "var(--navy-50)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--navy-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {avatarInitials((pendingStaf as any).nama_lengkap ?? (pendingStaf as any).nama ?? "")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{(pendingStaf as any).nama_lengkap ?? (pendingStaf as any).nama}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{(pendingStaf as any).peran ?? (pendingStaf as any).jabatan}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{(pendingStaf as any).divisi?.nama_divisi ?? (pendingStaf as any).divisi ?? ""} · NIP: {(pendingStaf as any).NIP ?? (pendingStaf as any).nip}</div>
                  </div>
                  <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" style={{ flexShrink: 0 }} onClick={handleAddStaf}>
                    + Tambah ke Daftar
                  </button>
                </div>
              )}
            </div>

            {/* Tabel ringkasan staf yang sudah ditambahkan */}
            {selectedEntries.length > 0 && (
              <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
                <label>Daftar Staf Ditugaskan ({selectedEntries.length})</label>
                <div className="overflow-x-auto min-w-0 w-full mt-1 mb-5 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
                  <table className="w-full border-collapse min-w-[720px] [&_th]:text-left [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:px-[14px] [&_th]:py-[12px] [&_th]:bg-[var(--surface-alt)] [&_th]:text-[var(--text-muted)] [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-[var(--border-soft)] [&_td]:whitespace-nowrap [&_td]:text-left [&_td]:align-middle [&_td]:px-[14px] [&_td]:py-[12px] [&_td]:border-b [&_td]:border-[rgba(221,227,239,0.6)] [&_td]:text-[13px] [&_td]:text-[var(--text)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[rgba(41,80,168,0.03)]">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>NIP</th>
                        <th>Divisi / Jabatan</th>
                        <th className="text-center">Masuk Surat Tugas</th>
                        <th className="text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntries.map((e, i) => (
                        <tr key={e.id}>
                          <td className="text-center text-[12px]">{i + 1}</td>
                          <td><strong>{(e.staf as any).nama_lengkap ?? (e.staf as any).nama}</strong></td>
                          <td className="text-[12px]">{(e.staf as any).NIP ?? (e.staf as any).nip}</td>
                          <td className="text-[12px]">{(e.staf as any).divisi?.nama_divisi ?? (e.staf as any).divisi ?? ""}</td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={e.masukSurat !== false}
                              onChange={() => setSelectedMap(prev => ({ ...prev, [e.id]: { masukSurat: !prev[e.id]?.masukSurat } }))}
                            />
                          </td>
                          <td className="text-center">
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer shrink-0 w-[28px] h-[28px] p-0 border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white shadow-[0_1px_4px_rgba(220,38,38,0.25)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" title="Hapus"
                              onClick={() => setSelectedMap(prev => { const n = { ...prev }; delete n[e.id]; return n; })}>
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Penugasan Ulang: card list ── */}
        {isReassign && (
          <div className="flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>input:focus]:border-[var(--navy-600)] [&>input:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>input[readonly]]:bg-[var(--surface-alt)] [&>input[readonly]]:cursor-default [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>textarea:focus]:border-[var(--navy-600)] [&>textarea:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)] [&>select:focus]:border-[var(--navy-600)] [&>select:focus]:shadow-[0_0_0_3px_rgba(41,80,168,0.10)]">
            <label>Staf Saat Ini</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pekerjaan.assignees.map((a, i) => {
                const ea = existingActions[i] ?? { action: "keep", replacementId: "", replacementSearch: "", replacementOpen: false, replacementMasukSurat: true };
                const isRemoved = ea.action === "remove";
                const isReplacing = ea.action === "replace";
                const avatarBg = a.statusKonfirmasi === "rejected" ? "#FEE2E2" : a.statusKonfirmasi === "accepted" ? "#D1FAE5" : "var(--navy-100)";
                const avatarColor = a.statusKonfirmasi === "rejected" ? "#991B1B" : a.statusKonfirmasi === "accepted" ? "#065F46" : "var(--navy-700)";
                return (
                  <div key={a.stafId} style={{ border: "1.5px solid var(--border-soft)", borderRadius: 10, padding: "12px 14px", background: isRemoved ? "var(--surface-alt)" : "var(--surface)", opacity: isRemoved ? 0.55 : 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: avatarBg, color: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                        {avatarInitials(a.nama)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{a.nama}</span>
                          {statusBadge(a)}
                          {isRemoved && <span className={STATUS_BADGE.rejected}>Akan Dihapus</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.nip} · {a.divisi}</div>
                        {a.statusKonfirmasi === "rejected" && a.alasanPenolakan && (
                          <div style={{ fontSize: 11, color: "var(--danger-600)", marginTop: 4, fontStyle: "italic" }}>"{a.alasanPenolakan}"</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {a.statusKonfirmasi === "accepted" && <span className="text-[11px] text-[var(--text-muted)]" style={{ alignSelf: "center" }}>Terkunci</span>}
                        {a.statusKonfirmasi === "pending" && ea.action === "keep" && (
                          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white text-[11px] shadow-[0_2px_8px_rgba(220,38,38,0.28)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" onClick={() => updateExisting(i, { action: "remove" })}>Hapus</button>
                        )}
                        {a.statusKonfirmasi === "pending" && ea.action === "remove" && (
                          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => updateExisting(i, { action: "keep" })}>Batalkan</button>
                        )}
                        {a.statusKonfirmasi === "rejected" && ea.action === "keep" && (
                          <>
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#0EA5E9] text-white text-[11px] shadow-[0_2px_8px_rgba(14,165,233,0.28)] transition-all hover:bg-[#0284C7] hover:-translate-y-px" onClick={() => updateExisting(i, { action: "replace" })}>Ganti</button>
                            <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white text-[11px] shadow-[0_2px_8px_rgba(220,38,38,0.28)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" onClick={() => updateExisting(i, { action: "remove" })}>Hapus</button>
                          </>
                        )}
                        {a.statusKonfirmasi === "rejected" && ea.action === "remove" && (
                          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => updateExisting(i, { action: "keep" })}>Batalkan</button>
                        )}
                        {isReplacing && (
                          <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" onClick={() => updateExisting(i, { action: "keep", replacementId: "", replacementSearch: "" })}>Batal</button>
                        )}
                      </div>
                    </div>
                    {isReplacing && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-soft)" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Ganti dengan:</div>
                        <div style={{ position: "relative" }}>
                          <input
                            placeholder="Cari nama atau NIP staf pengganti..."
                            value={ea.replacementId ? (allStaf.find(s => s.id === ea.replacementId)?.nama || ea.replacementSearch) : ea.replacementSearch}
                            onFocus={() => updateExisting(i, { replacementOpen: true })}
                            onBlur={() => setTimeout(() => updateExisting(i, { replacementOpen: false }), 180)}
                            onChange={e => updateExisting(i, { replacementSearch: e.target.value, replacementId: "" })}
                            style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                          {(ea.replacementOpen || (!!ea.replacementSearch && !ea.replacementId)) && (
                            <div className="absolute overflow-y-auto top-[calc(100%+4px)] left-0 right-0 z-[9999] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] shadow-[0_8px_24px_rgba(11,30,75,0.15)] max-h-[320px]" style={{ position: "static", marginTop: 4 }}>
                              {allStaf.filter((s: any) => {
                                const sid = s.uuid ?? s.id;
                                const snama = (s.nama_lengkap ?? s.nama ?? "").toLowerCase();
                                const snip = s.NIP ?? s.nip ?? "";
                                return (!occupiedIds.has(sid) || sid === ea.replacementId) &&
                                  (!ea.replacementSearch || sid === ea.replacementId ||
                                    snama.includes(ea.replacementSearch.toLowerCase()) ||
                                    snip.includes(ea.replacementSearch));
                              }).map((s: any) => {
                                const sid = s.uuid ?? s.id;
                                const snama = s.nama_lengkap ?? s.nama ?? "";
                                return (
                                <div key={sid} className="cursor-pointer flex flex-col px-[13px] py-[10px] border-b border-[var(--border-soft)] transition-all gap-0.5 hover:bg-[var(--navy-50)] last:border-b-0"
                                  onMouseDown={e => { e.preventDefault(); updateExisting(i, { replacementId: sid, replacementSearch: snama, replacementOpen: false }); }}>
                                  <div className="font-semibold text-small">{snama}</div>
                                  <div className="text-[var(--text-muted)] text-[11px]">{s.NIP ?? s.nip} · {s.divisi?.nama_divisi ?? s.divisi ?? ""}</div>
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {ea.replacementId && (() => {
                          const rs = allStaf.find((s: any) => (s.uuid ?? s.id) === ea.replacementId);
                          if (!rs) return null;
                          const rsnama = (rs as any).nama_lengkap ?? (rs as any).nama ?? "";
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, padding: "8px 12px", background: "var(--navy-50)", borderRadius: 8, border: "1px solid var(--navy-100)" }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{avatarInitials(rsnama)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{rsnama}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{(rs as any).NIP ?? (rs as any).nip} · {(rs as any).divisi?.nama_divisi ?? (rs as any).divisi ?? ""}</div>
                              </div>
                              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-soft)", cursor: "pointer", whiteSpace: "nowrap" }}>
                                <input type="checkbox" checked={ea.replacementMasukSurat} onChange={() => updateExisting(i, { replacementMasukSurat: !ea.replacementMasukSurat })} />
                                Surat Tugas
                              </label>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              {addRows.map(r => {
                const sel = r.stafId ? allStaf.find((s: any) => (s.uuid ?? s.id) === r.stafId) : null;
                const selNama = sel ? ((sel as any).nama_lengkap ?? (sel as any).nama ?? "") : "";
                return (
                  <div key={r.uid} style={{ border: "1.5px dashed var(--navy-200)", borderRadius: 10, padding: "12px 14px", background: "var(--navy-50)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy-700)" }}>Staf Tambahan</span>
                      <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[4px] px-[12px] py-[6px] border-none rounded-[var(--r-sm)] bg-[#DC2626] text-white text-[11px] shadow-[0_2px_8px_rgba(220,38,38,0.28)] transition-all hover:bg-[#B91C1C] hover:-translate-y-px" onClick={() => removeAddRow(r.uid)}>Hapus</button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        placeholder="Cari nama atau NIP..."
                        value={r.stafId ? (selNama || r.search) : r.search}
                        onFocus={() => updateAddRow(r.uid, { open: true })}
                        onBlur={() => setTimeout(() => updateAddRow(r.uid, { open: false }), 180)}
                        onChange={e => updateAddRow(r.uid, { search: e.target.value, stafId: "" })}
                        style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                      {(r.open || (!!r.search && !r.stafId)) && (
                        <div className="absolute overflow-y-auto top-[calc(100%+4px)] left-0 right-0 z-[9999] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] shadow-[0_8px_24px_rgba(11,30,75,0.15)] max-h-[320px]" style={{ position: "static", marginTop: 4 }}>
                          {allStaf.filter((s: any) => {
                            const sid = s.uuid ?? s.id;
                            const snama = (s.nama_lengkap ?? s.nama ?? "").toLowerCase();
                            const snip = s.NIP ?? s.nip ?? "";
                            return (!occupiedIds.has(sid) || sid === r.stafId) &&
                              (!r.search || sid === r.stafId || snama.includes(r.search.toLowerCase()) || snip.includes(r.search));
                          }).map((s: any) => {
                            const sid = s.uuid ?? s.id;
                            const snama = s.nama_lengkap ?? s.nama ?? "";
                            return (
                            <div key={sid} className="cursor-pointer flex flex-col px-[13px] py-[10px] border-b border-[var(--border-soft)] transition-all gap-0.5 hover:bg-[var(--navy-50)] last:border-b-0" onMouseDown={e => { e.preventDefault(); updateAddRow(r.uid, { stafId: sid, search: snama, open: false }); }}>
                              <div className="font-semibold text-small">{snama}</div>
                              <div className="text-[var(--text-muted)] text-[11px]">{s.NIP ?? s.nip} · {s.divisi?.nama_divisi ?? s.divisi ?? ""}</div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {sel && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border-soft)" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{avatarInitials(selNama)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{selNama}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{(sel as any).NIP ?? (sel as any).nip} · {(sel as any).divisi?.nama_divisi ?? (sel as any).divisi ?? ""}</div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-soft)", cursor: "pointer", whiteSpace: "nowrap" }}>
                          <input type="checkbox" checked={r.masukSurat} onChange={() => updateAddRow(r.uid, { masukSurat: !r.masukSurat })} />
                          Surat Tugas
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
              <button type="button" className="inline-flex items-center justify-center cursor-pointer font-semibold gap-[6px] px-[12px] py-[6px] border border-[1.5px] border-[#CBD5E1] rounded-[var(--r-sm)] bg-white text-[#475569] text-[11px] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]" style={{ alignSelf: "flex-start" }} onClick={addNewRow}>+ Tambah Staf Lain</button>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-2">Staf "Terkunci" (sudah Diterima) tidak dapat diubah.</div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-5 pt-[14px] border-t border-[var(--border-soft)]">
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isReassign
                ? existingActions.every(ea => ea.action === "remove") && addRows.every(r => !r.stafId)
                : Object.keys(selectedMap).length === 0
            }
            className="inline-flex items-center justify-center gap-[6px] px-[20px] py-[9px] rounded-[var(--r-sm)] bg-[#0B1E4B] text-white text-[13px] font-semibold cursor-pointer border-none shadow-[0_2px_8px_rgba(11,30,75,0.25)] transition-all hover:bg-[#0F2150] hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isReassign ? "Simpan Penugasan Ulang" : "Simpan Disposisi"}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-[6px] px-[18px] py-[9px] rounded-[var(--r-sm)] bg-transparent text-[#64748B] text-[13px] font-semibold cursor-pointer border border-[1.5px] border-[#CBD5E1] transition-all hover:bg-[#F1F5F9] hover:border-[#94A3B8] hover:text-[#1E293B]"
            onClick={onClose}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
