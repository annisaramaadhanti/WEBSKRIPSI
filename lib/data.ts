import type { DashboardStat, PertanyaanSurvey, Role, User, StatusPekerjaan, StatusKonfirmasi } from "@/types";

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
  "Pengembangan dan Inovasi Teknologi Informasi",
  "Layanan Sistem dan Teknologi Informasi",
  "Manajemen dan Integrasi Sistem Informasi",
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

export const USERS: User[] = [
  // ─── Operator ───────────────────────────────────────────────────────────────
  {
    id: "fb24cdeb-78de-49f8-a28d-81648d51f9f4",
    nama: "Yeni Farida, A.M.",
    nip: "198610032025212042",
    jabatan: "Operator",
    password: "upatik123",
    role: "operator",
    divisi: "-",
  },

  // ─── Kepala UPA ─────────────────────────────────────────────────────────────
  {
    id: "d4a4a2ed-979c-4b8c-82c4-60c0cc88b5f2",
    nama: "Dr. Eng. Ir. Mardiana, S.T., M.T., IPM",
    nip: "197203161999032002",
    jabatan: "Kepala UPA",
    password: "upatik123",
    role: "kepala-upa",
    divisi: "-",
  },

  // ─── Divisi 1: Pengembangan dan Inovasi TI ──────────────────────────────────
  {
    id: "dd43e19d-a5b3-48b5-908f-e062dbe46b7c",
    nama: "Rico Andrian, S.Si., M.Kom.",
    nip: "197506272005011001",
    jabatan: "Kepala Divisi",
    password: "upatik123",
    role: "kepala-divisi",
    divisi: "Pengembangan dan Inovasi Teknologi Informasi",
  },

  // ─── Divisi 2: Layanan Sistem dan TI ────────────────────────────────────────
  {
    id: "7825e32a-c648-4668-992e-0b2666e542a1",
    nama: "Hadianto Cahyadi, S.Kom.",
    nip: "197908052001121002",
    jabatan: "Kepala Divisi",
    password: "upatik123",
    role: "kepala-divisi",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },
  {
    id: "a16d00e0-1774-4379-8286-c0cdaeadc640",
    nama: "Aditya Dwi Abrianto, S.E.",
    nip: "198710052025211077",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },
  {
    id: "36bf8497-d957-41c8-916f-c35da26b7217",
    nama: "Boby Mardani, S.Kom., S.E.",
    nip: "198804052025211066",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },
  {
    id: "0b06498d-92aa-485c-a8fd-f3de6fc7849b",
    nama: "Alifan Akbar Ikhsansah, A.Md.Kom.",
    nip: "122302000714101",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },

  // ─── Divisi 3: Manajemen dan Integrasi Sistem TI ────────────────────────────
  {
    id: "e148fe0f-a148-43b3-a4e3-3af240194cb0",
    nama: "Mahendra Pratama, S.T., M.Eng.",
    nip: "199112152019031013",
    jabatan: "Kepala Divisi",
    password: "upatik123",
    role: "kepala-divisi",
    divisi: "Manajemen dan Integrasi Sistem Teknologi Informasi",
  },
  {
    id: "070dceaf-da19-4c9f-827a-ebee81d776fd",
    nama: "Aprily Ayu Anbar, S.T.",
    nip: "122111970422201",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Manajemen dan Integrasi Sistem Teknologi Informasi",
  },
  {
    id: "2d81688a-2dca-46d6-8707-ff1219200704",
    nama: "Mizar Zulmi Ramadhan, S.Kom",
    nip: "199812272025211021",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Manajemen dan Integrasi Sistem Teknologi Informasi",
  },

  // ─── Divisi 4: Infrastruktur Jaringan ───────────────────────────────────────
  {
    id: "79a87138-854b-4539-aa43-b11dc8b07a0a",
    nama: "Hendri Susanto, S.T.",
    nip: "198105112005011001",
    jabatan: "Kepala Divisi",
    password: "upatik123",
    role: "kepala-divisi",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "5a5408e5-a447-40ac-a3f2-98bbf9bc99bb",
    nama: "Nyoman Herman Ardike, S.T.",
    nip: "199402152025211048",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "80261dbb-1083-4398-ac7a-571628ab9f39",
    nama: "Kasdi Pratama, A.Md",
    nip: "198506022025211055",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },

  // ─── Divisi 5: Sumber Daya Sistem Informasi ─────────────────────────────────
  {
    id: "7414182a-6b90-4b4b-b776-85abebb66280",
    nama: "Muhammad Ikhsan, S.Kom., M.Cs.",
    nip: "199411012024061002",
    jabatan: "Kepala Divisi",
    password: "upatik123",
    role: "kepala-divisi",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "943835ac-4eb5-4c0b-baa3-c9c9e92d110e",
    nama: "Kholik Farijal, S.Kom",
    nip: "198504222014041003",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "57a6b8dd-2dde-4541-a6af-d7ae29c132d3",
    nama: "Rika Ningtias Azhari",
    nip: "200003222025062000",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "598af3a8-8464-46d5-8055-bc7ebe2b56dd",
    nama: "Zuliana Nurfadlillah, S.Kom",
    nip: "122111980223201",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },

  // ─── Divisi 6: Pusat Data dan Keamanan Informasi ────────────────────────────
  {
    id: "c2d2fbdd-4408-4f50-92c2-e71d76d08778",
    nama: "M. Iqbal Parabi, S.Si., M.T.",
    nip: "199011302015041002",
    jabatan: "Kepala Divisi",
    password: "upatik123",
    role: "kepala-divisi",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
  {
    id: "02f0560f-da7d-4ab8-92c3-1c0a86a9396b",
    nama: "Harno, S.I.Kom.",
    nip: "198204132025211037",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
  {
    id: "d947e444-9c03-4b53-8d3b-88f87b12ad3b",
    nama: "Ikhwan Catur Nugroho, S.Pi.",
    nip: "198711292025211039",
    jabatan: "Staf",
    password: "upatik123",
    role: "staf",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS MAPPINGS - Pekerjaan dan Konfirmasi Staf
// ═══════════════════════════════════════════════════════════════════════════════

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

export function getUserById(id: string): User | null {
  return USERS.find((u) => u.id === id) || null;
}

export function getStafList(): User[] {
  return USERS.filter((u) => u.role === "staf");
}

export function getStafByDivisi(divisi: string): User[] {
  return USERS.filter((u) => u.role === "staf" && u.divisi === divisi);
}

export function getKepalaUPA(): User | null {
  return USERS.find((u) => u.role === "kepala-upa") || null;
}

export function loginUser(nip: string, password: string): User | null {
  return USERS.find((u) => u.nip === nip && u.password === password) || null;
}
