/**
 * Mapper: konversi response API (snake_case) ke tipe frontend (camelCase).
 */

import type { Pekerjaan, Proyek, Assignee, Progress } from "@/types";

const STATUS_KINERJA_MAP: Record<string, string> = {
  "Ditugaskan": "assigned",
  "Sedang Berlangsung": "in_progress",
  "Dalam Tinjauan": "review",
  "Selesai": "done",
};

const STATUS_KONFIRMASI_MAP: Record<string, string> = {
  "Menunggu Konfirmasi": "pending",
  "Diterima": "accepted",
  "Ditolak": "rejected",
};

function mapAssignee(a: any): Assignee {
  const pengguna = a.pengguna ?? {};
  const divisiObj = a.divisi ?? {};
  const konfirmasiObj = a.status_konfirmasi ?? {};

  const statusKonfirmasi = (
    STATUS_KONFIRMASI_MAP[konfirmasiObj.nama_status ?? ""] ??
    a.statusKonfirmasi ??
    "pending"
  ) as import("@/types").StatusKonfirmasi;

  return {
    stafId: pengguna.uuid ?? a.uuid ?? a.id_pengguna ?? "",
    id_pekerjaan_staf: a.id_pekerjaan_staf ?? undefined,
    id_proyek_staf: a.id_proyek_staf ?? undefined,
    nama: pengguna.nama_lengkap ?? a.nama_lengkap ?? a.nama ?? "",
    nip: pengguna.NIP ?? a.NIP ?? a.nip ?? "",
    jabatan: pengguna.peran ?? a.peran ?? a.jabatan ?? "",
    divisi: divisiObj.nama_divisi ?? (typeof a.divisi === "string" ? a.divisi : "") ?? "",
    statusPekerjaan: a.status_pekerjaan ?? a.statusPekerjaan ?? "assigned",
    statusKonfirmasi,
    alasanPenolakan: a.alasan_penolakan ?? a.alasanPenolakan,
    masukSurat: a.sertakan_dalam_surat ?? a.masukSurat ?? true,
  };
}

export function mapPekerjaan(p: any): Pekerjaan {
  const assignees: Assignee[] = Array.isArray(p.staf ?? p.assignees)
    ? (p.staf ?? p.assignees).map(mapAssignee)
    : [];

  const namaStatus = p.status_kinerja?.nama_status ?? "";
  const status = (STATUS_KINERJA_MAP[namaStatus] ?? p.status ?? "assigned") as import("@/types").StatusPekerjaan;

  const divisiFromTujuan = Array.isArray(p.divisi_tujuan)
    ? p.divisi_tujuan.map((dt: any) => dt.divisi?.nama_divisi).filter(Boolean) as string[]
    : [];
  const divisiFromStaf = assignees.map((a) => a.divisi).filter(Boolean) as string[];
  const divisi = [...new Set([...divisiFromTujuan, ...divisiFromStaf])];

  const tinjauan = Array.isArray(p.tinjauan_kinerja) ? p.tinjauan_kinerja[0] : (p.tinjauan ?? null);

  return {
    id: p.id_pekerjaan ?? p.id ?? "",
    id_surat_tugas: p.surat_tugas?.id_surat_tugas ?? p.id_surat_tugas ?? undefined,
    id_dokumen_surat: p.surat_masuk?.id_dokumen ?? p.id_dokumen_surat ?? undefined,
    id_tinjauan: (Array.isArray(p.tinjauan_kinerja) ? p.tinjauan_kinerja[0]?.id_tinjauan : undefined) ?? p.id_tinjauan ?? undefined,
    namaPekerjaan: p.nama_pekerjaan ?? p.namaPekerjaan ?? "",
    status,
    suratMasuk: p.surat_masuk?.nomor_surat ?? p.surat_masuk?.dokumen?.file_path ?? p.suratMasuk ?? "",
    nomorSuratMasuk: p.surat_masuk?.nomor_surat ?? p.nomor_surat ?? p.nomorSuratMasuk ?? "",
    perihalSuratMasuk: p.surat_masuk?.perihal ?? p.perihal ?? p.perihalSuratMasuk ?? "",
    lokasiSuratMasuk: p.surat_masuk?.lokasi_surat ?? p.lokasi_surat ?? p.lokasiSuratMasuk ?? "",
    divisi,
    assignees,
    lokasi: p.lokasi ?? "",
    unitPeminta: p.unit_kerja?.nama_unit ?? p.unitPeminta ?? "",
    deskripsi: p.deskripsi ?? null,
    targetSelesai: p.target_selesai ?? p.targetSelesai ?? "",
    suratTugas: p.surat_tugas?.nomor_surat ?? p.surat_tugas?.dokumen?.file_path ?? p.suratTugas ?? null,
    suratStatus: p.surat_tugas?.status_surat ?? p.suratStatus ?? undefined,
    suratDetail: p.surat_tugas ? {
      nomorSurat: p.surat_tugas.nomor_surat ?? "",
      perihal: p.surat_tugas.perihal ?? "",
      tujuan: p.surat_tugas.tujuan ?? "",
      tanggalPelaksanaan: p.surat_tugas.tanggal_pelaksanaan ?? "",
      lokasiPembuatan: p.surat_tugas.lokasi_surat ?? "",
      tanggalSuratKeluar: p.surat_tugas.tanggal_surat ?? "",
    } : p.suratDetail,
    catatan: p.catatan ?? null,
    accBy: tinjauan?.peninjau ? {
      stafId: tinjauan.peninjau.uuid ?? "",
      nama: tinjauan.peninjau.nama_lengkap ?? "",
      nip: tinjauan.peninjau.NIP ?? "",
      jabatan: tinjauan.peninjau.peran ?? "",
    } : p.accBy ?? null,
    accAt: tinjauan?.ditinjau_at ?? p.accAt ?? null,
    catatanKadiv: tinjauan?.catatan ?? p.catatanKadiv ?? null,
  };
}

export function mapProyek(p: any): Proyek {
  const assignees: Assignee[] = Array.isArray(p.staf ?? p.assignees)
    ? (p.staf ?? p.assignees).map(mapAssignee)
    : [];

  const namaStatus = p.status_kinerja?.nama_status ?? "";
  const status = (STATUS_KINERJA_MAP[namaStatus] ?? p.status ?? "assigned") as import("@/types").StatusPekerjaan;

  const divisi = [...new Set(assignees.map((a) => a.divisi).filter(Boolean))] as string[];

  const tinjauan = Array.isArray(p.tinjauan_kinerja) ? p.tinjauan_kinerja[0] : (p.tinjauan ?? null);

  return {
    id: p.id_proyek ?? p.id ?? "",
    id_surat_tugas: p.surat_tugas?.id_surat_tugas ?? p.id_surat_tugas ?? undefined,
    id_dokumen_surat: p.surat_masuk?.id_dokumen ?? p.id_dokumen_surat ?? undefined,
    id_tinjauan: (Array.isArray(p.tinjauan_kinerja) ? p.tinjauan_kinerja[0]?.id_tinjauan : undefined) ?? p.id_tinjauan ?? undefined,
    namaProyek: p.nama_proyek ?? p.namaProyek ?? "",
    status,
    statusKonfirmasi: assignees[0]?.statusKonfirmasi ?? p.statusKonfirmasi ?? "pending",
    suratMasuk: p.surat_masuk?.nomor_surat ?? p.surat_masuk?.dokumen?.file_path ?? p.suratMasuk ?? "",
    nomorSuratMasuk: p.surat_masuk?.nomor_surat ?? p.nomor_surat ?? p.nomorSuratMasuk ?? "",
    perihalSuratMasuk: p.surat_masuk?.perihal ?? p.perihal ?? p.perihalSuratMasuk ?? "",
    lokasiSuratMasuk: p.surat_masuk?.lokasi_surat ?? p.lokasi_surat ?? p.lokasiSuratMasuk ?? "",
    divisi,
    lokasi: p.lokasi ?? "",
    unitPeminta: p.unit_kerja?.nama_unit ?? p.unitPeminta ?? "",
    staf: assignees[0]?.nama ?? (typeof p.staf === "string" ? p.staf : null) ?? null,
    stafId: assignees[0]?.stafId ?? p.stafId ?? null,
    nip: assignees[0]?.nip,
    jabatan: assignees[0]?.jabatan,
    assignees,
    deskripsi: p.deskripsi ?? null,
    targetSelesai: p.target_selesai ?? p.targetSelesai ?? "",
    suratTugas: p.surat_tugas?.nomor_surat ?? p.surat_tugas?.dokumen?.file_path ?? p.suratTugas ?? null,
    suratStatus: p.surat_tugas?.status_surat ?? p.suratStatus ?? undefined,
    suratDetail: p.surat_tugas ? {
      nomorSurat: p.surat_tugas.nomor_surat ?? "",
      perihal: p.surat_tugas.perihal ?? "",
      tujuan: p.surat_tugas.tujuan ?? "",
      tanggalPelaksanaan: p.surat_tugas.tanggal_pelaksanaan ?? "",
      lokasiPembuatan: p.surat_tugas.lokasi_surat ?? "",
      tanggalSuratKeluar: p.surat_tugas.tanggal_surat ?? "",
    } : p.suratDetail,
    catatan: p.catatan ?? null,
    accBy: tinjauan?.peninjau ? {
      stafId: tinjauan.peninjau.uuid ?? "",
      nama: tinjauan.peninjau.nama_lengkap ?? "",
      nip: tinjauan.peninjau.NIP ?? "",
      jabatan: tinjauan.peninjau.peran ?? "",
    } : p.accBy ?? null,
    accAt: tinjauan?.ditinjau_at ?? p.accAt ?? null,
    catatanKadiv: tinjauan?.catatan ?? p.catatanKadiv ?? null,
  };
}

export function extractList(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export function mapProgress(p: any): Progress {
  return {
    id: p.id_progress ?? p.id_laporan_harian ?? p.id ?? "",
    proyekId: p.id_proyek ?? p.proyekId ?? "",
    keteranganProgress: p.keterangan ?? p.keteranganProgress ?? "",
    stafPelapor: p.pengguna?.nama_lengkap ?? p.stafPelapor ?? "",
    tanggalProgress: p.created_at?.split("T")[0] ?? p.tanggalProgress ?? "",
    lampiran: p.lampiran?.[0]?.nama_file ?? p.lampiran ?? null,
    catatan: p.catatan ?? null,
  };
}
