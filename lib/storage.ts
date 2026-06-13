import type { Pekerjaan, Proyek, Progress, Dokumentasi, HasilSurvey, StatusPekerjaan, StatusKonfirmasi, AnyStatus } from "@/types";

/* =========================
   STORAGE KEYS
========================= */
const KEYS = {
  pekerjaan: "pekerjaanData",
  proyek: "proyekData",
  progress: "progressData",
  dokumentasi: "dokumentasiData",
  hasilSurvey: "hasilSurveyData",
} as const;

/* =========================
   HELPER
========================= */
function safeGet<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function safeSet<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

/* =========================
   MIGRATION HELPER
========================= */
function migrateAssigneeStatus(assignee: any): any {
  // If already has new format, return as is
  if ("statusPekerjaan" in assignee && "statusKonfirmasi" in assignee) {
    return assignee;
  }
  
  // Migrate old format to new
  if ("status" in assignee) {
    const oldStatus = assignee.status as string;
    const workStatuses = ["assigned", "in_progress", "review", "done"];
    const confirmationStatuses = ["pending", "accepted", "rejected", "rejected"];

    let statusPekerjaan: StatusPekerjaan = "assigned";
    let statusKonfirmasi: StatusKonfirmasi = "accepted";

    if (workStatuses.includes(oldStatus)) {
      statusPekerjaan = oldStatus as StatusPekerjaan;
    } else if (confirmationStatuses.includes(oldStatus)) {
      statusKonfirmasi = oldStatus as StatusKonfirmasi;
    }

    return {
      ...assignee,
      statusPekerjaan,
      statusKonfirmasi,
    };
  }

  return assignee;
}

function migratePekerjaan(pekerjaan: any): any {
  return {
    ...pekerjaan,
    // Migrate pekerjaan status if it's a confirmation status
    status: (pekerjaan.status === "pending" || pekerjaan.status === "rejected")
      ? "assigned"
      : pekerjaan.status,
    // Migrate all assignees
    assignees: pekerjaan.assignees?.map(migrateAssigneeStatus) ?? [],
  };
}

function migrateProyek(proyek: any): any {
  const confirmationStatuses = ["pending", "accepted", "rejected", "rejected"];
  const isConfirmationStatus = confirmationStatuses.includes(proyek.status);
  const status = isConfirmationStatus ? "assigned" : proyek.status;
  const statusKonfirmasi = "statusKonfirmasi" in proyek
    ? proyek.statusKonfirmasi
    : isConfirmationStatus
    ? proyek.status
    : "accepted";

  const assignees = (proyek.assignees?.map(migrateAssigneeStatus) ?? []).filter(Boolean);
  const normalizedAssignees = assignees.length > 0
    ? assignees
    : proyek.stafId || proyek.staf
    ? [
        {
          stafId: proyek.stafId || "",
          nama: proyek.staf || "",
          nip: proyek.nip || "",
          jabatan: proyek.jabatan || "",
          divisi: Array.isArray(proyek.divisi) ? proyek.divisi[0] || "" : String(proyek.divisi || ""),
          statusPekerjaan: status as any,
          statusKonfirmasi,
          masukSurat: true,
        },
      ]
    : [];

  return {
    ...proyek,
    status,
    statusKonfirmasi,
    assignees: normalizedAssignees,
  };
}

/* =========================
   PEKERJAAN
========================= */
export const getPekerjaan = () => safeGet<Pekerjaan>(KEYS.pekerjaan).map(migratePekerjaan).filter(item => !item.deleted);
export const savePekerjaan = (data: Pekerjaan[]) => safeSet(KEYS.pekerjaan, data);

function genPekerjaanId(existing: Pekerjaan[]): string {
  const max = existing.reduce((acc, item) => {
    const m = item.id.match(/^PKJ-(\d+)$/);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `PKJ-${String(max + 1).padStart(3, "0")}`;
}

export function addPekerjaan(item: Omit<Pekerjaan, "id">): void {
  const data = getPekerjaan();
  savePekerjaan([{ ...item, id: genPekerjaanId(data) }, ...data]);
}

export function updatePekerjaan(id: string, payload: Partial<Pekerjaan>): void {
  savePekerjaan(getPekerjaan().map((item) => (item.id === id ? { ...item, ...payload } : item)));
}

export function deletePekerjaan(id: string): void {
  const all = safeGet<Pekerjaan>(KEYS.pekerjaan).map(migratePekerjaan);
  safeSet(KEYS.pekerjaan, all.map(item => item.id === id ? { ...item, deleted: true } : item));
}

export function getPekerjaanById(id: string): Pekerjaan | null {
  return getPekerjaan().find((item) => item.id === id) || null;
}

/* =========================
   PROYEK
========================= */
export const getProyek = () => safeGet<Proyek>(KEYS.proyek).map(migrateProyek).filter(item => !item.deleted);
export const saveProyek = (data: Proyek[]) => safeSet(KEYS.proyek, data);

function genProyekId(existing: Proyek[]): string {
  const max = existing.reduce((acc, item) => {
    const m = item.id.match(/^PRY-(\d+)$/);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `PRY-${String(max + 1).padStart(3, "0")}`;
}

export function addProyek(item: Omit<Proyek, "id">): void {
  const data = getProyek();
  saveProyek([{ ...item, id: genProyekId(data) }, ...data]);
}

export function updateProyek(id: string, payload: Partial<Proyek>): void {
  saveProyek(getProyek().map((item) => (item.id === id ? { ...item, ...payload } : item)));
}

export function deleteProyek(id: string): void {
  const all = safeGet<Proyek>(KEYS.proyek).map(migrateProyek);
  safeSet(KEYS.proyek, all.map(item => item.id === id ? { ...item, deleted: true } : item));
}

export function getProyekById(id: string): Proyek | null {
  return getProyek().find((item) => item.id === id) || null;
}

/* =========================
   PROGRESS (Proyek)
========================= */
export const getProgress = () => safeGet<Progress>(KEYS.progress);
export const saveProgress = (data: Progress[]) => safeSet(KEYS.progress, data);

export function addProgress(item: Omit<Progress, "id">): void {
  const newItem: Progress = { ...item, id: `PRG-${Date.now()}` };
  saveProgress([newItem, ...getProgress()]);
}

export function getProgressByProyekId(proyekId: string): Progress[] {
  return getProgress().filter((item) => item.proyekId === proyekId);
}

export function deleteProgress(id: string): void {
  saveProgress(getProgress().filter((item) => item.id !== id));
}

/* =========================
   DOKUMENTASI
========================= */
export const getDokumentasi = () => safeGet<Dokumentasi>(KEYS.dokumentasi);
export const saveDokumentasi = (data: Dokumentasi[]) => safeSet(KEYS.dokumentasi, data);

export function addDokumentasi(item: Omit<Dokumentasi, "id">): void {
  saveDokumentasi([{ ...item, id: `DOK-${Date.now()}` }, ...getDokumentasi()]);
}

export function getDokumentasiByRef(refId: string): Dokumentasi[] {
  return getDokumentasi().filter((d) => d.refId === refId);
}

export function deleteDokumentasi(id: string): void {
  saveDokumentasi(getDokumentasi().filter((d) => d.id !== id));
}

/* =========================
   HASIL SURVEY
========================= */
export const getHasilSurvey = () => safeGet<HasilSurvey>(KEYS.hasilSurvey);
export const saveHasilSurvey = (data: HasilSurvey[]) => safeSet(KEYS.hasilSurvey, data);

export function addHasilSurvey(item: Omit<HasilSurvey, "id">): void {
  saveHasilSurvey([{ ...item, id: `SRV-${Date.now()}` }, ...getHasilSurvey()]);
}

export function getHasilSurveyByRef(refId: string): HasilSurvey[] {
  return getHasilSurvey().filter((s) => s.refId === refId);
}

/* =========================
   SEED DATA
========================= */
export function seedIfEmpty(): void {
  if (getPekerjaan().length === 0) {
    savePekerjaan([
      {
        id: "PKJ-DEMO-001",
        namaPekerjaan: "Instalasi Switch Jaringan Gedung B",
        status: "review",
        suratMasuk: "surat_masuk_instalasi_switch.pdf",
        suratMasukData: undefined,
        nomorSuratMasuk: "001/UN26/TIK/2026",
        perihalSuratMasuk: "Permohonan Pemasangan Switch Jaringan di Gedung B",
        lokasiSuratMasuk: "Bandar Lampung",
        divisi: ["Infrastruktur Jaringan"],
        assignees: [
          {
            stafId: "U-D4-01",
            nama: "Nyoman Herman Ardike, S.T.",
            nip: "198801072012121001",
            jabatan: "Teknisi Jaringan",
            divisi: "Infrastruktur Jaringan",
            statusPekerjaan: "in_progress",
            statusKonfirmasi: "accepted",
            masukSurat: true,
          },
        ],
        lokasi: "Gedung B, Lantai 2, Ruang Server",
        unitPeminta: "BAAK",
        deskripsi: null,
        targetSelesai: "2026-07-20",
        suratTugas: "ST-PKJ-DEMO-001.pdf",
        suratStatus: "published",
        suratDetail: {
          nomorSurat: "001/UN26.TIK/ST.PEK/2026",
          perihal: "Permohonan Pemasangan Switch Jaringan di Gedung B",
          tujuan: "Melaksanakan instalasi dan konfigurasi switch jaringan baru di Gedung B Lantai 2",
          tanggalPelaksanaan: "2026-06-10",
          lokasiPembuatan: "Bandar Lampung",
          tanggalSuratKeluar: "2026-06-05",
        },
        catatan: null,
      },
    ]);
  }

  if (getProyek().length === 0) {
    saveProyek([
      {
        id: "PRY-DEMO-001",
        namaProyek: "Sistem Informasi Akademik (SIA) Terpadu",
        status: "review",
        statusKonfirmasi: "accepted",
        suratMasuk: "surat_masuk_sia.pdf",
        suratMasukData: undefined,
        nomorSuratMasuk: "002/UN26/TIK/2026",
        perihalSuratMasuk: "Permohonan Pengembangan Sistem Informasi Akademik Terpadu",
        divisi: ["Pengembangan dan Inovasi Teknologi Informasi"],
        lokasi: "Gedung UPA TIK, Lantai 2",
        unitPeminta: "BAAK",
        staf: "Nurrahma, S.Kom., M.T.",
        stafId: "U-D1-01",
        nip: "199001052015042001",
        jabatan: "Analis Sistem Informasi",
        assignees: [
          {
            stafId: "U-D1-01",
            nama: "Nurrahma, S.Kom., M.T.",
            nip: "199001052015042001",
            jabatan: "Analis Sistem Informasi",
            divisi: "Pengembangan dan Inovasi Teknologi Informasi",
            statusPekerjaan: "in_progress",
            statusKonfirmasi: "accepted",
            masukSurat: true,
          },
        ],
        deskripsi: "Pengembangan SIA terpadu dengan fitur mobile dan integrasi SSO.",
        targetSelesai: "2026-08-30",
        suratTugas: "ST-PRY-DEMO-001.pdf",
        suratStatus: "published",
        suratDetail: {
          nomorSurat: "002/UN26.TIK/ST.PRO/2026",
          perihal: "Permohonan Pengembangan Sistem Informasi Akademik Terpadu",
          tujuan: "Melaksanakan pengembangan dan implementasi Sistem Informasi Akademik terpadu berbasis web dan mobile",
          tanggalPelaksanaan: "2026-06-01",
          lokasiPembuatan: "Bandar Lampung",
          tanggalSuratKeluar: "2026-05-28",
        },
        catatan: null,
      },
    ]);
  }

  if (getProgress().length === 0) {
    saveProgress([
      { id: "PRG-DEMO-001", proyekId: "PRY-DEMO-001", keteranganProgress: "Analisis kebutuhan dan pembuatan Use Case diagram selesai", stafPelapor: "Nurrahma, S.Kom., M.T.", tanggalProgress: "5 Juni 2026", lampiran: null, catatan: null },
      { id: "PRG-DEMO-002", proyekId: "PRY-DEMO-001", keteranganProgress: "Desain database dan arsitektur sistem selesai", stafPelapor: "Nurrahma, S.Kom., M.T.", tanggalProgress: "10 Juni 2026", lampiran: null, catatan: "Menggunakan PostgreSQL" },
      { id: "PRG-DEMO-003", proyekId: "PRY-DEMO-001", keteranganProgress: "Pengembangan modul login dan dashboard mahasiswa selesai", stafPelapor: "Nurrahma, S.Kom., M.T.", tanggalProgress: "15 Juni 2026", lampiran: null, catatan: "Siap untuk review" },
    ]);
  }

  if (getDokumentasi().filter(d => d.refId === "PKJ-DEMO-001" && !d.judul.startsWith("Surat Masuk:")).length === 0) {
    saveDokumentasi([
      ...getDokumentasi(),
      {
        id: "DOK-DEMO-001",
        refId: "PKJ-DEMO-001",
        jenis: "PEKERJAAN",
        judul: "Dokumentasi Akhir Pekerjaan",
        filePath: "dokumentasi_instalasi_switch.pdf",
        fileData: undefined,
        fileSize: 420000,
        tanggal: "19 Juni 2026",
        uploadedBy: "Nyoman Herman Ardike, S.T.",
      },
      {
        id: "DOK-DEMO-002",
        refId: "PRY-DEMO-001",
        jenis: "PROYEK",
        judul: "Dokumentasi Akhir Pekerjaan",
        filePath: "dokumentasi_akhir_sia.pdf",
        fileData: undefined,
        fileSize: 890000,
        tanggal: "16 Juni 2026",
        uploadedBy: "Nurrahma, S.Kom., M.T.",
      },
    ]);
  }

  if (getHasilSurvey().filter(s => s.refId === "PKJ-DEMO-001").length === 0) {
    saveHasilSurvey([
      ...getHasilSurvey(),
      {
        id: "SRV-DEMO-001",
        refId: "PKJ-DEMO-001",
        jenis: "PEKERJAAN",
        namaKlien: "Ahmad Subarjo",
        nipKlien: "197512102001121002",
        jawaban: [
          { pertanyaanId: "Q1", nilaiPilihan: 5 },
          { pertanyaanId: "Q2", nilaiPilihan: 4 },
          { pertanyaanId: "Q3", nilaiPilihan: 5 },
          { pertanyaanId: "Q4", nilaiPilihan: 4 },
          { pertanyaanId: "Q5", nilaiPilihan: 5 },
          { pertanyaanId: "Q6", teksJawaban: "Pekerjaan berjalan dengan baik dan tepat waktu. Harap dipertahankan." },
        ],
        tanggalSurvey: "20 Juni 2026",
        surveyor: "Nyoman Herman Ardike, S.T.",
      },
      {
        id: "SRV-DEMO-002",
        refId: "PRY-DEMO-001",
        jenis: "PROYEK",
        namaKlien: "Siti Rahayu, S.Pd.",
        nipKlien: "198203152006042001",
        jawaban: [
          { pertanyaanId: "Q1", nilaiPilihan: 5 },
          { pertanyaanId: "Q2", nilaiPilihan: 5 },
          { pertanyaanId: "Q3", nilaiPilihan: 4 },
          { pertanyaanId: "Q4", nilaiPilihan: 5 },
          { pertanyaanId: "Q5", nilaiPilihan: 4 },
          { pertanyaanId: "Q6", teksJawaban: "Sistem sangat membantu proses administrasi akademik. Mohon tambahkan fitur laporan per semester." },
        ],
        tanggalSurvey: "17 Juni 2026",
        surveyor: "Nurrahma, S.Kom., M.T.",
      },
    ]);
  }
}
