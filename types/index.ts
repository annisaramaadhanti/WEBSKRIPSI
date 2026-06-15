export type Role = "operator" | "staf" | "kepala-divisi" | "kepala-upa";

// Status Pekerjaan (Work Status)
export type StatusPekerjaan = "assigned" | "in_progress" | "review" | "done";

// Status Konfirmasi Staf (Staff Confirmation Status)
export type StatusKonfirmasi = "pending" | "accepted" | "rejected";

// Legacy union for backward compatibility - gradually replace with specific statuses
export type AnyStatus = StatusPekerjaan | StatusKonfirmasi;

export type StatusSurat = "draft" | "published";

export type TipeJawabanSurvey = "pilihan" | "teks";

export type Assignee = {
  stafId: string;
  id_pekerjaan_staf?: string; // UUID dari API (pivot record)
  id_proyek_staf?: string;    // UUID dari API (pivot record)
  nama: string;
  nip: string;
  jabatan: string;
  divisi: string;
  statusPekerjaan: StatusPekerjaan;
  statusKonfirmasi: StatusKonfirmasi;
  alasanPenolakan?: string;
  masukSurat?: boolean; // true = muncul di surat tugas, false = hanya tercatat di sistem
};

export type User = {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  email: string;
  password: string;
  role: Role;
  divisi: string;
};

export type UnitPeminta = string; // lihat unitPemintaList di lib/data.ts

export type Pekerjaan = {
  id: string;
  deleted?: boolean;
  id_surat_tugas?: string;   // UUID surat tugas dari API
  id_dokumen_surat?: string; // UUID dokumen surat masuk dari API
  id_tinjauan?: string;      // UUID tinjauan kinerja dari API (untuk laporan PDF)
  namaPekerjaan: string;
  status: StatusPekerjaan;
  suratMasuk: string;
  suratMasukData?: string;
  nomorSuratMasuk?: string;
  perihalSuratMasuk?: string;
  lokasiSuratMasuk?: string;
  divisi: string[];
  assignees: Assignee[];
  lokasi: string;
  unitPeminta: string;
  deskripsi: string | null;
  targetSelesai: string;
  suratTugas: string | null;
  suratTugasData?: string;
  suratStatus?: StatusSurat;
  suratDetail?: SuratDetail;
  catatan: string | null;
  submittedBy?: { stafId: string; nama: string } | null;
  // Tinjauan ACC metadata
  accBy?: { stafId: string; nama: string; nip: string; jabatan: string } | null;
  accAt?: string | null;
  catatanKadiv?: string | null;
};

export type SuratDetail = {
  nomorSurat: string;
  perihal: string;
  tujuan: string;
  tanggalPelaksanaan: string;
  lokasiPembuatan: string;
  tanggalSuratKeluar: string;
};

export type Proyek = {
  id: string;
  deleted?: boolean;
  id_surat_tugas?: string;   // UUID surat tugas dari API
  id_dokumen_surat?: string; // UUID dokumen surat masuk dari API
  id_tinjauan?: string;      // UUID tinjauan kinerja dari API (untuk laporan PDF)
  namaProyek: string;
  status: StatusPekerjaan;
  statusKonfirmasi: StatusKonfirmasi;
  suratMasuk: string;
  suratMasukData?: string;
  nomorSuratMasuk?: string;
  perihalSuratMasuk?: string;
  lokasiSuratMasuk?: string;
  divisi: string[];
  lokasi: string;
  unitPeminta: string;
  staf: string | null;
  stafId: string | null;
  nip?: string;
  jabatan?: string;
  assignees: Assignee[];
  deskripsi: string | null;
  targetSelesai: string;
  suratTugas: string | null;
  suratTugasData?: string;
  suratStatus?: StatusSurat;
  suratDetail?: SuratDetail;
  catatan: string | null;
  submittedBy?: { stafId: string; nama: string } | null;
  // Tinjauan ACC metadata
  accBy?: { stafId: string; nama: string; nip: string; jabatan: string } | null;
  accAt?: string | null;
  catatanKadiv?: string | null;
};

export type Progress = {
  id: string;
  proyekId: string;
  keteranganProgress: string;
  stafPelapor: string;
  tanggalProgress: string;
  lampiran: string | null;
  lampiranData?: string;
  lampiranSize?: number;
  catatan: string | null;
};

export type Dokumentasi = {
  id: string;
  refId: string;
  jenis: "PEKERJAAN" | "PROYEK";
  judul: string;
  filePath: string;
  fileData?: string;
  fileSize?: number;
  tanggal: string;
  uploadedBy: string;
};

export type PertanyaanSurvey = {
  id: string;
  teks: string;
  tipeJawaban: TipeJawabanSurvey;
  urutan: number;
};

export type HasilSurvey = {
  id: string;
  refId: string;
  jenis: "PEKERJAAN" | "PROYEK";
  jawaban: JawabanSurvey[];
  tanggalSurvey: string;
  surveyor: string;
  namaKlien?: string;
  nipKlien?: string;
};

export type JawabanSurvey = {
  pertanyaanId: string;
  nilaiPilihan?: number;
  teksJawaban?: string;
};

export type DashboardStat = {
  label: string;
  value: string | number;
};
