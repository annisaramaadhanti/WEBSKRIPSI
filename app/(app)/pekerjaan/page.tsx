"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Fragment } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import {
  getPekerjaan, deletePekerjaan, updatePekerjaan, addPekerjaan, seedIfEmpty,
  getDokumentasiByRef, getHasilSurveyByRef,
} from "@/lib/storage";
import { divisiList, unitPemintaList, getKepalaUPA, PERTANYAAN_SURVEY, USERS } from "@/lib/data";
import type { Pekerjaan, Assignee, HasilSurvey, SuratDetail } from "@/types";
import { openLaporanInTab } from "@/lib/laporan-pdf";

const STATUS_BADGE: Record<string, string> = {
  // StatusKonfirmasi
  "pending":     "badge-yellow",
  "accepted":    "badge-green",
  "rejected":    "badge-red",
  // StatusPekerjaan
  "assigned":    "badge-purple",
  "in_progress": "badge-blue",
  "review":      "badge-yellow",
  "done":        "badge-green",
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

// ─── Generate Surat Tugas PDF (HTML-based, opens in new tab) ───
function generateSuratTugasPDFHTML(data: {
  nomorSurat: string; perihal: string; tujuan: string;
  tanggalPelaksanaan: string; lokasiPembuatan: string; tanggalSuratKeluar: string;
  namaPekerjaan: string; lokasi: string; unitPeminta: string;
  assignees: Assignee[]; namaKepalaUPA: string; nipKepalaUPA: string;
  jabatanKepalaUPA: string; isPreview?: boolean;
}): string {
  const stafRows = data.assignees
    .filter((a) => a.masukSurat !== false && a.statusKonfirmasi !== "rejected" && a.statusKonfirmasi !== "rejected")
    .map((a, i) => `
      <tr>
        <td style="text-align:center;width:8%">${i + 1}</td>
        <td style="width:35%">${a.nama}</td>
        <td style="width:25%">${a.nip}</td>
        <td style="width:32%">${a.divisi || a.jabatan}</td>
      </tr>`)
    .join("");

  const watermark = data.isPreview
    ? `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);opacity:0.06;font-size:96px;font-weight:900;color:#000;letter-spacing:6px;pointer-events:none;z-index:999;white-space:nowrap;">PREVIEW</div>`
    : "";

  // Format tanggal: "05 Juni 2026" → tampilkan apa adanya, atau konversi jika ISO
  const fmtTgl = (s: string) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; background: #fff; padding: 2cm 2.5cm; }
  .page { max-width: 720px; margin: 0 auto; }

  /* KOP */
  .kop { display: flex; align-items: center; gap: 18px; margin-bottom: 10px; }
  .kop-logo { width: 88px; height: auto; flex-shrink: 0; }
  .kop-teks { flex: 1; }
  .kop-kementerian { font-size: 11pt; text-align: center; line-height: 1.4; }
  .kop-univ { font-size: 14pt; font-weight: bold; text-align: center; letter-spacing: 0.5px; margin-top: 2px; }
  .kop-upa  { font-size: 12pt; font-weight: bold; text-align: center; margin-top: 2px; }
  .kop-alamat { font-size: 9pt; text-align: center; margin-top: 3px; color: #333; }
  hr.tebal { border: none; border-top: 2.5px solid #000; margin: 8px 0 2px; }
  hr.tipis { border: none; border-top: 1px solid #000; margin: 0 0 14px; }

  /* Judul */
  .judul-box { text-align: center; margin: 20px 0 18px; }
  .judul-box .judul { font-size: 13pt; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
  .judul-box .nomor { font-size: 11pt; margin-top: 4px; }

  /* Isi naratif */
  .narasi { font-size: 11.5pt; text-align: justify; line-height: 1.7; margin-bottom: 14px; }

  /* Tabel staf */
  .tbl-staf { width: 100%; border-collapse: collapse; margin: 12px 0 14px; font-size: 11pt; }
  .tbl-staf th { border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; background: #f0f0f0; }
  .tbl-staf td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }

  /* Tanda tangan */
  .ttd-wrap { margin-top: 32px; overflow: hidden; font-size: 11pt; }
  .ttd-kota { margin-bottom: 4px; }
  .ttd-box { float: right; text-align: center; width: 260px; }
  .ttd-jabatan { margin-bottom: 70px; }
  .ttd-nama { font-weight: bold; text-decoration: underline; }
  .ttd-nip  { margin-top: 3px; }

  @media print { body { padding: 1.5cm 2cm; } }
</style>
</head>
<body>
${watermark}
<div class="page">

  <!-- KOP -->
  <div class="kop">
    <img src="/logo-unila.png" alt="Logo Universitas Lampung" class="kop-logo" />
    <div class="kop-teks">
      <div class="kop-kementerian">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
      <div class="kop-univ">UNIVERSITAS LAMPUNG</div>
      <div class="kop-upa">UPA. TEKNOLOGI INFORMASI DAN KOMUNIKASI</div>
      <div class="kop-alamat">Jl. Prof. Dr. Sumantri Brojonegoro No.1, Gedong Meneng, Bandar Lampung 35145</div>
      <div class="kop-alamat">e-mail: tik@kpa.ac.id &nbsp;&#9679;&nbsp; laman: http://tik.unila.ac.id</div>
    </div>
  </div>
  <hr class="tebal"/><hr class="tipis"/>

  <!-- JUDUL -->
  <div class="judul-box">
    <div class="judul">SURAT TUGAS</div>
    <div class="nomor">Nomor : ${data.nomorSurat}</div>
  </div>

  <!-- NARASI PEMBUKA -->
  <p class="narasi">
    Sehubungan dengan surat ${data.unitPeminta} Nomor: ${data.nomorSurat} perihal ${data.perihal}.
    Dengan ini Kepala UPA Teknologi Informasi dan Komunikasi menugaskan kepada:
  </p>

  <!-- TABEL STAF -->
  <table class="tbl-staf">
    <thead>
      <tr>
        <th style="width:8%">No</th>
        <th style="width:35%">NAMA</th>
        <th style="width:25%">NIP</th>
        <th className="th-center">KETERANGAN</th>
      </tr>
    </thead>
    <tbody>
      ${stafRows || `<tr><td colspan="4" style="text-align:center;padding:10px;">Belum ada staf ditugaskan</td></tr>`}
    </tbody>
  </table>

  <!-- NARASI TUGAS -->
  <p class="narasi">
    Untuk Melaksanakan ${data.perihal.toLowerCase()}. pada kegiatan ${data.namaPekerjaan},
    yang akan dilaksanakan pada tanggal ${fmtTgl(data.tanggalPelaksanaan)},
    kegiatan dilaksanakan di ${data.lokasi}.
  </p>

  <p class="narasi">
    Demikian surat tugas ini dikeluarkan untuk dilaksanakan dengan penuh tanggung jawab.
  </p>

  <!-- TANDA TANGAN -->
  <div class="ttd-wrap">
    <div class="ttd-box">
      <div class="ttd-kota">${data.lokasiPembuatan}, ${fmtTgl(data.tanggalSuratKeluar)}</div>
      <div class="ttd-jabatan">${data.jabatanKepalaUPA}</div>
      <div class="ttd-nama">${data.namaKepalaUPA}</div>
      <div class="ttd-nip">NIP ${data.nipKepalaUPA}</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

function generateSuratTugasPDFBase64(data: Parameters<typeof generateSuratTugasPDFHTML>[0]): string {
  return btoa(encodeURIComponent(generateSuratTugasPDFHTML(data)));
}

function openHtmlInTab(base64: string) {
  try {
    const html = decodeURIComponent(atob(base64));
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  } catch (e) { alert("Gagal membuka dokumen: " + (e instanceof Error ? e.message : "Unknown error")); }
}

// ─── Ringkasan Modal ───
function RingkasanModal({ item, onClose }: { item: Pekerjaan; onClose: () => void }) {
  const openSurat = () => {
    if (item.suratTugasData) openHtmlInTab(item.suratTugasData);
    else alert("Surat tugas belum tersedia.");
  };

  const openSuratPreview = () => {
    if (item.suratTugasData) {
      const kepala = getKepalaUPA();
      const previewData = generateSuratTugasPDFBase64({
        ...(item.suratDetail ?? { nomorSurat: "-", perihal: "-", tujuan: "-", tanggalPelaksanaan: "-", lokasiPembuatan: "Bandar Lampung", tanggalSuratKeluar: "-" }),
        namaPekerjaan: item.namaPekerjaan, lokasi: item.lokasi, unitPeminta: item.unitPeminta,
        assignees: item.assignees,
        namaKepalaUPA: kepala?.nama || "-", nipKepalaUPA: kepala?.nip || "-", jabatanKepalaUPA: kepala?.jabatan || "-",
        isPreview: true,
      });
      openHtmlInTab(previewData);
    } else alert("Preview belum tersedia.");
  };

  const handleOpenLaporan = () => {
    const dokumentasiList = getDokumentasiByRef(item.id).filter(d => !d.judul.startsWith("Surat Masuk:"));
    const surveyList = getHasilSurveyByRef(item.id);
    openLaporanInTab({ item, jenis: "PEKERJAAN", dokumentasiList, surveyList });
  };

  const isDone = item.status === "done";
  const isReviewOrDone = item.status === "review" || item.status === "done";

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-wide">
        <h2>Ringkasan Pekerjaan</h2>

        <div className="info-box">
          <div className="info-box-title">Data Pekerjaan</div>
          <table><tbody>
            <tr><td className="info-label">Nama</td><td>: <strong>{item.namaPekerjaan}</strong></td></tr>
            <tr><td className="info-label">Unit Peminta</td><td>: {item.unitPeminta || "-"}</td></tr>
            <tr><td className="info-label">Lokasi</td><td>: {item.lokasi || "-"}</td></tr>
            <tr><td className="info-label">Target Selesai</td><td>: {item.targetSelesai}</td></tr>
            <tr><td className="info-label">Status</td><td>: <span className={`badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span></td></tr>
          </tbody></table>
        </div>

        {(
          <div className="info-box mt-4">
            <div className="info-box-title">Data Surat Masuk</div>
            <table><tbody>
              <tr><td className="info-label">Nomor Surat Masuk</td><td>: {item.nomorSuratMasuk || "—"}</td></tr>
              <tr><td className="info-label">Perihal Surat Masuk</td><td>: {item.perihalSuratMasuk || "—"}</td></tr>
              {item.lokasiSuratMasuk && <tr><td className="info-label">Lokasi Surat</td><td>: {item.lokasiSuratMasuk}</td></tr>}
              {item.suratMasuk && (
                <tr><td className="info-label">PDF Surat Masuk</td><td>: <span className="text-muted text-small"> {item.suratMasuk}</span></td></tr>
              )}
            </tbody></table>
          </div>
        )}

        {item.assignees.length > 0 && (
          <div className="info-box mt-4">
            <div className="info-box-title">Data Staf</div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th className="th-center">Nama</th><th className="th-center">NIP</th><th className="th-center">Divisi</th><th className="th-center">Konfirmasi Staf</th><th className="th-center">Surat Tugas</th></tr></thead>
                <tbody>
                  {item.assignees.map((a, i) => (
                    <tr key={i}>
                      <td><strong>{a.nama}</strong></td>
                      <td className="text-small">{a.nip}</td>
                      <td className="text-small">{a.divisi}</td>
                      <td className="td-center"><span className={`badge ${STATUS_BADGE[a.statusKonfirmasi]}`}>{STATUS_LABEL[a.statusKonfirmasi]}</span></td>
                      <td className="td-center">{a.masukSurat !== false ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {item.suratDetail && (
          <div className="info-box mt-4">
            <div className="info-box-title">Data Surat Tugas</div>
            <table><tbody>
              <tr><td className="info-label">Nomor Surat</td><td>: {item.suratDetail.nomorSurat}</td></tr>
              <tr><td className="info-label">Status</td><td>: <span className={`badge ${item.suratStatus === "published" ? "badge-green" : "badge-yellow"}`}>{item.suratStatus === "published" ? "Published" : "Preview"}</span></td></tr>
              <tr><td className="info-label">Tanggal Surat</td><td>: {item.suratDetail.tanggalSuratKeluar}</td></tr>
              <tr><td className="info-label">Tanggal Pelaksanaan</td><td>: {item.suratDetail.tanggalPelaksanaan}</td></tr>
              <tr><td className="info-label">Lokasi Pelaksanaan</td><td>: {item.suratDetail.lokasiPembuatan}</td></tr>
            </tbody></table>
            {item.suratStatus === "draft" && (
              <button type="button" className="btn-secondary btn-sm mt-3" onClick={openSuratPreview}> Buka PDF Preview</button>
            )}
            {item.suratStatus === "published" && (
              <button type="button" className="btn-secondary btn-sm mt-3" onClick={openSurat}> Buka PDF Surat Tugas</button>
            )}
          </div>
        )}

        {/* Data Tinjauan — tampil jika Dalam Tinjauan atau Selesai */}
        {isReviewOrDone && (
          <div className="info-box mt-4">
            <div className="info-box-title">Data Tinjauan</div>
            <table><tbody>
              <tr>
                <td className="info-label">Status Tinjauan</td>
                <td>: {isDone ? <span className="badge badge-green">Disetujui</span> : <span className="badge badge-yellow">Menunggu ACC</span>}</td>
              </tr>
              {isDone && item.accBy && (
                <>
                  <tr><td className="info-label">Disetujui Oleh</td><td>: {item.accBy.nama}</td></tr>
                  <tr><td className="info-label">Tanggal ACC</td><td>: {item.accAt}</td></tr>
                  {item.catatanKadiv && <tr><td className="info-label">Catatan Kadiv</td><td>: {item.catatanKadiv}</td></tr>}
                </>
              )}
            </tbody></table>
          </div>
        )}

        {/* Hasil Laporan — tampil jika Selesai */}
        {isDone && (
          <div className="notice-card notice-success mt-4">
            <div className="notice-card-title">Laporan Tersedia</div>
            <div className="text-small mb-2">Pekerjaan telah selesai dan laporan bisa diexport.</div>
            <button type="button" className="btn-link-pdf" onClick={handleOpenLaporan}>
              PDF Laporan
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default function PekerjaanPage() {
  const { role, user } = useRole();
  const [data, setData] = useState<Pekerjaan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showTambah, setShowTambah] = useState(false);
  const [showEdit, setShowEdit] = useState<Pekerjaan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Pekerjaan | null>(null);
  const [showDisposisi, setShowDisposisi] = useState<Pekerjaan | null>(null);
  const [showTolakModal, setShowTolakModal] = useState<Pekerjaan | null>(null);
  const [showSuratModal, setShowSuratModal] = useState<{ item: Pekerjaan; mode: "buat" | "edit" } | null>(null);
  const [showPublishKonfirm, setShowPublishKonfirm] = useState<Pekerjaan | null>(null);
  const [showRingkasan, setShowRingkasan] = useState<Pekerjaan | null>(null);

  // Tambah pekerjaan form
  const [form, setForm] = useState({
    namaPekerjaan: "", divisi: [] as string[], deskripsi: "", targetSelesai: "",
    lokasi: "", unitPeminta: "",
    nomorSurat: "", perihalSurat: "", lokasiSurat: "",
    filePath: "", fileData: "", fileSize: 0,
  });

  // Edit pekerjaan form
  const [editForm, setEditForm] = useState({
    namaPekerjaan: "", divisi: [] as string[], deskripsi: "", targetSelesai: "",
    lokasi: "", unitPeminta: "",
    nomorSurat: "", perihalSurat: "", lokasiSurat: "",
    filePath: "", fileData: "", fileSize: 0,
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

  // Survey state

  const [formUploadProgress, setFormUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => { seedIfEmpty(); setData(getPekerjaan()); };
  useEffect(() => { load(); }, []);

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
        ? data.filter((d) => d.divisi.includes(user?.divisi || ""))
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
    setFormUploadProgress(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setForm((prev) => ({ ...prev, filePath: file.name, fileData: base64, fileSize: file.size }));
      setFormUploadProgress(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Hanya file PDF."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { alert("Maks 10 MB."); e.target.value = ""; return; }
    setEditUploadProgress(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setEditForm((prev) => ({ ...prev, filePath: file.name, fileData: base64, fileSize: file.size }));
      setEditUploadProgress(false);
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (item: Pekerjaan) => {
    setEditForm({
      namaPekerjaan: item.namaPekerjaan,
      divisi: item.divisi,
      deskripsi: item.deskripsi || "",
      targetSelesai: item.targetSelesai,
      lokasi: item.lokasi,
      unitPeminta: item.unitPeminta,
      nomorSurat: item.nomorSuratMasuk || "",
      perihalSurat: item.perihalSuratMasuk || "",
      lokasiSurat: item.lokasiSuratMasuk || "",
      filePath: "", fileData: "", fileSize: 0,
    });
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setShowEdit(item);
  };

  const handleSaveEdit = () => {
    if (!showEdit) return;
    if (!editForm.namaPekerjaan || !editForm.targetSelesai) return alert("Lengkapi field wajib.");
    if (!editForm.unitPeminta) return alert("Pilih Unit Peminta.");
    if (!editForm.lokasi) return alert("Isi Lokasi pekerjaan.");
    if (!editForm.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!editForm.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    const payload: Partial<Pekerjaan> = {
      namaPekerjaan: editForm.namaPekerjaan,
      divisi: editForm.divisi,
      deskripsi: editForm.deskripsi || null,
      targetSelesai: editForm.targetSelesai,
      lokasi: editForm.lokasi,
      unitPeminta: editForm.unitPeminta,
      nomorSuratMasuk: editForm.nomorSurat,
      perihalSuratMasuk: editForm.perihalSurat,
      lokasiSuratMasuk: editForm.lokasiSurat,
    };
    if (editForm.fileData) {
      payload.suratMasuk = editForm.filePath;
      payload.suratMasukData = editForm.fileData;
    }
    updatePekerjaan(showEdit.id, payload);
    setShowEdit(null);
    load();
  };

  const handleConfirmDelete = () => {
    if (!showDeleteConfirm) return;
    deletePekerjaan(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    load();
  };

  const handleTambah = () => {
    if (!form.namaPekerjaan || !form.targetSelesai) return alert("Lengkapi field wajib.");
    if (!form.unitPeminta) return alert("Pilih Unit Peminta.");
    if (!form.lokasi) return alert("Isi Lokasi pekerjaan.");
    if (!form.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!form.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    if (!form.fileData) return alert("Dokumen surat masuk (PDF) wajib diunggah.");
    addPekerjaan({
      namaPekerjaan: form.namaPekerjaan,
      status: "assigned",
      suratMasuk: form.filePath,
      suratMasukData: form.fileData,
      nomorSuratMasuk: form.nomorSurat,
      perihalSuratMasuk: form.perihalSurat,
      lokasiSuratMasuk: form.lokasiSurat,
      divisi: form.divisi,
      assignees: [],
      lokasi: form.lokasi,
      unitPeminta: form.unitPeminta,
      deskripsi: form.deskripsi || null,
      targetSelesai: form.targetSelesai,
      suratTugas: null,
      suratStatus: undefined,
      catatan: null,
    });
    setShowTambah(false);
    setForm({ namaPekerjaan: "", divisi: [], deskripsi: "", targetSelesai: "", lokasi: "", unitPeminta: "", nomorSurat: "", perihalSurat: "", lokasiSurat: "", filePath: "", fileData: "", fileSize: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  };

  const handleTerima = (item: Pekerjaan) => {
    const newAssignees = item.assignees.map((a) =>
      a.stafId === user?.id ? { ...a, statusKonfirmasi: "accepted" as const } : a
    );
    updatePekerjaan(item.id, { assignees: newAssignees });
    load();
  };

  const openTolak = (item: Pekerjaan) => { setAlasanTolak(""); setShowTolakModal(item); };

  const handleTolak = () => {
    if (!alasanTolak.trim()) return alert("Wajib mengisi alasan penolakan.");
    const newAssignees = showTolakModal!.assignees.map((a) =>
      a.stafId === user?.id
        ? { ...a, statusKonfirmasi: "rejected" as const, alasanPenolakan: alasanTolak }
        : a
    );
    updatePekerjaan(showTolakModal!.id, { assignees: newAssignees });
    setShowTolakModal(null); setAlasanTolak(""); load();
  };

  const handleMulai = (item: Pekerjaan) => {
    const newAssignees = item.assignees.map((a) =>
      a.stafId === user?.id ? { ...a, statusPekerjaan: "in_progress" as const } : a
    );
    updatePekerjaan(item.id, { assignees: newAssignees, status: "in_progress" });
    load();
  };

  const handleDisposisi = (pekerjaan: Pekerjaan, finalAssignees: Assignee[]) => {
    updatePekerjaan(pekerjaan.id, { assignees: finalAssignees, status: "assigned" });
    setShowDisposisi(null); load();
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

  const handleSimpanPreview = () => {
    if (!suratForm.nomorSurat || !suratForm.tujuan || !suratForm.tanggalPelaksanaan) return alert("Lengkapi semua field surat.");
    const item = showSuratModal!.item;
    const kepala = getKepalaUPA();
    const previewBase64 = generateSuratTugasPDFBase64({
      ...suratForm,
      namaPekerjaan: item.namaPekerjaan, lokasi: item.lokasi, unitPeminta: item.unitPeminta,
      assignees: item.assignees,
      namaKepalaUPA: kepala?.nama || "-", nipKepalaUPA: kepala?.nip || "-", jabatanKepalaUPA: kepala?.jabatan || "-",
      isPreview: true,
    });
    updatePekerjaan(item.id, {
      suratStatus: "draft",
      suratDetail: suratForm,
      suratTugasData: previewBase64,
      suratTugas: `ST-PREVIEW-${item.id}.pdf`,
    });
    setShowSuratModal(null); load();
  };

  const handlePublish = () => {
    const item = showPublishKonfirm!;
    const kepala = getKepalaUPA();
    const finalBase64 = generateSuratTugasPDFBase64({
      ...(item.suratDetail ?? { nomorSurat: "-", perihal: "-", tujuan: "-", tanggalPelaksanaan: "-", lokasiPembuatan: "Bandar Lampung", tanggalSuratKeluar: "-" }),
      namaPekerjaan: item.namaPekerjaan, lokasi: item.lokasi, unitPeminta: item.unitPeminta,
      assignees: item.assignees,
      namaKepalaUPA: kepala?.nama || "-", nipKepalaUPA: kepala?.nip || "-", jabatanKepalaUPA: kepala?.jabatan || "-",
      isPreview: false,
    });
    updatePekerjaan(item.id, {
      suratTugas: `ST-${item.id}.pdf`,
      suratTugasData: finalBase64,
      suratStatus: "published",
    });
    setShowPublishKonfirm(null); load();
  };

  const openSuratPDF = (item: Pekerjaan) => {
    if (!item.suratTugasData) { alert("Surat tugas belum tersedia."); return; }
    openHtmlInTab(item.suratTugasData);
  };

  // ─── Buka PDF Surat Masuk ───
  const openSuratMasuk = (item: Pekerjaan) => {
    if (!item.suratMasuk) return;
    if ((item as any).suratMasukData) {
      try {
        const byteChars = atob((item as any).suratMasukData);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: "application/pdf" });
        window.open(URL.createObjectURL(blob), "_blank");
      } catch { alert(`File: ${item.suratMasuk}`); }
    } else {
      alert(`File surat masuk: ${item.suratMasuk}`);
    }
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

  // ─── Buka PDF Laporan ───
  const openLaporan = (item: Pekerjaan) => {
    if (item.status !== "done") return;
    const dokumentasiList = getDokumentasiByRef(item.id).filter(d => !d.judul.startsWith("Surat Masuk:"));
    const surveyList = getHasilSurveyByRef(item.id);
    openLaporanInTab({ item, jenis: "PEKERJAAN", dokumentasiList, surveyList });
  };

  // ─── Hitung kolom header & colspan berdasarkan role ───
  const renderHeader = () => {
    if (role === "operator") {
      return (
        <tr>
          <th className="col-nama">Nama Pekerjaan</th>
          <th className="col-unit">Unit Peminta</th>
          <th className="th-center col-status">Status</th>
          <th className="col-staf">Staf</th>
          <th className="th-center col-target">Target</th>
          <th className="th-center col-surat">Surat Masuk</th>
          <th className="th-center col-surat">Surat Tugas</th>
          <th className="th-center col-laporan">Laporan</th>
          <th className="th-center col-aksi">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-divisi") {
      return (
        <tr>
          <th className="col-nama">Nama Pekerjaan</th>
          <th className="col-unit">Unit Peminta</th>
          <th className="th-center col-status">Status</th>
          <th className="th-center col-konfirmasi">Konfirmasi Staf</th>
          <th className="col-staf">Staf</th>
          <th className="th-center col-target">Target</th>
          <th className="th-center col-surat">Surat Masuk</th>
          <th className="th-center col-surat">Surat Tugas</th>
          <th className="th-center col-laporan">Laporan</th>
          <th className="th-center col-aksi">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-upa") {
      return (
        <tr>
          <th className="th-center">Nama Pekerjaan</th>
          <th className="th-center">Unit Peminta</th>
          <th className="th-center">Status</th>
          <th className="th-center">Divisi</th>
          <th className="th-center">Staf</th>
          <th className="th-center">Target</th>
          <th className="th-center">Surat Masuk</th>
          <th className="th-center">Surat Tugas</th>
          <th className="th-center">Laporan</th>
          <th className="th-center">Aksi</th>
        </tr>
      );
    }
    // staf
    return (
      <tr>
        <th className="col-nama">Nama Pekerjaan</th>
        <th className="col-unit">Unit Peminta</th>
        <th className="th-center col-status">Status Tugas</th>
        <th className="th-center col-status">Status Saya</th>
        <th className="th-center col-target">Target</th>
        <th className="th-center col-surat">Surat Tugas</th>
        <th className="th-center col-laporan">Laporan</th>
        <th className="th-center col-aksi">Aksi</th>
      </tr>
    );
  };

  const getColspan = () => {
    if (role === "operator") return 9;
    if (role === "kepala-divisi") return 10;
    if (role === "kepala-upa") return 10;
    return 8; // staf
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="title">Manajemen Pekerjaan</h1>
        <p className="subtitle">Kelola pekerjaan dengan alur konfirmasi dua arah dan penugasan ulang.</p>
      </div>

      <div className="search-row">
        <input
          type="text" className="search-box"
          placeholder="Cari pekerjaan, lokasi, unit, divisi, atau staf..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
        {role === "operator" && (
          <button type="button" onClick={() => setShowTambah(true)}>+ Tambah Pekerjaan</button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
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

                const stafRingkas = item.assignees.length > 0
                  ? item.assignees.length === 1
                    ? item.assignees[0].nama
                    : `${item.assignees[0].nama} +${item.assignees.length - 1}`
                  : null;

                const konfirmasiStafBadge = () => {
                  const total = item.assignees.length;
                  if (total === 0) return <span className="text-muted text-small">—</span>;
                  const rejected = item.assignees.filter(a => a.statusKonfirmasi === "rejected").length;
                  const accepted = item.assignees.filter(a => a.statusKonfirmasi === "accepted").length;
                  if (rejected > 0) return <span className="badge badge-red">{rejected} Ditolak</span>;
                  if (accepted === total) return <span className="badge badge-green">Semua Diterima</span>;
                  return <span className="badge badge-purple">Menunggu</span>;
                };

                const divisiRingkas = item.divisi.length > 0 ? item.divisi.join(", ") : <span className="text-muted">—</span>;

                // Surat tugas cell per role
                const suratTugasCell = (roleView: string) => {
                  if (roleView === "operator") {
                    if (!item.suratStatus && canBuatPreview(item))
                      return <button type="button" className="btn-secondary btn-sm" onClick={() => openSuratModal(item, "buat")}>Buat Preview</button>;
                    if (!item.suratStatus)
                      return <span className="text-muted text-small">Belum Ada</span>;
                    if (item.suratStatus === "draft")
                      return <div className="cell-action-group">
                        <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF Preview</button>
                        <button type="button" className="btn-secondary btn-sm" onClick={() => openSuratModal(item, "edit")}>Edit Preview</button>
                        <button type="button" className="btn-warning btn-sm" onClick={() => setShowPublishKonfirm(item)}>Publish</button>
                      </div>;
                    return <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF</button>;
                  }
                  if (roleView === "kadiv" || roleView === "kepala-upa") {
                    if (!item.suratStatus) return <span className="text-muted text-small">—</span>;
                    if (item.suratStatus === "draft")
                      return <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF Preview</button>;
                    return <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF</button>;
                  }
                  // staf - hanya lihat kalau published
                  if (item.suratStatus === "published")
                    return <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF</button>;
                  return <span className="text-muted text-small">Belum Terbit</span>;
                };

                // Laporan cell
                const laporanCell = () => isDone
                  ? <button type="button" className="btn-link-pdf" onClick={() => openLaporan(item)}>PDF Laporan</button>
                  : <span className="text-muted text-small">Belum Tersedia</span>;

                return (
                  <tr key={item.id}>
                    {/* ─── OPERATOR ─── */}
                    {role === "operator" && (
                      <>
                        <td className="td-wrap"><strong>{item.namaPekerjaan}</strong></td>
                        <td>{item.unitPeminta || <span className="text-muted">—</span>}</td>
                        <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        <td className="text-small">{stafRingkas ? <span title={item.assignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                        <td className="td-center text-small">{item.targetSelesai}</td>
                        <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                        <td className="td-center">{suratTugasCell("operator")}</td>
                        <td className="td-center">{laporanCell()}</td>
                        <td className="td-center">
                          <div className="table-actions table-actions--center">
                            <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {item.suratStatus !== "published" && (
                              <button type="button" className="btn-edit btn-sm" onClick={() => openEdit(item)}>Edit</button>
                            )}
                            {item.assignees.length === 0 && item.suratStatus !== "published" && (
                              <button type="button" className="btn-delete btn-sm" onClick={() => setShowDeleteConfirm(item)}>Hapus</button>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* ─── KEPALA DIVISI ─── */}
                    {role === "kepala-divisi" && (
                      <>
                        <td className="td-wrap"><strong>{item.namaPekerjaan}</strong></td>
                        <td>{item.unitPeminta || <span className="text-muted">—</span>}</td>
                        <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        {/* Konfirmasi Staf: hanya tampil saat assigned */}
                        {isAssigned
                          ? <td className="td-center">{konfirmasiStafBadge()}</td>
                          : <td className="td-center"><span className="text-muted text-small">—</span></td>
                        }
                        <td className="text-small">{stafRingkas ? <span title={item.assignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                        <td className="td-center text-small">{item.targetSelesai}</td>
                        <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                        <td className="td-center">{suratTugasCell("kadiv")}</td>
                        <td className="td-center">{laporanCell()}</td>
                        <td className="td-center">
                          <div className="table-actions table-actions--center">
                            <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {/* Disposisi: hanya kalau belum ada staf & masih assigned */}
                            {item.assignees.length === 0 && isAssigned && (
                              <button type="button" className="btn-edit btn-sm" onClick={() => setShowDisposisi(item)}>Disposisi</button>
                            )}
                            {/* Penugasan Ulang: ada yang ditolak & masih assigned */}
                            {hasRejected && isAssigned && (
                              <button type="button" className="btn-warning btn-sm" onClick={() => setShowDisposisi(item)}>Penugasan Ulang</button>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* ─── KEPALA UPA ─── */}
                    {role === "kepala-upa" && (
                      <>
                        <td className="td-wrap"><strong>{item.namaPekerjaan}</strong></td>
                        <td>{item.unitPeminta || <span className="text-muted">—</span>}</td>
                        <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        <td className="text-small">{divisiRingkas}</td>
                        <td className="text-small">{stafRingkas ? <span title={item.assignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                        <td className="td-center text-small">{item.targetSelesai}</td>
                        <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                        <td className="td-center">{suratTugasCell("kepala-upa")}</td>
                        <td className="td-center">{laporanCell()}</td>
                        <td className="td-center"><button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button></td>
                      </>
                    )}

                    {/* ─── STAF ─── */}
                    {role === "staf" && (
                      <>
                        <td className="td-wrap"><strong>{item.namaPekerjaan}</strong></td>
                        <td>{item.unitPeminta || <span className="text-muted">—</span>}</td>
                        <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                        <td className="td-center">
                          {assignee
                            ? <span className={`badge ${STATUS_BADGE[assignee.statusKonfirmasi] || "badge-blue"}`}>{STATUS_LABEL[assignee.statusKonfirmasi] || assignee.statusKonfirmasi}</span>
                            : <span className="text-muted text-small">-</span>}
                        </td>
                        <td className="td-center text-small">{item.targetSelesai}</td>
                        <td className="td-center">{suratTugasCell("staf")}</td>
                        <td className="td-center">{laporanCell()}</td>
                        <td className="td-center">
                          <div className="table-actions table-actions--center">
                            <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {/* Terima/Tolak: pending & masih assigned */}
                            {assignee?.statusKonfirmasi === "pending" && isAssigned && (
                              <>
                                <button type="button" className="btn-success btn-icon-sm" title="Terima" onClick={() => handleTerima(item)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                <button type="button" className="btn-delete btn-icon-sm" title="Tolak" onClick={() => openTolak(item)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                              </>
                            )}
                            {/* Mulai: accepted + published + assigned */}
                            {assignee?.statusKonfirmasi === "accepted" && item.suratStatus === "published" && isAssigned && (
                              <button type="button" className="btn-edit btn-sm" onClick={() => handleMulai(item)}>Mulai</button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              }) : (
                <tr className="empty-row"><td colSpan={getColspan()}>Belum ada data pekerjaan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL TAMBAH PEKERJAAN ─── */}
      {showTambah && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>+ Tambah Pekerjaan</h2>
            <div className="form-group">
              <label>Nama Pekerjaan *</label>
              <input value={form.namaPekerjaan} onChange={(e) => setForm({ ...form, namaPekerjaan: e.target.value })} placeholder="Nama pekerjaan" />
            </div>
            <div className="form-group">
              <label>Unit Peminta *</label>
              <select value={form.unitPeminta} onChange={(e) => setForm({ ...form, unitPeminta: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitPemintaList.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Lokasi *</label>
              <textarea value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                placeholder="Contoh: Gedung Rektorat Lantai 2, Ruang Sidang" rows={2} />
            </div>
            <div className="form-group">
              <label>Divisi *</label>
              <div className="checkbox-group">
                {divisiList.map((d) => (
                  <label key={d} className="checkbox-item">
                    <input type="checkbox" checked={form.divisi.includes(d)}
                      onChange={(e) => setForm({ ...form, divisi: e.target.checked ? [...form.divisi, d] : form.divisi.filter((x) => x !== d) })} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Target Selesai *</label>
              <input type="date" value={form.targetSelesai} onChange={(e) => setForm({ ...form, targetSelesai: e.target.value })} />
            </div>
            <div className="form-divider">Surat Masuk</div>
            <div className="form-group">
              <label>Nomor Surat Masuk *</label>
              <input value={form.nomorSurat} onChange={(e) => setForm({ ...form, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26/TI/2026" />
            </div>
            <div className="form-group">
              <label>Perihal Surat Masuk *</label>
              <textarea value={form.perihalSurat} onChange={(e) => setForm({ ...form, perihalSurat: e.target.value })}
                placeholder="Perihal surat masuk" rows={2} />
            </div>
            <div className="form-group">
              <label>Dokumen Surat Masuk (PDF) *</label>
              <div className="file-upload-area">
                <input ref={fileInputRef} type="file" accept="application/pdf" id="form-pekerjaan-file" className="hidden-input" onChange={handleFormFile} />
                <label htmlFor="form-pekerjaan-file" className="file-upload-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {formUploadProgress ? "Membaca file..." : form.filePath ? "Ganti File" : "Pilih File PDF"}
                </label>
                {form.filePath && <div className="file-upload-preview"><span>{form.filePath}</span><span className="file-size-label">{fmt(form.fileSize)}</span></div>}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleTambah} disabled={formUploadProgress}>Simpan</button>
              <button type="button" className="btn-secondary" onClick={() => {
                setShowTambah(false);
                setForm({ namaPekerjaan: "", divisi: [], deskripsi: "", targetSelesai: "", lokasi: "", unitPeminta: "", nomorSurat: "", perihalSurat: "", lokasiSurat: "", filePath: "", fileData: "", fileSize: 0 });
              }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL EDIT PEKERJAAN ─── */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Edit Pekerjaan</h2>
            <div className="form-group">
              <label>Nama Pekerjaan *</label>
              <input value={editForm.namaPekerjaan} onChange={(e) => setEditForm({ ...editForm, namaPekerjaan: e.target.value })} placeholder="Nama pekerjaan" />
            </div>
            <div className="form-group">
              <label>Unit Peminta *</label>
              <select value={editForm.unitPeminta} onChange={(e) => setEditForm({ ...editForm, unitPeminta: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitPemintaList.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Lokasi *</label>
              <textarea value={editForm.lokasi} onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>Divisi *</label>
              <div className="checkbox-group">
                {divisiList.map((d) => (
                  <label key={d} className="checkbox-item">
                    <input type="checkbox" checked={editForm.divisi.includes(d)}
                      onChange={(e) => setEditForm({ ...editForm, divisi: e.target.checked ? [...editForm.divisi, d] : editForm.divisi.filter((x) => x !== d) })} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Target Selesai *</label>
              <input type="date" value={editForm.targetSelesai} onChange={(e) => setEditForm({ ...editForm, targetSelesai: e.target.value })} />
            </div>
            <div className="form-divider">Surat Masuk</div>
            <div className="form-group">
              <label>Nomor Surat Masuk *</label>
              <input value={editForm.nomorSurat} onChange={(e) => setEditForm({ ...editForm, nomorSurat: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Perihal Surat Masuk *</label>
              <textarea value={editForm.perihalSurat} onChange={(e) => setEditForm({ ...editForm, perihalSurat: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>Ganti Dokumen Surat Masuk (PDF) <span className="text-muted text-small">— biarkan kosong untuk tetap gunakan file saat ini</span></label>
              <div className="file-upload-area">
                <input ref={editFileInputRef} type="file" accept="application/pdf" id="edit-pekerjaan-file" className="hidden-input" onChange={handleEditFile} />
                <label htmlFor="edit-pekerjaan-file" className="file-upload-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {editUploadProgress ? "Membaca file..." : editForm.filePath ? "Ganti File" : "Pilih File PDF Baru"}
                </label>
                {editForm.filePath && <div className="file-upload-preview"><span>{editForm.filePath}</span><span className="file-size-label">{fmt(editForm.fileSize)}</span></div>}
                {!editForm.filePath && showEdit.suratMasuk && <div className="file-upload-preview"><span>{showEdit.suratMasuk}</span><span className="file-size-label text-muted">File saat ini</span></div>}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleSaveEdit} disabled={editUploadProgress}>Simpan Perubahan</button>
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL KONFIRMASI HAPUS ─── */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Hapus Pekerjaan</h2>
            <p>Apakah kamu yakin ingin menghapus pekerjaan <strong>{showDeleteConfirm.namaPekerjaan}</strong>?</p>
            <p className="text-muted text-small mt-2">Data akan disembunyikan dari sistem. Aksi ini tidak dapat dibatalkan.</p>
            <div className="modal-actions">
              <button type="button" className="btn-delete" onClick={handleConfirmDelete}>Ya, Hapus</button>
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL BUAT / EDIT PREVIEW SURAT TUGAS ─── */}
      {showSuratModal && (
        <div className="modal-overlay">
          <div className="modal-box modal-wide">
            <h2>{showSuratModal.mode === "buat" ? "Buat Preview Surat Tugas" : "Edit Preview Surat Tugas"}</h2>
            <p className="text-muted text-small mb-4">
              Preview akan bisa dilihat Kadiv dan Kepala UPA sebelum di-Publish. PDF Preview memiliki watermark PREVIEW.
            </p>
            {/* Info otomatis dari data pekerjaan */}
            <div className="notice-card notice-blue mb-4 text-small">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td style={{ color: "var(--text-muted)", width: 160, paddingBottom: 4 }}>Unit Peminta</td><td>: {showSuratModal.item.unitPeminta}</td></tr>
                  <tr><td style={{ color: "var(--text-muted)", paddingBottom: 4 }}>Nomor Surat Masuk</td><td>: {showSuratModal.item.nomorSuratMasuk || "—"}</td></tr>
                  <tr><td style={{ color: "var(--text-muted)" }}>Perihal Surat Masuk</td><td>: {showSuratModal.item.perihalSuratMasuk || "—"}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="split-grid">
              <div className="form-group">
                <label>Nomor Surat Tugas *</label>
                <input value={suratForm.nomorSurat} onChange={(e) => setSuratForm({ ...suratForm, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26.TIK/ST.PEK/2026" />
              </div>
              <div className="form-group">
                <label>Tanggal Surat *</label>
                <input type="date" value={suratForm.tanggalSuratKeluar} onChange={(e) => setSuratForm({ ...suratForm, tanggalSuratKeluar: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Tujuan Penugasan *</label>
              <input value={suratForm.tujuan} onChange={(e) => setSuratForm({ ...suratForm, tujuan: e.target.value })} placeholder="Contoh: Melaksanakan perbaikan dan pemasangan jaringan wifi di ruang dosen" />
            </div>
            <div className="form-group">
              <label>Tanggal Pelaksanaan *</label>
              <input type="date" value={suratForm.tanggalPelaksanaan} onChange={(e) => setSuratForm({ ...suratForm, tanggalPelaksanaan: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Lokasi Surat Dibuat *</label>
              <input value={suratForm.lokasiPembuatan} onChange={(e) => setSuratForm({ ...suratForm, lokasiPembuatan: e.target.value })} placeholder="Contoh: Bandar Lampung" />
            </div>
            <div className="notice-card notice-info text-small">
              <div className="notice-card-title">Staf yang masuk surat tugas:</div>
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").map((a, i) => (
                <div key={i}>{i + 1}. {a.nama} — NIP: {a.nip}</div>
              ))}
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").length === 0 && (
                <div className="text-muted">Belum ada staf yang dipilih untuk surat tugas. Lakukan Disposisi terlebih dahulu.</div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-edit" onClick={handleSimpanPreview}>Simpan Preview</button>
              <button type="button" className="btn-secondary" onClick={() => setShowSuratModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── POP-UP KONFIRMASI PUBLISH ─── */}
      {showPublishKonfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Konfirmasi Publish Surat Tugas</h2>
            <p className="text-muted mt-4">Surat tugas akan diterbitkan sebagai dokumen final.</p>
            <div className="notice-card notice-warning mt-4">
              Setelah dipublish, data surat tugas <strong>tidak dapat diedit lagi</strong>.<br/>
              Pastikan nomor surat, tanggal, lokasi, tujuan, dan daftar staf sudah benar.
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-edit" onClick={handlePublish}>Ya, Publish</button>
              <button type="button" className="btn-secondary" onClick={() => setShowPublishKonfirm(null)}>Batal</button>
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
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="text-danger">Tolak Penugasan</h2>
            <p className="mt-4 text-muted">
              Anda menolak penugasan: <strong>{showTolakModal.namaPekerjaan}</strong>
            </p>
            <div className="form-group">
              <label>Alasan Penolakan *</label>
              <textarea value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Contoh: sedang sakit, kecelakaan, bentrok jadwal, dll."
                rows={4} className="no-resize" />
              <div className="micro-text mt-4">
                Alasan ini akan dilihat oleh Kepala Divisi untuk melakukan penugasan ulang.
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-delete" onClick={handleTolak}>Kirim Penolakan</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTolakModal(null)}>Batal</button>
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
  const allStaf = USERS.filter((u: import("@/types").User) => u.role === "staf");

  // ── State: initial disposisi (non-reassign) ──
  const [selectedIds, setSelectedIds] = useState<string[]>([""]);
  const [masukSuratMap, setMasukSuratMap] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<string[]>([""]);
  const [openRows, setOpenRows] = useState<number[]>([]);

  // ── State: reassign mode ──
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

  // IDs already occupied — excluded from all dropdowns
  const occupiedIds = (() => {
    const ids = new Set<string>();
    if (isReassign) {
      pekerjaan.assignees.forEach((a, i) => {
        if (existingActions[i]?.action === "keep") ids.add(a.stafId);
        if (existingActions[i]?.action === "replace" && existingActions[i].replacementId)
          ids.add(existingActions[i].replacementId);
      });
      addRows.forEach(r => { if (r.stafId) ids.add(r.stafId); });
    } else {
      selectedIds.forEach(id => { if (id) ids.add(id); });
    }
    return ids;
  })();

  // ── Initial disposisi handlers ──
  const addRow = () => { setSearchTerms(prev => [...prev, ""]); setSelectedIds(prev => [...prev, ""]); };

  const pickStaf = (rowIdx: number, stafId: string) => {
    const newIds = [...selectedIds]; const oldId = newIds[rowIdx]; newIds[rowIdx] = stafId; setSelectedIds(newIds);
    setMasukSuratMap(prev => { const n = { ...prev }; if (oldId) delete n[oldId]; n[stafId] = true; return n; });
    const newTerms = [...searchTerms]; newTerms[rowIdx] = allStaf.find(s => s.id === stafId)?.nama || ""; setSearchTerms(newTerms);
    setOpenRows(prev => prev.filter(r => r !== rowIdx));
  };

  const removeRow = (rowIdx: number) => {
    const id = selectedIds[rowIdx];
    setSelectedIds(selectedIds.filter((_, i) => i !== rowIdx));
    setSearchTerms(searchTerms.filter((_, i) => i !== rowIdx));
    setOpenRows(prev => prev.filter(r => r !== rowIdx).map(r => r > rowIdx ? r - 1 : r));
    if (id) setMasukSuratMap(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  // ── Reassign add-row handlers ──
  const addNewRow = () => { setAddRows(prev => [...prev, { uid: nextUid, stafId: "", search: "", open: false, masukSurat: true }]); setNextUid(n => n + 1); };
  const removeAddRow = (uid: number) => setAddRows(prev => prev.filter(r => r.uid !== uid));
  const updateAddRow = (uid: number, patch: Partial<AddRow>) => setAddRows(prev => prev.map(r => r.uid === uid ? { ...r, ...patch } : r));

  // ── Save ──
  const handleSave = () => {
    if (!isReassign) {
      const valid = selectedIds.filter(Boolean);
      if (valid.length === 0) return alert("Pilih minimal satu staf.");
      onSave(valid.map(id => {
        const s = allStaf.find(u => u.id === id)!;
        return { stafId: id, nama: s.nama, nip: s.nip, jabatan: s.jabatan, divisi: s.divisi,
          statusPekerjaan: "assigned" as const, statusKonfirmasi: "pending" as const, masukSurat: masukSuratMap[id] !== false };
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
        const s = allStaf.find(u => u.id === ea.replacementId)!;
        final.push({ stafId: s.id, nama: s.nama, nip: s.nip, jabatan: s.jabatan, divisi: s.divisi,
          statusPekerjaan: "assigned" as const, statusKonfirmasi: "pending" as const, masukSurat: ea.replacementMasukSurat });
      }
    });
    addRows.forEach(r => {
      if (!r.stafId) return;
      const s = allStaf.find(u => u.id === r.stafId)!;
      final.push({ stafId: s.id, nama: s.nama, nip: s.nip, jabatan: s.jabatan, divisi: s.divisi,
        statusPekerjaan: "assigned" as const, statusKonfirmasi: "pending" as const, masukSurat: r.masukSurat });
    });
    if (final.length === 0) return alert("Minimal harus ada satu staf.");
    onSave(final);
  };

  const statusBadge = (a: Assignee) => {
    if (a.statusKonfirmasi === "accepted") return <span className="badge badge-green">Diterima</span>;
    if (a.statusKonfirmasi === "rejected") return <span className="badge badge-red">Ditolak</span>;
    return <span className="badge badge-purple">Menunggu</span>;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-wide">
        <h2>{isReassign ? "Penugasan Ulang" : "Disposisi Staf"}</h2>
        <div className="form-group"><label>Pekerjaan</label><input readOnly value={pekerjaan.namaPekerjaan} /></div>

        {/* ── Initial disposisi: pilih staf baru ── */}
        {!isReassign && (
          <div className="form-group">
            <label>Pilih Staf *</label>
            {searchTerms.map((term, rowIdx) => {
              const currentId = selectedIds[rowIdx] || "";
              const isOpen = openRows.includes(rowIdx) || (!!term && !currentId);
              const filtered = allStaf.filter(s =>
                (!occupiedIds.has(s.id) || s.id === currentId) &&
                (!term || s.id === currentId || s.nama.toLowerCase().includes(term.toLowerCase()) || s.nip.includes(term))
              );
              return (
                <div key={rowIdx} className="disposisi-row">
                  <div className="disposisi-search-wrap">
                    <input
                      placeholder="Cari nama atau NIP..."
                      onFocus={() => setOpenRows(prev => prev.includes(rowIdx) ? prev : [...prev, rowIdx])}
                      onBlur={() => setTimeout(() => setOpenRows(prev => prev.filter(r => r !== rowIdx)), 180)}
                      value={currentId ? (allStaf.find(s => s.id === currentId)?.nama || term) : term}
                      onChange={(e) => {
                        const newTerms = [...searchTerms]; newTerms[rowIdx] = e.target.value; setSearchTerms(newTerms);
                        if (currentId) { const newIds = [...selectedIds]; newIds[rowIdx] = ""; setSelectedIds(newIds); setMasukSuratMap(prev => { const n = { ...prev }; delete n[currentId]; return n; }); }
                      }}
                    />
                    {isOpen && filtered.length > 0 && (
                      <div className="disposisi-dropdown">
                        {filtered.map(s => (
                          <div key={s.id} className="disposisi-option" onMouseDown={(e) => { e.preventDefault(); pickStaf(rowIdx, s.id); }}>
                            <div className="font-semibold text-small">{s.nama}</div>
                            <div className="text-muted text-xsmall">{s.nip} · {s.divisi}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {rowIdx > 0 && <button type="button" className="btn-delete btn-sm" onClick={() => removeRow(rowIdx)}>Hapus</button>}
                </div>
              );
            })}
            <button type="button" className="btn-secondary btn-sm mt-2" onClick={addRow}>+ Tambah Staf</button>
          </div>
        )}

        {!isReassign && selectedIds.filter(Boolean).length > 0 && (
          <div className="form-group">
            <label>Ringkasan Staf Terpilih</label>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>No</th><th>Nama</th><th>NIP</th><th>Divisi / Jabatan</th><th className="th-center">Surat Tugas</th><th></th></tr></thead>
                <tbody>
                  {selectedIds.filter(Boolean).map((id, i) => {
                    const s = allStaf.find(u => u.id === id); if (!s) return null;
                    return (
                      <tr key={id}>
                        <td>{i + 1}</td><td><strong>{s.nama}</strong></td>
                        <td className="text-small">{s.nip}</td><td className="text-small">{s.divisi}</td>
                        <td className="td-center"><input type="checkbox" checked={masukSuratMap[id] !== false} onChange={() => setMasukSuratMap(prev => ({ ...prev, [id]: !prev[id] }))} /></td>
                        <td><button type="button" className="btn-delete btn-sm" onClick={() => removeRow(selectedIds.indexOf(id))}>Hapus</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="micro-text mt-2">Centang "Surat Tugas" agar staf muncul di dokumen surat tugas. Staf yang tidak dicentang tetap tercatat di sistem.</div>
          </div>
        )}

        {/* ── Reassign: tabel staf saat ini + tambah baru ── */}
        {isReassign && (
          <div className="form-group">
            <label>Staf Saat Ini</label>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th><th>Nama</th><th>NIP</th><th>Divisi / Jabatan</th>
                    <th className="th-center">Status</th>
                    <th className="th-center">Surat Tugas</th>
                    <th className="th-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pekerjaan.assignees.map((a, i) => {
                    const ea = existingActions[i] ?? { action: "keep", replacementId: "", replacementSearch: "", replacementOpen: false, replacementMasukSurat: true };
                    const isRemoved = ea.action === "remove";
                    return (
                      <Fragment key={a.stafId}>
                        <tr style={isRemoved ? { opacity: 0.4 } : {}}>
                          <td>{i + 1}</td>
                          <td><strong>{a.nama}</strong>{isRemoved && <span className="text-xsmall text-muted"> (dihapus)</span>}</td>
                          <td className="text-small">{a.nip}</td>
                          <td className="text-small">{a.divisi}</td>
                          <td className="td-center">
                            {statusBadge(a)}
                            {a.statusKonfirmasi === "rejected" && a.alasanPenolakan && (
                              <div className="text-xsmall text-muted mt-1">"{a.alasanPenolakan}"</div>
                            )}
                          </td>
                          <td className="td-center">
                            <input type="checkbox" checked={a.masukSurat !== false} disabled />
                          </td>
                          <td className="td-center">
                            <div className="table-actions table-actions--center">
                              {a.statusKonfirmasi === "accepted" && (
                                <span className="text-xsmall text-muted">Terkunci</span>
                              )}
                              {a.statusKonfirmasi === "pending" && ea.action === "keep" && (
                                <button type="button" className="btn-delete btn-sm" onClick={() => updateExisting(i, { action: "remove" })}>Hapus</button>
                              )}
                              {a.statusKonfirmasi === "pending" && ea.action === "remove" && (
                                <button type="button" className="btn-secondary btn-sm" onClick={() => updateExisting(i, { action: "keep" })}>Batalkan</button>
                              )}
                              {a.statusKonfirmasi === "rejected" && ea.action === "keep" && (
                                <>
                                  <button type="button" className="btn-edit btn-sm" onClick={() => updateExisting(i, { action: "replace" })}>Ganti</button>
                                  <button type="button" className="btn-delete btn-sm" onClick={() => updateExisting(i, { action: "remove" })}>Hapus</button>
                                </>
                              )}
                              {a.statusKonfirmasi === "rejected" && ea.action === "remove" && (
                                <button type="button" className="btn-secondary btn-sm" onClick={() => updateExisting(i, { action: "keep" })}>Batalkan</button>
                              )}
                              {ea.action === "replace" && (
                                <button type="button" className="btn-secondary btn-sm" onClick={() => updateExisting(i, { action: "keep", replacementId: "", replacementSearch: "" })}>Batal Ganti</button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {ea.action === "replace" && (
                          <tr>
                            <td></td>
                            <td colSpan={5}>
                              <div className="disposisi-replace-row">
                                <span className="text-small" style={{ whiteSpace: "nowrap", color: "var(--text-muted)" }}>Ganti dengan:</span>
                                <div className="disposisi-search-wrap">
                                  <input
                                    placeholder="Cari nama atau NIP staf pengganti..."
                                    value={ea.replacementId ? (allStaf.find(s => s.id === ea.replacementId)?.nama || ea.replacementSearch) : ea.replacementSearch}
                                    onFocus={() => updateExisting(i, { replacementOpen: true })}
                                    onBlur={() => setTimeout(() => updateExisting(i, { replacementOpen: false }), 180)}
                                    onChange={(e) => updateExisting(i, { replacementSearch: e.target.value, replacementId: "" })}
                                  />
                                  {(ea.replacementOpen || (!!ea.replacementSearch && !ea.replacementId)) && (
                                    <div className="disposisi-dropdown">
                                      {allStaf
                                        .filter(s =>
                                          (!occupiedIds.has(s.id) || s.id === ea.replacementId) &&
                                          (!ea.replacementSearch || s.id === ea.replacementId ||
                                            s.nama.toLowerCase().includes(ea.replacementSearch.toLowerCase()) ||
                                            s.nip.includes(ea.replacementSearch))
                                        )
                                        .map(s => (
                                          <div key={s.id} className="disposisi-option"
                                            onMouseDown={(e) => { e.preventDefault(); updateExisting(i, { replacementId: s.id, replacementSearch: s.nama, replacementOpen: false }); }}>
                                            <div className="font-semibold text-small">{s.nama}</div>
                                            <div className="text-muted text-xsmall">{s.nip} · {s.divisi}</div>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  )}
                                </div>
                                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                  <input type="checkbox" checked={ea.replacementMasukSurat} onChange={() => updateExisting(i, { replacementMasukSurat: !ea.replacementMasukSurat })} />
                                  Surat Tugas
                                </label>
                              </div>
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {/* Baris tambah staf baru */}
                  {addRows.map((r) => {
                    const selStaf = r.stafId ? allStaf.find(s => s.id === r.stafId) : null;
                    const filteredAdd = allStaf.filter(s =>
                      (!occupiedIds.has(s.id) || s.id === r.stafId) &&
                      (!r.search || s.id === r.stafId || s.nama.toLowerCase().includes(r.search.toLowerCase()) || s.nip.includes(r.search))
                    );
                    return (
                      <tr key={r.uid}>
                        <td className="text-muted">—</td>
                        <td colSpan={3}>
                          <div className="disposisi-search-wrap">
                            <input
                              placeholder="Cari nama atau NIP..."
                              value={r.stafId ? (selStaf?.nama || r.search) : r.search}
                              onFocus={() => updateAddRow(r.uid, { open: true })}
                              onBlur={() => setTimeout(() => updateAddRow(r.uid, { open: false }), 180)}
                              onChange={(e) => updateAddRow(r.uid, { search: e.target.value, stafId: "" })}
                            />
                            {(r.open || (!!r.search && !r.stafId)) && filteredAdd.length > 0 && (
                              <div className="disposisi-dropdown">
                                {filteredAdd.map(s => (
                                  <div key={s.id} className="disposisi-option"
                                    onMouseDown={(e) => { e.preventDefault(); updateAddRow(r.uid, { stafId: s.id, search: s.nama, open: false }); }}>
                                    <div className="font-semibold text-small">{s.nama}</div>
                                    <div className="text-muted text-xsmall">{s.nip} · {s.divisi}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="td-center"><span className="badge badge-blue">Baru</span></td>
                        <td className="td-center"><input type="checkbox" checked={r.masukSurat} onChange={() => updateAddRow(r.uid, { masukSurat: !r.masukSurat })} /></td>
                        <td className="td-center"><button type="button" className="btn-delete btn-sm" onClick={() => removeAddRow(r.uid)}>Hapus</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn-secondary btn-sm mt-2" onClick={addNewRow}>+ Tambah Staf</button>
            <div className="micro-text mt-2">Centang "Surat Tugas" agar staf muncul di dokumen surat tugas. Staf yang tidak dicentang tetap tercatat di sistem.</div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={handleSave} disabled={
            isReassign
              ? existingActions.every(ea => ea.action === "remove") && addRows.every(r => !r.stafId)
              : selectedIds.filter(Boolean).length === 0
          }>
            {isReassign ? "Simpan Penugasan Ulang" : "Simpan Disposisi"}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
