"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import {
  getPekerjaanList,
  tambahPekerjaan as apiTambah, editPekerjaan as apiEdit,
  disposisiPekerjaan, terimaPekerjaan, tolakPekerjaan, mulaiPekerjaan,
  buatSuratTugasPekerjaan, publishSuratTugas, urlPdfSuratTugas, urlDokumen, urlLaporanPdf,
  getMasterUnitKerja, getMasterStaf, getMasterDivisi,
} from "@/lib/api";
import { mapPekerjaan, extractList } from "@/lib/api-mapper";
import type { Pekerjaan, Assignee, SuratDetail } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  // StatusKonfirmasi
  "pending":     "badge-yellow",
  "accepted":    "badge-cyan",
  "rejected":    "badge-red",
  // StatusPekerjaan
  "assigned":    "badge-purple",
  "in_progress": "badge-blue",
  "review":      "badge-orange",
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
              <tr><td className="info-label">Status</td><td>: <span className={`badge ${item.suratStatus === "published" ? "badge-indigo" : "badge-yellow"}`}>{item.suratStatus === "published" ? "Published" : "Preview"}</span></td></tr>
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
    lokasi: "", id_unit: "", id_divisi: "",
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
    if (!form.id_divisi) return alert("Pilih Divisi Penanggungjawab.");
    if (!form.lokasi) return alert("Isi Lokasi pekerjaan.");
    if (!form.nomorSurat) return alert("Isi Nomor Surat Masuk.");
    if (!form.perihalSurat) return alert("Isi Perihal Surat Masuk.");
    if (!form.file) return alert("Dokumen surat masuk (PDF) wajib diunggah.");
    try {
      await apiTambah({
        id_pengguna: user!.id,
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
      setForm({ namaPekerjaan: "", targetSelesai: "", lokasi: "", id_unit: "", id_divisi: "", nomorSurat: "", perihalSurat: "", file: null });
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
          <th className="col-nama">Nama Pekerjaan</th>
          <th className="col-unit">Unit Peminta</th>
          <th className="th-center col-status">Status</th>
          <th className="col-divisi">Divisi</th>
          <th className="col-staf">Staf</th>
          <th className="th-center col-target">Target</th>
          <th className="th-center col-surat">Surat Masuk</th>
          <th className="th-center col-surat">Surat Tugas</th>
          <th className="th-center col-laporan">Laporan</th>
          <th className="th-center col-aksi">Aksi</th>
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
    <div className="dashboard-stack">
      <div className="dashboard-hero">
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

                const activeAssignees = item.assignees.filter(a => a.statusKonfirmasi !== "rejected");
                const stafRingkas = activeAssignees.length > 0
                  ? activeAssignees.length === 1
                    ? activeAssignees[0].nama
                    : `${activeAssignees[0].nama} +${activeAssignees.length - 1}`
                  : null;

                const konfirmasiStafBadge = () => {
                  const total = item.assignees.length;
                  if (total === 0) return <span className="text-muted text-small">—</span>;
                  const rejected = item.assignees.filter(a => a.statusKonfirmasi === "rejected").length;
                  const accepted = item.assignees.filter(a => a.statusKonfirmasi === "accepted").length;
                  if (rejected > 0) return <span className="badge badge-red">{rejected} Ditolak</span>;
                  if (accepted === total) return <span className="badge badge-cyan">Semua Diterima</span>;
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
                        <td className="text-small">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                        <td className="td-center text-small">{item.targetSelesai}</td>
                        <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                        <td className="td-center">{suratTugasCell("operator")}</td>
                        <td className="td-center">{laporanCell()}</td>
                        <td className="td-center">
                          <div className="table-actions table-actions--center">
                            <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {isAssigned && item.suratStatus !== "published" && (
                              <button type="button" className="btn-edit btn-sm" onClick={() => openEdit(item)}>Edit</button>
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
                        <td className="text-small">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
                        <td className="td-center text-small">{item.targetSelesai}</td>
                        <td className="td-center">{item.suratMasuk ? <button type="button" className="btn-link-pdf" onClick={() => openSuratMasuk(item)}>PDF</button> : <span className="text-muted text-small">-</span>}</td>
                        <td className="td-center">{suratTugasCell("kadiv")}</td>
                        <td className="td-center">{laporanCell()}</td>
                        <td className="td-center">
                          <div className="table-actions table-actions--center">
                            <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>Ringkasan</button>
                            {/* Disposisi: belum ada staf, masih assigned, surat belum published */}
                            {item.assignees.length === 0 && isAssigned && item.suratStatus !== "published" && (
                              <button type="button" className="btn-edit btn-sm" onClick={() => setShowDisposisi(item)}>Disposisi</button>
                            )}
                            {/* Penugasan Ulang: ada yang ditolak, masih assigned, surat belum published */}
                            {hasRejected && isAssigned && item.suratStatus !== "published" && (
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
                        <td className="text-small">{stafRingkas ? <span title={activeAssignees.map(a => a.nama).join(", ")}>{stafRingkas}</span> : <span className="text-muted">Belum ditugaskan</span>}</td>
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
              <select value={form.id_unit} onChange={(e) => setForm({ ...form, id_unit: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitKerjaList.map((u) => <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Divisi Penanggungjawab *</label>
              <select value={form.id_divisi} onChange={(e) => setForm({ ...form, id_divisi: e.target.value })}>
                <option value="">-- Pilih Divisi --</option>
                {divisiList.filter(d => d.nama_divisi !== "UPA TIK (Pusat)").map((d) => (
                  <option key={d.uuid} value={d.uuid}>{d.nama_divisi}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Lokasi *</label>
              <textarea value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                placeholder="Contoh: Gedung Rektorat Lantai 2, Ruang Sidang" rows={2} />
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
                  {form.file ? "Ganti File" : "Pilih File PDF"}
                </label>
                {form.file && <div className="file-upload-preview"><span>{form.file.name}</span></div>}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleTambah}>Simpan</button>
              <button type="button" className="btn-secondary" onClick={() => {
                setShowTambah(false);
                setForm({ namaPekerjaan: "", targetSelesai: "", lokasi: "", id_unit: "", id_divisi: "", nomorSurat: "", perihalSurat: "", file: null });
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
              <select value={editForm.id_unit} onChange={(e) => setEditForm({ ...editForm, id_unit: e.target.value })}>
                <option value="">-- Pilih Unit Peminta --</option>
                {unitKerjaList.map((u) => <option key={u.id_unit} value={u.id_unit}>{u.nama_unit}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Lokasi *</label>
              <textarea value={editForm.lokasi} onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })} rows={2} />
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
                  {editForm.file ? "Ganti File" : "Pilih File PDF Baru"}
                </label>
                {editForm.file && <div className="file-upload-preview"><span>{editForm.file.name}</span></div>}
                {!editForm.file && showEdit.suratMasuk && <div className="file-upload-preview"><span>{showEdit.suratMasuk}</span><span className="file-size-label text-muted">File saat ini</span></div>}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleSaveEdit}>Simpan Perubahan</button>
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(null)}>Batal</button>
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
    if (a.statusKonfirmasi === "accepted") return <span className="badge badge-cyan">Diterima</span>;
    if (a.statusKonfirmasi === "rejected") return <span className="badge badge-red">Ditolak</span>;
    return <span className="badge badge-purple">Menunggu</span>;
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
    <div className="modal-overlay">
      <div className="modal-box modal-wide">
        <h2>{isReassign ? "Penugasan Ulang" : "Disposisi Staf"}</h2>
        <div className="form-group"><label>Pekerjaan</label><input readOnly value={pekerjaan.namaPekerjaan} /></div>

        {/* ── Initial disposisi: dropdown + summary + table ── */}
        {!isReassign && (
          <>
            <div className="form-group">
              <label>Pilih Staf *</label>
              <div>
                <input
                  type="text"
                  placeholder="Cari nama, NIP, atau divisi..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPendingStafId(""); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 180)}
                  style={{ width: "100%" }}
                />
                {dropdownOpen && (
                  <div className="disposisi-dropdown" style={{ position: "static", marginTop: 4 }}>
                    {filteredStaf.filter((s: any) => !selectedMap[s.uuid ?? s.id]).map((s: any) => {
                      const sid = s.uuid ?? s.id;
                      const snama = s.nama_lengkap ?? s.nama ?? "";
                      return (
                      <div key={sid} className="disposisi-option"
                        onMouseDown={e => { e.preventDefault(); setPendingStafId(sid); setSearch(snama); setDropdownOpen(false); }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy-100)", color: "var(--navy-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {avatarInitials(snama)}
                          </div>
                          <div>
                            <div className="font-semibold text-small">{snama}</div>
                            <div className="text-muted text-xsmall">{s.NIP ?? s.nip} · {s.divisi?.nama_divisi ?? s.divisi ?? ""}</div>
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
                  <button type="button" className="btn-edit btn-sm" style={{ flexShrink: 0 }} onClick={handleAddStaf}>
                    + Tambah ke Daftar
                  </button>
                </div>
              )}
            </div>

            {/* Tabel ringkasan staf yang sudah ditambahkan */}
            {selectedEntries.length > 0 && (
              <div className="form-group">
                <label>Daftar Staf Ditugaskan ({selectedEntries.length})</label>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>NIP</th>
                        <th>Divisi / Jabatan</th>
                        <th className="th-center">Masuk Surat Tugas</th>
                        <th className="th-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntries.map((e, i) => (
                        <tr key={e.id}>
                          <td className="td-center text-small">{i + 1}</td>
                          <td><strong>{(e.staf as any).nama_lengkap ?? (e.staf as any).nama}</strong></td>
                          <td className="text-small">{(e.staf as any).NIP ?? (e.staf as any).nip}</td>
                          <td className="text-small">{(e.staf as any).divisi?.nama_divisi ?? (e.staf as any).divisi ?? ""}</td>
                          <td className="td-center">
                            <input
                              type="checkbox"
                              checked={e.masukSurat !== false}
                              onChange={() => setSelectedMap(prev => ({ ...prev, [e.id]: { masukSurat: !prev[e.id]?.masukSurat } }))}
                            />
                          </td>
                          <td className="td-center">
                            <button type="button" className="btn-delete btn-icon-sm" title="Hapus"
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
          <div className="form-group">
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
                          {isRemoved && <span className="badge badge-red">Akan Dihapus</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.nip} · {a.divisi}</div>
                        {a.statusKonfirmasi === "rejected" && a.alasanPenolakan && (
                          <div style={{ fontSize: 11, color: "var(--danger-600)", marginTop: 4, fontStyle: "italic" }}>"{a.alasanPenolakan}"</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {a.statusKonfirmasi === "accepted" && <span className="text-xsmall text-muted" style={{ alignSelf: "center" }}>Terkunci</span>}
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
                        {isReplacing && (
                          <button type="button" className="btn-secondary btn-sm" onClick={() => updateExisting(i, { action: "keep", replacementId: "", replacementSearch: "" })}>Batal</button>
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
                            <div className="disposisi-dropdown" style={{ position: "static", marginTop: 4 }}>
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
                                <div key={sid} className="disposisi-option"
                                  onMouseDown={e => { e.preventDefault(); updateExisting(i, { replacementId: sid, replacementSearch: snama, replacementOpen: false }); }}>
                                  <div className="font-semibold text-small">{snama}</div>
                                  <div className="text-muted text-xsmall">{s.NIP ?? s.nip} · {s.divisi?.nama_divisi ?? s.divisi ?? ""}</div>
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
                      <button type="button" className="btn-delete btn-sm" onClick={() => removeAddRow(r.uid)}>Hapus</button>
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
                        <div className="disposisi-dropdown" style={{ position: "static", marginTop: 4 }}>
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
                            <div key={sid} className="disposisi-option" onMouseDown={e => { e.preventDefault(); updateAddRow(r.uid, { stafId: sid, search: snama, open: false }); }}>
                              <div className="font-semibold text-small">{snama}</div>
                              <div className="text-muted text-xsmall">{s.NIP ?? s.nip} · {s.divisi?.nama_divisi ?? s.divisi ?? ""}</div>
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
              <button type="button" className="btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={addNewRow}>+ Tambah Staf Lain</button>
            </div>
            <div className="micro-text mt-2">Staf "Terkunci" (sudah Diterima) tidak dapat diubah.</div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={handleSave} disabled={
            isReassign
              ? existingActions.every(ea => ea.action === "remove") && addRows.every(r => !r.stafId)
              : Object.keys(selectedMap).length === 0
          }>
            {isReassign ? "Simpan Penugasan Ulang" : "Simpan Disposisi"}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
