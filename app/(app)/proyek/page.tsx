"use client";

import { useEffect, useRef, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import {
  getProyek, deleteProyek, updateProyek, addProyek, seedIfEmpty,
  getProgressByProyekId, addProgress,
  getDokumentasiByRef, addDokumentasi,
  getHasilSurveyByRef,
} from "@/lib/storage";
import { divisiList, unitPemintaList, getKepalaUPA, USERS } from "@/lib/data";
import type { Assignee, Proyek, Progress, SuratDetail } from "@/types";
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

function generateSuratTugasPDFHTML(data: {
  nomorSurat: string; perihal: string; tujuan: string;
  tanggalPelaksanaan: string; lokasiPembuatan: string; tanggalSuratKeluar: string;
  namaProyek: string; lokasi: string; unitPeminta: string;
  assignees: Assignee[]; namaKepalaUPA: string; nipKepalaUPA: string;
  jabatanKepalaUPA: string; isPreview?: boolean;
}): string {
  const stafRows = data.assignees
    .filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected" && a.statusKonfirmasi !== "rejected")
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
  .kop { display: flex; align-items: center; gap: 18px; margin-bottom: 10px; }
  .kop-logo { width: 88px; height: auto; flex-shrink: 0; }
  .kop-kementerian { font-size: 11pt; text-align: center; line-height: 1.4; }
  .kop-univ { font-size: 14pt; font-weight: bold; text-align: center; letter-spacing: 0.5px; margin-top: 2px; }
  .kop-upa  { font-size: 12pt; font-weight: bold; text-align: center; margin-top: 2px; }
  .kop-alamat { font-size: 9pt; text-align: center; margin-top: 3px; color: #333; }
  hr.tebal { border: none; border-top: 2.5px solid #000; margin: 8px 0 2px; }
  hr.tipis { border: none; border-top: 1px solid #000; margin: 0 0 14px; }
  .judul-box { text-align: center; margin: 20px 0 18px; }
  .judul-box .judul { font-size: 13pt; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
  .judul-box .nomor { font-size: 11pt; margin-top: 4px; }
  .narasi { font-size: 11.5pt; text-align: justify; line-height: 1.7; margin-bottom: 14px; }
  .tbl-staf { width: 100%; border-collapse: collapse; margin: 12px 0 14px; font-size: 11pt; }
  .tbl-staf th { border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; background: #f0f0f0; }
  .tbl-staf td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
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
  <div class="kop">
    <img src="/logo-unila.png" alt="Logo Universitas Lampung" class="kop-logo" />
    <div style="flex:1">
      <div class="kop-kementerian">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
      <div class="kop-univ">UNIVERSITAS LAMPUNG</div>
      <div class="kop-upa">UPA. TEKNOLOGI INFORMASI DAN KOMUNIKASI</div>
      <div class="kop-alamat">Jl. Prof. Dr. Sumantri Brojonegoro No.1, Gedong Meneng, Bandar Lampung 35145</div>
      <div class="kop-alamat">e-mail: tik@kpa.ac.id &nbsp;&#9679;&nbsp; laman: http://tik.unila.ac.id</div>
    </div>
  </div>
  <hr class="tebal"/><hr class="tipis"/>
  <div class="judul-box">
    <div class="judul">SURAT TUGAS</div>
    <div class="nomor">Nomor : ${data.nomorSurat}</div>
  </div>
  <p class="narasi">
    Sehubungan dengan surat ${data.unitPeminta} Nomor: ${data.nomorSurat} perihal ${data.perihal}.
    Dengan ini Kepala UPA Teknologi Informasi dan Komunikasi menugaskan kepada:
  </p>
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
  <p class="narasi">
    Untuk Melaksanakan ${data.perihal.toLowerCase()}. pada kegiatan ${data.namaProyek},
    yang akan dilaksanakan pada tanggal ${fmtTgl(data.tanggalPelaksanaan)},
    kegiatan dilaksanakan di ${data.lokasi}.
  </p>
  <p class="narasi">
    Demikian surat tugas ini dikeluarkan untuk dilaksanakan dengan penuh tanggung jawab.
  </p>
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

function generateSuratBase64(data: Parameters<typeof generateSuratTugasPDFHTML>[0]): string {
  return btoa(encodeURIComponent(generateSuratTugasPDFHTML(data)));
}


function openHtmlInTab(base64: string) {
  try {
    const html = decodeURIComponent(atob(base64));
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  } catch (e) { alert("Gagal membuka dokumen: " + (e instanceof Error ? e.message : "Unknown error")); }
}

// ─── Lihat Progress Modal ───
function ProgressModal({
  proyek, role, userId, userName, onClose,
}: {
  proyek: Proyek; role: string; userId?: string; userName?: string; onClose: () => void;
}) {
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [progressForm, setProgressForm] = useState({ keteranganProgress: "", catatan: "", lampiranName: "", lampiranData: "", lampiranSize: 0 });
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fmt = (b?: number) => !b ? "" : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  useEffect(() => {
    setProgressData(getProgressByProyekId(proyek.id));
  }, [proyek.id]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert("Maks 20 MB."); e.target.value = ""; return; }
    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProgressForm(prev => ({ ...prev, lampiranName: file.name, lampiranData: (ev.target?.result as string).split(",")[1], lampiranSize: file.size }));
      setFileLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSimpan = () => {
    if (!progressForm.keteranganProgress) return alert("Keterangan progress wajib diisi.");
    addProgress({
      proyekId: proyek.id,
      keteranganProgress: progressForm.keteranganProgress,
      stafPelapor: userName || "Staf",
      tanggalProgress: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      lampiran: progressForm.lampiranName || null,
      catatan: progressForm.catatan || null,
    });
    setProgressData(getProgressByProyekId(proyek.id));
    setProgressForm({ keteranganProgress: "", catatan: "", lampiranName: "", lampiranData: "", lampiranSize: 0 });
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(false);
  };

  // Staf dapat tambah progress hanya saat in_progress
  const canTambah = role === "staf" && proyek.status === "in_progress" && proyek.assignees.some(a => a.stafId === userId);

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-wide">
        <div className="form-row" style={{ alignItems: "flex-start" }}>
          <div>
            <h2>Progress Proyek</h2>
            <p className="text-muted text-small mt-1">{proyek.namaProyek}</p>
          </div>
          {canTambah && !showForm && (
            <button type="button" onClick={() => setShowForm(true)}>Tambah Progress</button>
          )}
        </div>

        <div className="info-box mb-4">
          <table><tbody>
            <tr><td className="info-label">Unit Peminta</td><td>: {proyek.unitPeminta || "-"}</td></tr>
            <tr><td className="info-label">Lokasi</td><td>: {proyek.lokasi || "-"}</td></tr>
            <tr><td className="info-label">Target Selesai</td><td>: {proyek.targetSelesai}</td></tr>
            <tr><td className="info-label">Status</td><td>: <span className={`badge ${STATUS_BADGE[proyek.status]}`}>{STATUS_LABEL[proyek.status]}</span></td></tr>
            <tr><td className="info-label">Staf</td><td>: {proyek.assignees.map(a => a.nama).join(", ") || proyek.staf || "-"}</td></tr>
          </tbody></table>
        </div>

        {showForm && (
          <div className="progress-form-inline">
            <div className="form-group">
              <label>Keterangan Progress *</label>
              <input value={progressForm.keteranganProgress} onChange={(e) => setProgressForm({ ...progressForm, keteranganProgress: e.target.value })} placeholder="Keterangan progress" />
            </div>
            <div className="form-group">
              <label>Upload Lampiran (Foto/Dokumen)</label>
              <div className="file-upload-area">
                <input ref={fileRef} type="file" id="progress-file" className="hidden-input" onChange={handleFile} />
                <label htmlFor="progress-file" className="file-upload-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  {fileLoading ? "Membaca file..." : progressForm.lampiranName ? "Ganti File" : "Pilih File"}
                </label>
                {progressForm.lampiranName && (
                  <div className="file-upload-preview">
                    <span> {progressForm.lampiranName}</span>
                    <span className="file-size-label">{fmt(progressForm.lampiranSize)}</span>
                    <button type="button" className="text-button" onClick={() => { setProgressForm({ ...progressForm, lampiranName: "", lampiranData: "", lampiranSize: 0 }); if (fileRef.current) fileRef.current.value = ""; }}></button>
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Catatan (opsional)</label>
              <input value={progressForm.catatan} onChange={(e) => setProgressForm({ ...progressForm, catatan: e.target.value })} placeholder="Catatan tambahan" />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleSimpan} disabled={fileLoading}>Simpan Progress</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setProgressForm({ keteranganProgress: "", catatan: "", lampiranName: "", lampiranData: "", lampiranSize: 0 }); if (fileRef.current) fileRef.current.value = ""; }}>Batal</button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table className="table">
            <thead><tr><th className="th-center">No</th><th className="th-center">Tanggal</th><th className="th-center">Pengunggah</th><th className="th-center">Keterangan</th><th className="th-center">Lampiran</th></tr></thead>
            <tbody>
              {progressData.length > 0 ? progressData.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td className="text-small">{p.tanggalProgress}</td>
                  <td className="text-small">{p.stafPelapor}</td>
                  <td>{p.keteranganProgress}</td>
                  <td>{p.lampiran ? <span className="text-primary text-small"> {p.lampiran}</span> : <span className="text-muted text-small">-</span>}</td>
                </tr>
              )) : (
                <tr className="empty-row"><td colSpan={5}>Belum ada progress.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ringkasan Modal ───
function RingkasanModal({ item, onClose }: { item: Proyek; onClose: () => void }) {
  const openSurat = () => {
    if (item.suratTugasData) openHtmlInTab(item.suratTugasData);
    else alert("Surat tugas belum tersedia.");
  };

  const handleOpenLaporan = () => {
    const dokumentasiList = getDokumentasiByRef(item.id).filter(d => !d.judul.startsWith("Surat Masuk:"));
    const surveyList = getHasilSurveyByRef(item.id);
    const progressList = getProgressByProyekId(item.id);
    openLaporanInTab({ item, jenis: "PROYEK", progressList, dokumentasiList, surveyList });
  };

  const isDone = item.status === "done";
  const isReviewOrDone = item.status === "review" || item.status === "done";

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-wide">
        <h2>Ringkasan Proyek</h2>
        <div className="info-box">
          <div className="info-box-title">Data Proyek</div>
          <table><tbody>
            <tr><td className="info-label">Nama</td><td>: <strong>{item.namaProyek}</strong></td></tr>
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
              {item.suratMasuk && <tr><td className="info-label">PDF Surat Masuk</td><td>: <span className="text-muted text-small"> {item.suratMasuk}</span></td></tr>}
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
            {item.suratTugasData && (
              <button type="button" className="btn-secondary btn-sm mt-3" onClick={openSurat}>
                {item.suratStatus === "published" ? " Buka PDF Surat Tugas" : " Buka PDF Preview"}
              </button>
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
            <div className="text-small mb-2">Proyek telah selesai dan laporan bisa diexport.</div>
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

export default function ProyekPage() {
  const { role, user } = useRole();
  const [data, setData] = useState<Proyek[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showTambah, setShowTambah] = useState(false);
  const [showEdit, setShowEdit] = useState<Proyek | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Proyek | null>(null);
  const [showDisposisi, setShowDisposisi] = useState<Proyek | null>(null);
  const [showProgress, setShowProgress] = useState<Proyek | null>(null);
  const [showSuratModal, setShowSuratModal] = useState<{ item: Proyek; mode: "buat" | "edit" } | null>(null);
  const [showPublishKonfirm, setShowPublishKonfirm] = useState<Proyek | null>(null);
  const [showTolakModal, setShowTolakModal] = useState<Proyek | null>(null);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [showRingkasan, setShowRingkasan] = useState<Proyek | null>(null);

  const [form, setForm] = useState({
    namaProyek: "", divisi: [] as string[], deskripsi: "", targetSelesai: "",
    lokasi: "", unitPeminta: "", nomorSurat: "", perihalSurat: "",
    filePath: "", fileData: "", fileSize: 0,
  });
  const [editForm, setEditForm] = useState({
    namaProyek: "", divisi: [] as string[], deskripsi: "", targetSelesai: "",
    lokasi: "", unitPeminta: "", nomorSurat: "", perihalSurat: "",
    filePath: "", fileData: "", fileSize: 0,
  });
  const [suratForm, setSuratForm] = useState<SuratDetail>({
    nomorSurat: "", perihal: "", tujuan: "",
    tanggalPelaksanaan: "", lokasiPembuatan: "", tanggalSuratKeluar: "",
  });

  const [formUploadProgress, setFormUploadProgress] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const load = () => { seedIfEmpty(); setData(getProyek()); };
  useEffect(() => { load(); }, []);

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
        ? data.filter((d) => d.divisi.includes(user?.divisi || ""))
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
    setFormUploadProgress(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, filePath: file.name, fileData: (ev.target?.result as string).split(",")[1], fileSize: file.size }));
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
      setEditForm(prev => ({ ...prev, filePath: file.name, fileData: (ev.target?.result as string).split(",")[1], fileSize: file.size }));
      setEditUploadProgress(false);
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (item: Proyek) => {
    setEditForm({
      namaProyek: item.namaProyek,
      divisi: item.divisi,
      deskripsi: item.deskripsi || "",
      targetSelesai: item.targetSelesai,
      lokasi: item.lokasi,
      unitPeminta: item.unitPeminta,
      nomorSurat: item.nomorSuratMasuk || "",
      perihalSurat: item.perihalSuratMasuk || "",
      filePath: "", fileData: "", fileSize: 0,
    });
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setShowEdit(item);
  };

  const handleSaveEdit = () => {
    if (!showEdit) return;
    if (!editForm.namaProyek || !editForm.targetSelesai) return alert("Lengkapi field wajib.");
    if (!editForm.unitPeminta) return alert("Pilih Unit Peminta.");
    if (!editForm.lokasi) return alert("Isi Lokasi proyek.");
    if (!editForm.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!editForm.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    const payload: Partial<Proyek> = {
      namaProyek: editForm.namaProyek,
      divisi: editForm.divisi,
      deskripsi: editForm.deskripsi || null,
      targetSelesai: editForm.targetSelesai,
      lokasi: editForm.lokasi,
      unitPeminta: editForm.unitPeminta,
      nomorSuratMasuk: editForm.nomorSurat,
      perihalSuratMasuk: editForm.perihalSurat,
    };
    if (editForm.fileData) {
      payload.suratMasuk = editForm.filePath;
      payload.suratMasukData = editForm.fileData;
    }
    updateProyek(showEdit.id, payload);
    setShowEdit(null);
    load();
  };

  const handleConfirmDelete = () => {
    if (!showDeleteConfirm) return;
    deleteProyek(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    load();
  };

  const handleTambah = () => {
    if (!form.namaProyek || !form.targetSelesai) return alert("Lengkapi field wajib.");
    if (!form.unitPeminta) return alert("Pilih Unit Peminta.");
    if (!form.lokasi) return alert("Isi Lokasi proyek.");
    if (!form.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!form.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    if (!form.fileData) return alert("Dokumen surat masuk (PDF) wajib diunggah.");
    addProyek({
      namaProyek: form.namaProyek, status: "assigned", statusKonfirmasi: "accepted",
      suratMasuk: form.filePath, suratMasukData: form.fileData,
      nomorSuratMasuk: form.nomorSurat, perihalSuratMasuk: form.perihalSurat,
      divisi: form.divisi, lokasi: form.lokasi, unitPeminta: form.unitPeminta,
      staf: null, stafId: null, assignees: [], deskripsi: form.deskripsi || null,
      targetSelesai: form.targetSelesai, suratTugas: null, suratStatus: undefined, catatan: null,
    });
    setShowTambah(false);
    setForm({ namaProyek: "", divisi: [], deskripsi: "", targetSelesai: "", lokasi: "", unitPeminta: "", nomorSurat: "", perihalSurat: "", filePath: "", fileData: "", fileSize: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  };

  const handleDisposisi = (proyek: Proyek, stafList: Array<{ stafId: string; nama: string; nip: string; jabatan: string; divisi: string; masukSurat: boolean }>) => {
    // Pertahankan HANYA staf yang sudah accepted, hapus yang rejected/pending
    const acceptedOld = proyek.assignees.filter(a => a.statusKonfirmasi === "accepted");
    // Pastikan tidak ada duplikasi - filter staf baru yang stafId-nya sudah ada di accepted
    const acceptedIds = new Set(acceptedOld.map(a => a.stafId));
    const newAssignees: Assignee[] = stafList
      .filter(s => !acceptedIds.has(s.stafId))
      .map(s => ({
        stafId: s.stafId, nama: s.nama, nip: s.nip, jabatan: s.jabatan,
        divisi: s.divisi, statusPekerjaan: "assigned" as const, statusKonfirmasi: "pending" as const, masukSurat: s.masukSurat,
      }));
    const mergedAssignees = [...acceptedOld, ...newAssignees];
    const firstNew = newAssignees[0] || acceptedOld[0];
    updateProyek(proyek.id, {
      staf: mergedAssignees.map(s => s.nama).join(", "),
      stafId: firstNew?.stafId || null,
      nip: firstNew?.nip || "",
      jabatan: firstNew?.jabatan || "",
      status: "assigned",
      statusKonfirmasi: "pending",
      suratTugas: null, suratStatus: undefined,
      assignees: mergedAssignees,
    });
    setShowDisposisi(null); load();
  };

  const handleTerima = (item: Proyek) => {
    const updated = item.assignees.map(a => a.stafId === user?.id ? { ...a, statusKonfirmasi: "accepted" as const } : a);
    const allAccepted = updated.every(a => a.statusKonfirmasi === "accepted");
    updateProyek(item.id, { assignees: updated, statusKonfirmasi: allAccepted ? "accepted" : "pending" });
    load();
  };

  const handleTolak = () => {
    if (!alasanTolak.trim()) return alert("Wajib mengisi alasan penolakan.");
    const updated = showTolakModal!.assignees.map(a =>
      a.stafId === user?.id ? { ...a, statusKonfirmasi: "rejected" as const, alasanPenolakan: alasanTolak } : a
    );
    updateProyek(showTolakModal!.id, { assignees: updated, statusKonfirmasi: "rejected", catatan: alasanTolak });
    setShowTolakModal(null); setAlasanTolak(""); load();
  };

  const handleMulai = (item: Proyek) => { updateProyek(item.id, { status: "in_progress" }); load(); };

  const openSuratModal = (item: Proyek, mode: "buat" | "edit") => {
    const defaultDetail: SuratDetail = {
      nomorSurat: item.suratDetail?.nomorSurat ?? "",
      perihal: item.suratDetail?.perihal ?? (item as any).perihalSuratMasuk ?? "",
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
    const previewBase64 = generateSuratBase64({
      ...suratForm,
      namaProyek: item.namaProyek, lokasi: item.lokasi || "-", unitPeminta: item.unitPeminta || "-",
      assignees: item.assignees,
      namaKepalaUPA: kepala?.nama || "-", nipKepalaUPA: kepala?.nip || "-", jabatanKepalaUPA: kepala?.jabatan || "-",
      isPreview: true,
    });
    updateProyek(item.id, { suratStatus: "draft", suratDetail: suratForm, suratTugasData: previewBase64, suratTugas: `ST-PREVIEW-${item.id}.pdf` });
    setShowSuratModal(null); load();
  };

  const handlePublish = () => {
    const item = showPublishKonfirm!;
    const kepala = getKepalaUPA();
    const finalBase64 = generateSuratBase64({
      ...(item.suratDetail ?? { nomorSurat: "-", perihal: "-", tujuan: "-", tanggalPelaksanaan: "-", lokasiPembuatan: "Bandar Lampung", tanggalSuratKeluar: "-" }),
      namaProyek: item.namaProyek, lokasi: item.lokasi || "-", unitPeminta: item.unitPeminta || "-",
      assignees: item.assignees,
      namaKepalaUPA: kepala?.nama || "-", nipKepalaUPA: kepala?.nip || "-", jabatanKepalaUPA: kepala?.jabatan || "-",
      isPreview: false,
    });
    updateProyek(item.id, { suratTugas: `ST-${item.id}.pdf`, suratTugasData: finalBase64, suratStatus: "published" });
    setShowPublishKonfirm(null); load();
  };

  const openSuratPDF = (item: Proyek) => {
    if (!item.suratTugasData) { alert("Surat tugas belum tersedia."); return; }
    openHtmlInTab(item.suratTugasData);
  };

  // ─── Buka PDF Laporan ───
  const openLaporan = (item: Proyek) => {
    if (item.status !== "done") return;
    const dokumentasiList = getDokumentasiByRef(item.id).filter(d => !d.judul.startsWith("Surat Masuk:"));
    const surveyList = getHasilSurveyByRef(item.id);
    const progressList = getProgressByProyekId(item.id);
    openLaporanInTab({ item, jenis: "PROYEK", progressList, dokumentasiList, surveyList });
  };

  // ─── Buka PDF Surat Masuk ───
  const openSuratMasuk = (item: Proyek) => {
    if (!item.suratMasuk) return;
    if (item.suratMasukData) {
      try {
        const byteChars = atob(item.suratMasukData);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: "application/pdf" });
        window.open(URL.createObjectURL(blob), "_blank");
      } catch { alert(`File: ${item.suratMasuk}`); }
    } else {
      alert(`File surat masuk: ${item.suratMasuk}`);
    }
  };

  // ─── Render header berdasarkan role ───
  const renderHeader = () => {
    if (role === "operator") {
      return (
        <tr>
          <th className="col-nama">Nama Proyek</th>
          <th className="col-unit">Unit Peminta</th>
          <th className="th-center col-status">Status</th>
          <th className="col-staf">Staf</th>
          <th className="th-center col-target">Target</th>
          <th className="th-center col-surat">Surat Masuk</th>
          <th className="th-center col-surat">Surat Tugas</th>
          <th className="th-center col-progress">Progress</th>
          <th className="th-center col-laporan">Laporan</th>
          <th className="th-center col-aksi">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-divisi") {
      return (
        <tr>
          <th className="col-nama">Nama Proyek</th>
          <th className="col-unit">Unit Peminta</th>
          <th className="th-center col-status">Status</th>
          <th className="th-center col-konfirmasi">Konfirmasi Staf</th>
          <th className="col-staf">Staf</th>
          <th className="th-center col-target">Target</th>
          <th className="th-center col-surat">Surat Masuk</th>
          <th className="th-center col-surat">Surat Tugas</th>
          <th className="th-center col-progress">Progress</th>
          <th className="th-center col-laporan">Laporan</th>
          <th className="th-center col-aksi">Aksi</th>
        </tr>
      );
    }
    if (role === "kepala-upa") {
      return (
        <tr>
          <th className="col-nama">Nama Proyek</th>
          <th className="col-unit">Unit Peminta</th>
          <th className="th-center col-status">Status</th>
          <th className="col-divisi">Divisi</th>
          <th className="col-staf">Staf</th>
          <th className="th-center col-target">Target</th>
          <th className="th-center col-surat">Surat Masuk</th>
          <th className="th-center col-surat">Surat Tugas</th>
          <th className="th-center col-progress">Progress</th>
          <th className="th-center col-laporan">Laporan</th>
          <th className="th-center col-aksi">Aksi</th>
        </tr>
      );
    }
    // staf
    return (
      <tr>
        <th className="col-nama">Nama Proyek</th>
        <th className="col-unit">Unit Peminta</th>
        <th className="th-center col-status">Status Proyek</th>
        <th className="th-center col-status">Status Saya</th>
        <th className="th-center col-target">Target</th>
        <th className="th-center col-surat">Surat Tugas</th>
        <th className="th-center col-progress">Progress</th>
        <th className="th-center col-laporan">Laporan</th>
        <th className="th-center col-aksi">Aksi</th>
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
    <div>
      <div className="page-header">
        <h1 className="title">Manajemen Proyek</h1>
        <p className="subtitle">Kelola proyek dengan sistem konfirmasi dua arah, progress, dan surat tugas terverifikasi.</p>
      </div>

      <div className="search-row">
        <input type="text" className="search-box"
          placeholder="Cari proyek, lokasi, unit, divisi, atau staf..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {role === "operator" && (
          <button type="button" onClick={() => setShowTambah(true)}>+ Tambah Proyek</button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
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
                  if (total === 0) return <span className="text-muted text-small">—</span>;
                  const rejected = item.assignees.filter(a => a.statusKonfirmasi === "rejected").length;
                  const accepted = item.assignees.filter(a => a.statusKonfirmasi === "accepted").length;
                  if (rejected > 0) return <span className="badge badge-red">{rejected} Ditolak</span>;
                  if (accepted === total) return <span className="badge badge-green">Semua Diterima</span>;
                  return <span className="badge badge-purple">Menunggu</span>;
                };
                const divisiRingkas = item.divisi.length > 0 ? item.divisi.join(", ") : <span className="text-muted">—</span>;

                const suratCell = (roleView: string) => {
                  if (roleView === "operator") {
                    if (!item.suratStatus && canBuatPreview) return <button type="button" className="btn-secondary btn-sm" onClick={() => openSuratModal(item, "buat")}>Buat Preview</button>;
                    if (!item.suratStatus) return <span className="text-muted text-small">Belum Ada</span>;
                    if (item.suratStatus === "draft") return <div className="cell-action-group">
                      <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF Preview</button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => openSuratModal(item, "edit")}>Edit Preview</button>
                      <button type="button" className="btn-warning btn-sm" onClick={() => setShowPublishKonfirm(item)}>Publish</button>
                    </div>;
                    return <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF</button>;
                  }
                  if (!item.suratStatus) return <span className="text-muted text-small">—</span>;
                  if (item.suratStatus === "draft") return <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF Preview</button>;
                  return <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF</button>;
                };

                const progressCell = (canAdd: boolean) => {
                  if (!isProgressVisible) return <span className="text-muted text-small">—</span>;
                  return <button type="button" className="btn-secondary btn-sm" onClick={() => setShowProgress(item)}>Lihat Progress</button>;
                };

                const laporanCell = () => isDone
                  ? <button type="button" className="btn-link-pdf" onClick={() => openLaporan(item)}>PDF Laporan</button>
                  : <span className="text-muted text-small">Belum Tersedia</span>;

                return (
                  <tr key={item.id}>
                    {/* ─── OPERATOR ─── */}
                    {role === "operator" && (<>
                      <td className="td-wrap"><strong>{item.namaProyek}</strong>{item.deskripsi && <div className="text-muted text-small">{item.deskripsi}</div>}</td>
                      <td className="text-small">{item.unitPeminta || <span className="text-muted">-</span>}</td>
                      <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      <td className="text-small">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                      <td className="td-center text-small">{item.targetSelesai}</td>
                      <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                      <td className="td-center">{suratCell("operator")}</td>
                      <td className="td-center">{progressCell(false)}</td>
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
                    </>)}

                    {/* ─── KEPALA DIVISI ─── */}
                    {role === "kepala-divisi" && (<>
                      <td className="td-wrap"><strong>{item.namaProyek}</strong>{item.deskripsi && <div className="text-muted text-small">{item.deskripsi}</div>}</td>
                      <td className="text-small">{item.unitPeminta || <span className="text-muted">-</span>}</td>
                      <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      {isAssigned ? <td className="td-center">{konfirmasiStafBadge()}</td> : <td className="td-center"><span className="text-muted text-small">—</span></td>}
                      <td className="text-small">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                      <td className="td-center text-small">{item.targetSelesai}</td>
                      <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                      <td className="td-center">{suratCell("kadiv")}</td>
                      <td className="td-center">{progressCell(false)}</td>
                      <td className="td-center">{laporanCell()}</td>
                      <td className="td-center">
                        <div className="table-actions table-actions--center">
                          <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                          {item.assignees.length === 0 && isAssigned && <button type="button" className="btn-edit btn-sm" onClick={() => setShowDisposisi(item)}>Disposisi</button>}
                          {hasRejected && isAssigned && <button type="button" className="btn-warning btn-sm" onClick={() => setShowDisposisi(item)}>Penugasan Ulang</button>}
                        </div>
                      </td>
                    </>)}

                    {/* ─── KEPALA UPA ─── */}
                    {role === "kepala-upa" && (<>
                      <td className="td-wrap"><strong>{item.namaProyek}</strong>{item.deskripsi && <div className="text-muted text-small">{item.deskripsi}</div>}</td>
                      <td className="text-small">{item.unitPeminta || <span className="text-muted">-</span>}</td>
                      <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      <td className="text-small">{divisiRingkas}</td>
                      <td className="text-small">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                      <td className="td-center text-small">{item.targetSelesai}</td>
                      <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                      <td className="td-center">{suratCell("kepala-upa")}</td>
                      <td className="td-center">{progressCell(false)}</td>
                      <td className="td-center">{laporanCell()}</td>
                      <td className="td-center"><button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button></td>
                    </>)}

                    {/* ─── STAF ─── */}
                    {role === "staf" && (<>
                      <td className="td-wrap"><strong>{item.namaProyek}</strong>{item.deskripsi && <div className="text-muted text-small">{item.deskripsi}</div>}</td>
                      <td className="text-small">{item.unitPeminta || <span className="text-muted">-</span>}</td>
                      <td className="td-center"><span className={`badge ${STATUS_BADGE[item.status] || "badge-blue"}`}>{STATUS_LABEL[item.status] || item.status}</span></td>
                      <td className="td-center">
                        {myAssignee ? <span className={`badge ${STATUS_BADGE[myAssignee.statusKonfirmasi] || "badge-blue"}`}>{STATUS_LABEL[myAssignee.statusKonfirmasi] || myAssignee.statusKonfirmasi}</span> : <span className="text-muted text-small">-</span>}
                      </td>
                      <td className="td-center text-small">{item.targetSelesai}</td>
                      <td className="td-center">
                        {item.suratStatus === "published" ? <button type="button" className="btn-link-pdf" onClick={() => openSuratPDF(item)}>PDF</button> : <span className="text-muted text-small">Belum Terbit</span>}
                      </td>
                      {/* Progress staf: in_progress = Lihat (Tambah ada di modal), review/done = Lihat, assigned = - */}
                      <td className="td-center">
                        {isProgressVisible
                          ? <button type="button" className="btn-secondary btn-sm" onClick={() => setShowProgress(item)}>Lihat Progress</button>
                          : <span className="text-muted text-small">—</span>}
                      </td>
                      <td className="td-center">{laporanCell()}</td>
                      <td className="td-center">
                        <div className="table-actions table-actions--center">
                          <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                          {myAssignee?.statusKonfirmasi === "pending" && isAssigned && (<>
                            <button type="button" className="btn-success btn-icon-sm" title="Terima" onClick={() => handleTerima(item)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                            <button type="button" className="btn-delete btn-icon-sm" title="Tolak" onClick={() => { setAlasanTolak(""); setShowTolakModal(item); }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                          </>)}
                          {myAssignee?.statusKonfirmasi === "accepted" && item.suratStatus === "published" && isAssigned && (
                            <button type="button" className="btn-edit btn-sm" onClick={() => handleMulai(item)}>Mulai</button>
                          )}
                        </div>
                      </td>
                    </>)}
                  </tr>
                );
              }) : (
                <tr className="empty-row"><td colSpan={getColspan()}>Belum ada data proyek.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL TAMBAH PROYEK ─── */}
      {showTambah && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>+ Tambah Proyek</h2>
            <div className="form-group"><label>Nama Proyek *</label><input value={form.namaProyek} onChange={(e) => setForm({ ...form, namaProyek: e.target.value })} placeholder="Nama proyek" /></div>
            <div className="form-group">
              <label>Unit Peminta *</label>
              <select value={form.unitPeminta} onChange={(e) => setForm({ ...form, unitPeminta: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitPemintaList.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Lokasi *</label>
              <textarea value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Contoh: Gedung UPA TIK Lantai 3" rows={2} />
            </div>
            <div className="form-group">
              <label>Divisi</label>
              <div className="checkbox-group">
                {divisiList.map(d => (
                  <label key={d} className="checkbox-item">
                    <input type="checkbox" checked={form.divisi.includes(d)} onChange={(e) => setForm({ ...form, divisi: e.target.checked ? [...form.divisi, d] : form.divisi.filter(x => x !== d) })} />{d}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group"><label>Deskripsi</label><textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi (opsional)" /></div>
            <div className="form-group"><label>Target Selesai *</label><input type="date" value={form.targetSelesai} onChange={(e) => setForm({ ...form, targetSelesai: e.target.value })} /></div>
            <div className="form-divider">Surat Masuk</div>
            <div className="form-group"><label>Nomor Surat Masuk *</label><input value={form.nomorSurat} onChange={(e) => setForm({ ...form, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26/TI/2026" /></div>
            <div className="form-group">
              <label>Perihal Surat Masuk *</label>
              <textarea value={form.perihalSurat} onChange={(e) => setForm({ ...form, perihalSurat: e.target.value })} placeholder="Perihal surat masuk" rows={2} />
            </div>
            <div className="form-group">
              <label>Dokumen Surat Masuk (PDF) *</label>
              <div className="file-upload-area">
                <input ref={fileInputRef} type="file" accept="application/pdf" id="form-proyek-file" className="hidden-input" onChange={handleFormFile} />
                <label htmlFor="form-proyek-file" className="file-upload-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  {formUploadProgress ? "Membaca file..." : form.filePath ? "Ganti File" : "Pilih File PDF"}
                </label>
                {form.filePath && <div className="file-upload-preview"><span> {form.filePath}</span><span className="file-size-label">{fmt(form.fileSize)}</span></div>}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleTambah} disabled={formUploadProgress}>Simpan</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowTambah(false); setForm({ namaProyek: "", divisi: [], deskripsi: "", targetSelesai: "", lokasi: "", unitPeminta: "", nomorSurat: "", perihalSurat: "", filePath: "", fileData: "", fileSize: 0 }); }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL EDIT PROYEK ─── */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Edit Proyek</h2>
            <div className="form-group"><label>Nama Proyek *</label><input value={editForm.namaProyek} onChange={(e) => setEditForm({ ...editForm, namaProyek: e.target.value })} /></div>
            <div className="form-group">
              <label>Unit Peminta *</label>
              <select value={editForm.unitPeminta} onChange={(e) => setEditForm({ ...editForm, unitPeminta: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitPemintaList.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Lokasi *</label><textarea value={editForm.lokasi} onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })} rows={2} /></div>
            <div className="form-group">
              <label>Divisi</label>
              <div className="checkbox-group">
                {divisiList.map(d => (
                  <label key={d} className="checkbox-item">
                    <input type="checkbox" checked={editForm.divisi.includes(d)} onChange={(e) => setEditForm({ ...editForm, divisi: e.target.checked ? [...editForm.divisi, d] : editForm.divisi.filter(x => x !== d) })} />{d}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group"><label>Deskripsi</label><textarea value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })} /></div>
            <div className="form-group"><label>Target Selesai *</label><input type="date" value={editForm.targetSelesai} onChange={(e) => setEditForm({ ...editForm, targetSelesai: e.target.value })} /></div>
            <div className="form-divider">Surat Masuk</div>
            <div className="form-group"><label>Nomor Surat Masuk *</label><input value={editForm.nomorSurat} onChange={(e) => setEditForm({ ...editForm, nomorSurat: e.target.value })} /></div>
            <div className="form-group"><label>Perihal Surat Masuk *</label><textarea value={editForm.perihalSurat} onChange={(e) => setEditForm({ ...editForm, perihalSurat: e.target.value })} rows={2} /></div>
            <div className="form-group">
              <label>Ganti Dokumen Surat Masuk (PDF) <span className="text-muted text-small">— biarkan kosong untuk tetap gunakan file saat ini</span></label>
              <div className="file-upload-area">
                <input ref={editFileInputRef} type="file" accept="application/pdf" id="edit-proyek-file" className="hidden-input" onChange={handleEditFile} />
                <label htmlFor="edit-proyek-file" className="file-upload-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
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
            <h2>Hapus Proyek</h2>
            <p>Apakah kamu yakin ingin menghapus proyek <strong>{showDeleteConfirm.namaProyek}</strong>?</p>
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
            <p className="text-muted text-small mb-4">PDF Preview memiliki watermark PREVIEW dan bisa dilihat Kadiv & Kepala UPA sebelum Publish.</p>
            {/* Info otomatis dari data proyek */}
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
                <input value={suratForm.nomorSurat} onChange={(e) => setSuratForm({ ...suratForm, nomorSurat: e.target.value })} placeholder="Contoh: 001/UN26.TIK/ST.PRO/2026" />
              </div>
              <div className="form-group">
                <label>Tanggal Surat *</label>
                <input type="date" value={suratForm.tanggalSuratKeluar} onChange={(e) => setSuratForm({ ...suratForm, tanggalSuratKeluar: e.target.value })} />
              </div>
            </div>
            <div className="form-group"><label>Tujuan Penugasan *</label><input value={suratForm.tujuan} onChange={(e) => setSuratForm({ ...suratForm, tujuan: e.target.value })} placeholder="Contoh: Melaksanakan pengembangan dan implementasi sistem informasi akademik terpadu" /></div>
            <div className="form-group"><label>Tanggal Pelaksanaan *</label><input type="date" value={suratForm.tanggalPelaksanaan} onChange={(e) => setSuratForm({ ...suratForm, tanggalPelaksanaan: e.target.value })} /></div>
            <div className="form-group"><label>Lokasi Surat Dibuat *</label><input value={suratForm.lokasiPembuatan} onChange={(e) => setSuratForm({ ...suratForm, lokasiPembuatan: e.target.value })} placeholder="Contoh: Bandar Lampung" /></div>
            <div className="notice-card notice-info text-small">
              <div className="notice-card-title">Staf yang masuk surat tugas:</div>
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").map((a, i) => (
                <div key={i}>{i + 1}. {a.nama} — NIP: {a.nip}</div>
              ))}
              {showSuratModal.item.assignees.filter(a => a.masukSurat !== false && a.statusKonfirmasi !== "rejected").length === 0 && (
                <div className="text-muted">Belum ada staf. Lakukan Disposisi terlebih dahulu.</div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-edit" onClick={handleSimpanPreview}>Simpan Preview</button>
              <button type="button" className="btn-secondary" onClick={() => setShowSuratModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── KONFIRMASI PUBLISH ─── */}
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
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="text-danger">Tolak Penugasan</h2>
            <p className="mt-4 text-muted">Anda menolak penugasan proyek: <strong>{showTolakModal.namaProyek}</strong></p>
            <div className="form-group">
              <label>Alasan Penolakan *</label>
              <textarea value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Contoh: sedang sakit, bentrok jadwal, dll." rows={4} className="no-resize" />
              <div className="micro-text mt-4">Alasan ini akan dilihat Kepala Divisi untuk penugasan ulang.</div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-delete" onClick={handleTolak}>Kirim Penolakan</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTolakModal(null)}>Batal</button>
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
  const allStaf = USERS.filter((u: import("@/types").User) => u.role === "staf");
  const [selectedMap, setSelectedMap] = useState<Record<string, { masukSurat: boolean }>>({});
  const [search, setSearch] = useState("");

  const handleSave = () => {
    const valid = Object.keys(selectedMap);
    if (!valid.length) return alert("Pilih minimal satu staf.");
    onSave(valid.map(id => {
      const s = allStaf.find((u: any) => u.id === id)!;
      return { stafId: id, nama: s.nama, nip: s.nip, jabatan: s.jabatan, divisi: s.divisi, masukSurat: selectedMap[id].masukSurat };
    }));
  };

  const avatarInitials = (nama: string) =>
    nama.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();

  const q = search.toLowerCase();
  const filteredStaf = allStaf.filter((s: any) =>
    !q || s.nama.toLowerCase().includes(q) || s.nip.includes(q) || s.divisi.toLowerCase().includes(q)
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-wide">
        <h2>{isReassign ? "Penugasan Ulang" : "Disposisi Staf"}</h2>
        <div className="form-group"><label>Proyek</label><input readOnly value={judul} /></div>
        {isReassign && (
          <div className="notice-card notice-warning" style={{ marginBottom: 14 }}>
            <div className="notice-card-title">{rejectedCount} staf menolak penugasan</div>
            <div className="text-small">Pilih staf pengganti dari daftar di bawah.</div>
          </div>
        )}
        <div className="form-group">
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
              const sel = !!selectedMap[s.id];
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedMap(prev => {
                    if (prev[s.id]) { const n = { ...prev }; delete n[s.id]; return n; }
                    return { ...prev, [s.id]: { masukSurat: true } };
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
                      {avatarInitials(s.nama)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nama}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.divisi}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", paddingLeft: 39 }}>{s.nip}</div>
                  {sel && (
                    <label onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7, paddingTop: 7, borderTop: "1px solid var(--border-soft)", fontSize: 11, color: "var(--text-soft)", cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedMap[s.id]?.masukSurat !== false}
                        onChange={() => setSelectedMap(prev => ({ ...prev, [s.id]: { masukSurat: !prev[s.id]?.masukSurat } }))} />
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
          <div className="notice-card notice-info" style={{ marginBottom: 12 }}>
            <div className="notice-card-title">{Object.keys(selectedMap).length} staf terpilih</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {Object.keys(selectedMap).map(id => {
                const s = allStaf.find((u: any) => u.id === id); if (!s) return null;
                return (
                  <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--navy-50)", border: "1px solid var(--navy-100)", borderRadius: 20, padding: "3px 8px 3px 10px", fontSize: 12, fontWeight: 600 }}>
                    {s.nama}
                    <button type="button" onClick={() => setSelectedMap(prev => { const n = { ...prev }; delete n[id]; return n; })}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 15, color: "var(--text-muted)", lineHeight: 1, display: "flex", alignItems: "center" }}>×</button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" onClick={handleSave} disabled={!Object.keys(selectedMap).length}>
            {isReassign ? "Simpan Penugasan Ulang" : "Simpan Disposisi"}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
