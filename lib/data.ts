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
    id: "U-000",
    nama: "Yeni Farida, A.M.",
    nip: "198501012010011001",
    jabatan: "Operator / Staf Administrasi",
    email: "yeni.farida@staff.unila.ac.id",
    password: "operator123",
    role: "operator",
    divisi: "-",
  },

  // ─── Kepala UPA ─────────────────────────────────────────────────────────────
  {
    id: "U-KA",
    nama: "Dr. Eng. Ir. Mardiana, S.T., M.T., IPM",
    nip: "197003152000031001",
    jabatan: "Kepala UPA TIK",
    email: "mardiana@staff.unila.ac.id",
    password: "kaupa123",
    role: "kepala-upa",
    divisi: "-",
  },

  // ─── Divisi 1: Pengembangan dan Inovasi TI ──────────────────────────────────
  {
    id: "U-D1-00",
    nama: "Rico Andrian, S.Si., M.Kom.",
    nip: "198208122010121002",
    jabatan: "Kepala Divisi Pengembangan dan Inovasi TI",
    email: "rico.andrian@staff.unila.ac.id",
    password: "kadiv123",
    role: "kepala-divisi",
    divisi: "Pengembangan dan Inovasi Teknologi Informasi",
  },
  {
    id: "U-D1-01",
    nama: "Nurrahma, S.Kom., M.T.",
    nip: "199001052015042001",
    jabatan: "Analis Sistem Informasi",
    email: "nurrahma@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Pengembangan dan Inovasi Teknologi Informasi",
  },

  // ─── Divisi 2: Layanan Sistem dan TI ────────────────────────────────────────
  {
    id: "U-D2-00",
    nama: "Hadianto Cahyadi, S.Kom.",
    nip: "197905202006041001",
    jabatan: "Kepala Divisi Layanan Sistem dan TI",
    email: "hadianto.cahyadi@staff.unila.ac.id",
    password: "kadiv123",
    role: "kepala-divisi",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },
  {
    id: "U-D2-01",
    nama: "Aditya Dwi Abrianto, S.E.",
    nip: "199203142017081001",
    jabatan: "Pengelola Layanan TI",
    email: "aditya.abrianto@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },
  {
    id: "U-D2-02",
    nama: "Boby Mardani, S.Kom., S.E.",
    nip: "198811302014031002",
    jabatan: "Teknisi Sistem Informasi",
    email: "boby.mardani@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },
  {
    id: "U-D2-03",
    nama: "Alifan Akbar Ikhsansah, A.Md.Kom.",
    nip: "199405102019021001",
    jabatan: "Teknisi Komputer",
    email: "alifan.akbar@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },
  {
    id: "U-D2-04",
    nama: "Pompy Pratama Putra, S.E., M.M.",
    nip: "198810012016041001",
    jabatan: "Pengelola Layanan TI",
    email: "pompy.pratama@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Layanan Sistem dan Teknologi Informasi",
  },

  // ─── Divisi 3: Manajemen dan Integrasi Sistem Informasi ─────────────────────
  {
    id: "U-D3-00",
    nama: "Mahendra Pratama, S.T., M.Eng.",
    nip: "198406172009041001",
    jabatan: "Kepala Divisi Manajemen dan Integrasi SI",
    email: "mahendra.pratama@staff.unila.ac.id",
    password: "kadiv123",
    role: "kepala-divisi",
    divisi: "Manajemen dan Integrasi Sistem Informasi",
  },
  {
    id: "U-D3-01",
    nama: "Atika Istiqomah, S.Kom., M.T.",
    nip: "199107182016042002",
    jabatan: "Pengembang Perangkat Lunak",
    email: "atika.istiqomah@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Manajemen dan Integrasi Sistem Informasi",
  },
  {
    id: "U-D3-02",
    nama: "Aprily Ayu Anbar, S.T.",
    nip: "199304252018032001",
    jabatan: "Analis Database",
    email: "aprily.ayu@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Manajemen dan Integrasi Sistem Informasi",
  },
  {
    id: "U-D3-03",
    nama: "Mizar Zulmi Ramadhan, S.Kom.",
    nip: "199508122020121003",
    jabatan: "Teknisi Sistem Informasi",
    email: "mizar.zulmi@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Manajemen dan Integrasi Sistem Informasi",
  },

  // ─── Divisi 4: Infrastruktur Jaringan ───────────────────────────────────────
  {
    id: "U-D4-00",
    nama: "Hendri Susanto, S.T.",
    nip: "197812062004121001",
    jabatan: "Kepala Divisi Infrastruktur Jaringan",
    email: "hendri.susanto@staff.unila.ac.id",
    password: "kadiv123",
    role: "kepala-divisi",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "U-D4-01",
    nama: "Nyoman Herman Ardike, S.T.",
    nip: "198801072012121001",
    jabatan: "Teknisi Jaringan",
    email: "nyoman.herman@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "U-D4-02",
    nama: "Kasdi Pratama, A.Md.",
    nip: "199106152014021001",
    jabatan: "Teknisi Jaringan",
    email: "kasdi.pratama@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "U-D4-03",
    nama: "Gontor Ganta Nama, S.T.",
    nip: "199307282017121002",
    jabatan: "Teknisi Infrastruktur",
    email: "gontor.ganta@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "U-D4-04",
    nama: "Rahmad Junaidi",
    nip: "198903162015031001",
    jabatan: "Teknisi Jaringan",
    email: "rahmad.junaidi@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "U-D4-05",
    nama: "Aditya Anggi",
    nip: "199512092021041001",
    jabatan: "Teknisi Komputer",
    email: "aditya.anggi@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },
  {
    id: "U-D4-06",
    nama: "Wahozin",
    nip: "198705202014041001",
    jabatan: "Teknisi Jaringan",
    email: "wahozin@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Infrastruktur Jaringan",
  },

  // ─── Divisi 5: Sumber Daya Sistem Informasi ─────────────────────────────────
  {
    id: "U-D5-00",
    nama: "Muhammad Ikhsan, S.Kom., M.Cs.",
    nip: "198003202005011002",
    jabatan: "Kepala Divisi Sumber Daya SI",
    email: "muhammad.ikhsan@staff.unila.ac.id",
    password: "kadiv123",
    role: "kepala-divisi",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "U-D5-01",
    nama: "Kholik Farijal, S.Kom.",
    nip: "199002142013021001",
    jabatan: "Pengelola Aset TI",
    email: "kholik.farijal@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "U-D5-02",
    nama: "Rika Ningtias Azhari",
    nip: "198906252015042002",
    jabatan: "Analis Sistem Informasi",
    email: "rika.ningtias@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "U-D5-03",
    nama: "Zuliana Nurfadlillah, S.Kom.",
    nip: "199411302019042001",
    jabatan: "Administrator Sistem",
    email: "zuliana.nurfadlillah@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "U-D5-04",
    nama: "Nokimala",
    nip: "199203052018042001",
    jabatan: "Pengelola Aset TI",
    email: "nokimala@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },
  {
    id: "U-D5-05",
    nama: "Rahmadona",
    nip: "199406182020042001",
    jabatan: "Staf Administrasi TI",
    email: "rahmadona@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Sumber Daya Sistem Informasi",
  },

  // ─── Divisi 6: Pusat Data dan Keamanan Informasi ────────────────────────────
  {
    id: "U-D6-00",
    nama: "M. Iqbal Parabi, S.Si., M.T.",
    nip: "197910052003121001",
    jabatan: "Kepala Divisi Pusat Data dan Keamanan",
    email: "iqbal.parabi@staff.unila.ac.id",
    password: "kadiv123",
    role: "kepala-divisi",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
  {
    id: "U-D6-01",
    nama: "Muhammad Nur Khawarizmi, S.Si., M.T.",
    nip: "198601182011011002",
    jabatan: "Analis Keamanan Informasi",
    email: "nur.khawarizmi@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
  {
    id: "U-D6-02",
    nama: "Rizkima Akbar Setiawan, S.T., M.T.",
    nip: "199001232016041001",
    jabatan: "Pengelola Pusat Data",
    email: "rizkima.akbar@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
  {
    id: "U-D6-03",
    nama: "Harno, S.I.Kom.",
    nip: "198704112012121003",
    jabatan: "Pengelola Keamanan Jaringan",
    email: "harno@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
  {
    id: "U-D6-04",
    nama: "Supriyanto",
    nip: "198602142010041001",
    jabatan: "Teknisi Data Center",
    email: "supriyanto@staff.unila.ac.id",
    password: "staf123",
    role: "staf",
    divisi: "Pusat Data dan Keamanan Informasi",
  },
  {
    id: "U-D6-05",
    nama: "Ikhwan Catur Nugroho, S.Pi.",
    nip: "199208062018021001",
    jabatan: "Teknisi Data Center",
    email: "ikhwan.catur@staff.unila.ac.id",
    password: "staf123",
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
  "rejected": "Penugasan Ulang",
};

export const STATUS_KONFIRMASI_BADGES: Record<StatusKonfirmasi, string> = {
  "pending": "badge-purple",
  "accepted": "badge-blue",
  "rejected": "badge-red",
  "rejected": "badge-orange",
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

export function loginUser(email: string, password: string): User | null {
  return USERS.find((u) => u.email === email && u.password === password) || null;
}
