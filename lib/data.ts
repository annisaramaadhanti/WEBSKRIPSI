import type { DashboardStat, PertanyaanSurvey, Role, StatusPekerjaan, StatusKonfirmasi } from "@/types";

export const dashboardStats: Record<Role, DashboardStat[]> = {
  operator: [
    { label: "Pekerjaan Masuk", value: 12 },
    { label: "Perlu Disposisi", value: 4 },
    { label: "Surat Masuk", value: 6 },
  ],
  staf: [
    { label: "Tugas Saya", value: 5 },
    { label: "Sedang Dikerjakan", value: 3 },
    { label: "Deadline Dekat", value: 2 },
  ],
  "kepala-divisi": [
    { label: "Pekerjaan Tim", value: 18 },
    { label: "Perlu Disposisi", value: 5 },
    { label: "In Review", value: 4 },
  ],
  "kepala-upa": [
    { label: "Proyek Aktif", value: 9 },
    { label: "Pekerjaan Berjalan", value: 18 },
    { label: "Kinerja Unit", value: "87%" },
  ],
};

export const divisiList = [
  "Pusat UPA TIK",
  "Pengembangan dan Inovasi Teknologi Informasi",
  "Layanan Sistem dan Teknologi Informasi",
  "Manajemen dan Integrasi Sistem Teknologi Informasi",
  "Infrastruktur Jaringan",
  "Sumber Daya Sistem Informasi",
  "Pusat Data dan Keamanan Informasi",
];

export const unitPemintaList = [
  "Ketua Senat",
  "Rektor",
  "Wakil Rektor I",
  "Wakil Rektor II",
  "Wakil Rektor III",
  "Wakil Rektor IV",
  "Ketua SPI",
  "Dekan FEB",
  "Wakil Dekan FEB",
  "Dekan FH",
  "Wakil Dekan FH",
  "Dekan FKIP",
  "Wakil Dekan FKIP",
  "Dekan FP",
  "Wakil Dekan FP",
  "Dekan FT",
  "Wakil Dekan FT",
  "Dekan FISIP",
  "Wakil Dekan FISIP",
  "Dekan FMIPA",
  "Wakil Dekan FMIPA",
  "Dekan FK",
  "Wakil Dekan FK",
  "Direktur Pascasarjana",
  "Wakil Direktur Pascasarjana",
  "Kepala Biro Akademik dan Kemahasiswaan",
  "Kepala Biro Umum dan Keuangan",
  "Kepala Biro Perencanaan dan Hubungan Masyarakat",
  "Kepala Lembaga Penelitian dan Pengabdian Kepada Masyarakat",
  "Kepala Lembaga Pengembangan Pembelajaran dan Penjaminan Mutu",
  "Kepala UPA Perpustakaan",
  "Kepala UPA Teknologi Informasi dan Komunikasi",
  "Kepala UPA Laboratorium Terpadu dan Sentra Inovasi Teknologi",
  "Kepala UPA Bahasa",
  "Kepala UPA Pengembangan Karir dan Kewirausahaan",
  "Kepala UPA Layanan Internasional",
  "Kepala UPA Kearsipan",
  "Ketua Badan Pengelola Usaha",
];

// Template 5 pertanyaan pilihan + 1 teks bebas untuk survei kepuasan
export const PERTANYAAN_SURVEY: PertanyaanSurvey[] = [
  {
    id: "Q1",
    teks: "Seberapa puas Anda terhadap kualitas pekerjaan?",
    tipeJawaban: "pilihan",
    urutan: 1,
  },
  {
    id: "Q2",
    teks: "Seberapa puas Anda terhadap ketepatan waktu penyelesaian?",
    tipeJawaban: "pilihan",
    urutan: 2,
  },
  {
    id: "Q3",
    teks: "Seberapa puas Anda terhadap komunikasi tim?",
    tipeJawaban: "pilihan",
    urutan: 3,
  },
  {
    id: "Q4",
    teks: "Seberapa puas Anda terhadap dokumentasi/hasil akhir?",
    tipeJawaban: "pilihan",
    urutan: 4,
  },
  {
    id: "Q5",
    teks: "Seberapa puas Anda terhadap dukungan teknis?",
    tipeJawaban: "pilihan",
    urutan: 5,
  },
  {
    id: "Q6",
    teks: "Kritik dan saran (opsional):",
    tipeJawaban: "teks",
    urutan: 6,
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STATUS MAPPINGS - Pekerjaan dan Konfirmasi Staf
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const STATUS_PEKERJAAN_LABELS: Record<StatusPekerjaan, string> = {
  "assigned": "Ditugaskan",
  "in_progress": "Sedang Berlangsung",
  "review": "Dalam Tinjauan",
  "done": "Selesai",
};

export const STATUS_PEKERJAAN_BADGES: Record<StatusPekerjaan, string> = {
  "assigned": "badge-purple",
  "in_progress": "badge-blue",
  "review": "badge-yellow",
  "done": "badge-green",
};

export const STATUS_KONFIRMASI_LABELS: Record<StatusKonfirmasi, string> = {
  "pending": "Menunggu Konfirmasi",
  "accepted": "Diterima",
  "rejected": "Ditolak",
};

export const STATUS_KONFIRMASI_BADGES: Record<StatusKonfirmasi, string> = {
  "pending": "badge-purple",
  "accepted": "badge-green",
  "rejected": "badge-red",
};


