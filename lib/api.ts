/**
 * API layer — semua request ke backend Laravel.
 * Base URL: http://127.0.0.1:8000/api
 *
 * - Upload file  → form-data
 * - Request biasa → raw JSON
 * - Edit pekerjaan/proyek → POST /edit (bukan PUT)
 */

const BASE = "http://127.0.0.1:8000/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} gagal: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} gagal: ${res.status}`);
  return res.json();
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  if (!res.ok) throw new Error(`POST ${path} gagal: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export interface LoginResponse {
  data: {
    uuid: string;
    nama_lengkap: string;
    NIP: string;
    email: string;
    peran: string;
    divisi: { uuid: string; nama_divisi: string } | null;
  };
}

export async function loginUser(nip: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ nip, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `Login gagal: ${res.status}`);
  return json as LoginResponse;
}

// ─────────────────────────────────────────────
// MASTER DATA
// ─────────────────────────────────────────────

export const getMasterUnitKerja = () => get("/master/unit-kerja");
export const getMasterDivisi = () => get("/master/divisi");
export const getMasterStatusKinerja = () => get("/master/status-kinerja");
export const getMasterStatusKonfirmasi = () => get("/master/status-konfirmasi");

/** Daftar staf. Opsional: search nama atau filter id_divisi */
export const getMasterStaf = (params?: { search?: string; id_divisi?: string }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.id_divisi) q.set("id_divisi", params.id_divisi);
  const qs = q.toString();
  return get(`/master/pengguna/staf${qs ? `?${qs}` : ""}`);
};

// ─────────────────────────────────────────────
// PEKERJAAN
// ─────────────────────────────────────────────

export interface FilterPekerjaan {
  search?: string;
  status?: string;
  unit?: string;
  id_divisi?: string;
  id_pengguna_staf?: string;
  id_status_konfirmasi?: string;
}

export const getPekerjaanList = (filter?: FilterPekerjaan) => {
  const q = new URLSearchParams();
  if (filter?.search) q.set("search", filter.search);
  if (filter?.status) q.set("status", filter.status);
  if (filter?.unit) q.set("unit", filter.unit);
  if (filter?.id_divisi) q.set("id_divisi", filter.id_divisi);
  if (filter?.id_pengguna_staf) q.set("id_pengguna_staf", filter.id_pengguna_staf);
  if (filter?.id_status_konfirmasi) q.set("id_status_konfirmasi", filter.id_status_konfirmasi);
  const qs = q.toString();
  return get(`/pekerjaan${qs ? `?${qs}` : ""}`);
};

export const getPekerjaanDetail = (id: string) => get(`/pekerjaan/${id}`);

/**
 * Tambah pekerjaan — semua field wajib, termasuk dokumen_surat (File).
 * id_pengguna = uuid operator yang sedang login.
 */
export const tambahPekerjaan = (payload: {
  id_pengguna: string;
  id_unit: string;
  id_divisi?: string;
  nama_pekerjaan: string;
  lokasi: string;
  target_selesai: string;
  nomor_surat: string;
  perihal: string;
  dokumen_surat: File;
}) => {
  const form = new FormData();
  form.append("id_pengguna", payload.id_pengguna);
  form.append("id_unit", payload.id_unit);
  if (payload.id_divisi) form.append("id_divisi", payload.id_divisi);
  form.append("nama_pekerjaan", payload.nama_pekerjaan);
  form.append("lokasi", payload.lokasi);
  form.append("target_selesai", payload.target_selesai);
  form.append("nomor_surat", payload.nomor_surat);
  form.append("perihal", payload.perihal);
  form.append("dokumen_surat", payload.dokumen_surat);
  return postForm("/pekerjaan", form);
};

/**
 * Edit pekerjaan — dokumen_surat opsional (kosong = pakai file lama).
 * Hanya saat status Ditugaskan dan surat tugas belum published.
 */
export const editPekerjaan = (
  id: string,
  payload: {
    id_unit: string;
    nama_pekerjaan: string;
    lokasi: string;
    target_selesai: string;
    nomor_surat: string;
    perihal: string;
    dokumen_surat?: File;
  }
) => {
  const form = new FormData();
  form.append("id_unit", payload.id_unit);
  form.append("nama_pekerjaan", payload.nama_pekerjaan);
  form.append("lokasi", payload.lokasi);
  form.append("target_selesai", payload.target_selesai);
  form.append("nomor_surat", payload.nomor_surat);
  form.append("perihal", payload.perihal);
  if (payload.dokumen_surat) form.append("dokumen_surat", payload.dokumen_surat);
  return postForm(`/pekerjaan/${id}/edit`, form);
};

/**
 * Disposisi pekerjaan ke staf.
 * sertakan_dalam_surat = true → staf masuk PDF surat tugas.
 */
export const disposisiPekerjaan = (
  id: string,
  staf: { id_pengguna: string; sertakan_dalam_surat: boolean }[]
) => post(`/pekerjaan/${id}/disposisi`, { staf });

export const terimaPekerjaan = (id_pekerjaan_staf: string) =>
  post(`/pekerjaan-staf/${id_pekerjaan_staf}/terima`, {});

export const tolakPekerjaan = (id_pekerjaan_staf: string, alasan_penolakan: string) =>
  post(`/pekerjaan-staf/${id_pekerjaan_staf}/tolak`, { alasan_penolakan });

export const mulaiPekerjaan = (id: string, id_pengguna: string) =>
  post(`/pekerjaan/${id}/mulai`, { id_pengguna });

// ─────────────────────────────────────────────
// PROYEK
// ─────────────────────────────────────────────

export interface FilterProyek {
  search?: string;
  status?: string;
  unit?: string;
  id_divisi?: string;
  id_pengguna_staf?: string;
  id_status_konfirmasi?: string;
}

export const getProyekList = (filter?: FilterProyek) => {
  const q = new URLSearchParams();
  if (filter?.search) q.set("search", filter.search);
  if (filter?.status) q.set("status", filter.status);
  if (filter?.unit) q.set("unit", filter.unit);
  if (filter?.id_divisi) q.set("id_divisi", filter.id_divisi);
  if (filter?.id_pengguna_staf) q.set("id_pengguna_staf", filter.id_pengguna_staf);
  if (filter?.id_status_konfirmasi) q.set("id_status_konfirmasi", filter.id_status_konfirmasi);
  const qs = q.toString();
  return get(`/proyek${qs ? `?${qs}` : ""}`);
};

export const getProyekDetail = (id: string) => get(`/proyek/${id}`);

export const tambahProyek = (payload: {
  id_pengguna: string;
  id_unit: string;
  nama_proyek: string;
  lokasi: string;
  target_selesai: string;
  nomor_surat: string;
  perihal: string;
  dokumen_surat: File;
}) => {
  const form = new FormData();
  form.append("id_pengguna", payload.id_pengguna);
  form.append("id_unit", payload.id_unit);
  form.append("nama_proyek", payload.nama_proyek);
  form.append("lokasi", payload.lokasi);
  form.append("target_selesai", payload.target_selesai);
  form.append("nomor_surat", payload.nomor_surat);
  form.append("perihal", payload.perihal);
  form.append("dokumen_surat", payload.dokumen_surat);
  return postForm("/proyek", form);
};

export const editProyek = (
  id: string,
  payload: {
    id_unit: string;
    nama_proyek: string;
    lokasi: string;
    target_selesai: string;
    nomor_surat: string;
    perihal: string;
    dokumen_surat?: File;
  }
) => {
  const form = new FormData();
  form.append("id_unit", payload.id_unit);
  form.append("nama_proyek", payload.nama_proyek);
  form.append("lokasi", payload.lokasi);
  form.append("target_selesai", payload.target_selesai);
  form.append("nomor_surat", payload.nomor_surat);
  form.append("perihal", payload.perihal);
  if (payload.dokumen_surat) form.append("dokumen_surat", payload.dokumen_surat);
  return postForm(`/proyek/${id}/edit`, form);
};

export const disposisiProyek = (
  id: string,
  staf: { id_pengguna: string; sertakan_dalam_surat: boolean }[]
) => post(`/proyek/${id}/disposisi`, { staf });

export const terimaProyek = (id_proyek_staf: string) =>
  post(`/proyek-staf/${id_proyek_staf}/terima`, {});

export const tolakProyek = (id_proyek_staf: string, alasan_penolakan: string) =>
  post(`/proyek-staf/${id_proyek_staf}/tolak`, { alasan_penolakan });

export const mulaiProyek = (id: string, id_pengguna: string) =>
  post(`/proyek/${id}/mulai`, { id_pengguna });

// ─────────────────────────────────────────────
// PROGRESS PROYEK
// ─────────────────────────────────────────────

export const getProgressProyek = (id_proyek: string, id_pengguna?: string) => {
  const qs = id_pengguna ? `?id_pengguna=${id_pengguna}` : "";
  return get(`/proyek/${id_proyek}/progress${qs}`);
};

export const tambahProgressProyek = (payload: {
  id_proyek: string;
  id_pengguna: string;
  keterangan: string;
  lampiran?: File[];
}) => {
  const form = new FormData();
  form.append("id_pengguna", payload.id_pengguna);
  form.append("keterangan", payload.keterangan);
  if (payload.lampiran) {
    payload.lampiran.forEach((f) => form.append("lampiran[]", f));
  }
  return postForm(`/proyek/${payload.id_proyek}/progress`, form);
};

// ─────────────────────────────────────────────
// SURAT TUGAS
// ─────────────────────────────────────────────

export const getSuratTugasPekerjaan = (id_pekerjaan: string) =>
  get(`/pekerjaan/${id_pekerjaan}/surat-tugas`);

export const getSuratTugasProyek = (id_proyek: string) =>
  get(`/proyek/${id_proyek}/surat-tugas`);

export interface SuratTugasPayload {
  nomor_surat: string;
  perihal: string;
  tujuan: string;
  tanggal_pelaksanaan: string;
  lokasi_pelaksanaan: string;
  lokasi_surat: string;
  tanggal_surat: string;
}

export const buatSuratTugasPekerjaan = (id_pekerjaan: string, payload: SuratTugasPayload) =>
  post(`/pekerjaan/${id_pekerjaan}/surat-tugas`, payload);

export const buatSuratTugasProyek = (id_proyek: string, payload: SuratTugasPayload) =>
  post(`/proyek/${id_proyek}/surat-tugas`, payload);

/** Buka PDF surat tugas — kembalikan URL langsung untuk dibuka di tab baru */
export const urlPdfSuratTugas = (id_surat_tugas: string) =>
  `${BASE}/surat-tugas/${id_surat_tugas}/pdf`;

export const publishSuratTugas = (id_surat_tugas: string) =>
  post(`/surat-tugas/${id_surat_tugas}/publish`, {});

// ─────────────────────────────────────────────
// DOKUMEN / FILE
// ─────────────────────────────────────────────

/** URL langsung untuk membuka file dokumen (surat masuk, lampiran, dll) */
export const urlDokumen = (id_dokumen: string) => `${BASE}/dokumen/${id_dokumen}/file`;

// ─────────────────────────────────────────────
// TINJAUAN KINERJA
// ─────────────────────────────────────────────

export const getTinjauanList = (params?: {
  hasil_tinjauan?: "menunggu" | "disetujui";
  tipe?: "pekerjaan" | "proyek";
}) => {
  const q = new URLSearchParams();
  if (params?.hasil_tinjauan) q.set("hasil_tinjauan", params.hasil_tinjauan);
  if (params?.tipe) q.set("tipe", params.tipe);
  const qs = q.toString();
  return get(`/tinjauan-kinerja${qs ? `?${qs}` : ""}`);
};

export const getTinjauanDetail = (id: string) => get(`/tinjauan-kinerja/${id}`);

export const accTinjauan = (id: string, payload: { id_ditinjau_oleh: string; catatan: string }) =>
  post(`/tinjauan-kinerja/${id}/acc`, payload);

/** URL langsung PDF laporan hasil — hanya tersedia setelah ACC */
export const urlLaporanPdf = (id: string) => `${BASE}/tinjauan-kinerja/${id}/laporan-pdf`;

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export interface DashboardParams {
  tahun?: number;
  bulan?: number;
}

const dashboardQuery = (params?: DashboardParams) => {
  const q = new URLSearchParams();
  if (params?.tahun) q.set("tahun", String(params.tahun));
  if (params?.bulan) q.set("bulan", String(params.bulan));
  return q.toString();
};

export const getDashboardPublik = (params?: DashboardParams) => {
  const qs = dashboardQuery(params);
  return get(`/dashboard/publik${qs ? `?${qs}` : ""}`);
};

export const getDashboardOperator = (params?: DashboardParams) => {
  const qs = dashboardQuery(params);
  return get(`/dashboard/operator${qs ? `?${qs}` : ""}`);
};

export const getDashboardKadiv = (params?: DashboardParams) => {
  const qs = dashboardQuery(params);
  return get(`/dashboard/kadiv${qs ? `?${qs}` : ""}`);
};

export const getDashboardStaf = (id_pengguna: string, params?: DashboardParams) => {
  const q = new URLSearchParams({ id_pengguna });
  if (params?.tahun) q.set("tahun", String(params.tahun));
  if (params?.bulan) q.set("bulan", String(params.bulan));
  return get(`/dashboard/staf?${q.toString()}`);
};

export const getDashboardKepalaUPA = (params?: DashboardParams) => {
  const qs = dashboardQuery(params);
  return get(`/dashboard/kepala-upa${qs ? `?${qs}` : ""}`);
};
