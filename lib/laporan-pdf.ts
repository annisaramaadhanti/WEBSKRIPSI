/**
 * lib/laporan-pdf.ts
 * Generator PDF Laporan Hasil Pekerjaan / Proyek
 * Format sesuai template resmi UPA TIK Universitas Lampung
 */

import type { Pekerjaan, Proyek, Progress, Dokumentasi, HasilSurvey } from "@/types";
import { PERTANYAAN_SURVEY } from "@/lib/data";

export interface LaporanData {
  item: Pekerjaan | Proyek;
  jenis: "PEKERJAAN" | "PROYEK";
  progressList?: Progress[];
  dokumentasiList: Dokumentasi[];
  surveyList: HasilSurvey[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isImageFile(name: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name);
}

function fmtTgl(s?: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtNilai(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function avgSurvey(surveyList: HasilSurvey[]): number {
  if (!surveyList.length) return 0;
  const qIds = PERTANYAAN_SURVEY.filter(q => q.tipeJawaban === "pilihan").map(q => q.id);
  let total = 0, count = 0;
  surveyList.forEach(s => s.jawaban.forEach(j => {
    if (qIds.includes(j.pertanyaanId) && j.nilaiPilihan) { total += j.nilaiPilihan; count++; }
  }));
  return count > 0 ? total / count : 0;
}

// ── Generator utama ───────────────────────────────────────────────────────────

export function generateLaporanHTML(d: LaporanData): string {
  const { item, jenis, progressList = [], dokumentasiList, surveyList } = d;

  const namaItem = jenis === "PEKERJAAN"
    ? (item as Pekerjaan).namaPekerjaan
    : (item as Proyek).namaProyek;

  const assignees = item.assignees ?? [];

  // ── CSS ──
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt; color: #000; background: #fff;
      padding: 2cm 2.5cm;
    }
    .page { max-width: 720px; margin: 0 auto; }

    /* KOP */
    .kop { display: flex; align-items: center; gap: 18px; margin-bottom: 10px; }
    .kop img { width: 88px; height: auto; flex-shrink: 0; }
    .kop-kementerian { font-size: 11pt; text-align: center; line-height: 1.4; }
    .kop-univ { font-size: 14pt; font-weight: bold; text-align: center; margin-top: 2px; }
    .kop-upa  { font-size: 12pt; font-weight: bold; text-align: center; margin-top: 2px; }
    .kop-alamat { font-size: 9pt; text-align: center; margin-top: 3px; color: #333; }
    hr.tebal { border: none; border-top: 2.5px solid #000; margin: 8px 0 2px; }
    hr.tipis { border: none; border-top: 1px solid #000; margin: 0 0 20px; }

    /* Judul laporan */
    .lap-judul {
      text-align: center; font-size: 13pt; font-weight: bold;
      text-decoration: underline; letter-spacing: 0.5px;
      margin-bottom: 24px;
    }

    /* Section header */
    .sec { font-size: 11.5pt; font-weight: bold; margin: 22px 0 10px; }

    /* Info tabel (label : value) */
    .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 11pt; }
    .info-tbl td { padding: 3px 0; vertical-align: top; }
    .info-tbl .lbl { width: 220px; font-weight: bold; }
    .info-tbl .sep { width: 14px; }

    /* Data tabel */
    .data-tbl { width: 100%; border-collapse: collapse; margin: 8px 0 10px; font-size: 11pt; }
    .data-tbl th {
      border: 1px solid #000; padding: 6px 8px;
      text-align: center; font-weight: bold; background: #f0f0f0;
    }
    .data-tbl td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
    .data-tbl td.center { text-align: center; }

    /* Gambar dokumentasi */
    .dok-img {
      max-width: 100%; max-height: 380px;
      object-fit: contain; margin: 10px 0 6px;
      border: 1px solid #ccc;
      display: block;
    }
    .dok-meta { font-size: 10pt; color: #555; margin-bottom: 12px; }

    /* Tanda tangan */
    .ttd-wrap { margin-top: 36px; overflow: hidden; font-size: 11pt; }
    .ttd-box { float: right; text-align: center; width: 260px; }
    .ttd-jabatan { margin-bottom: 70px; }
    .ttd-nama { font-weight: bold; text-decoration: underline; }
    .ttd-nip  { margin-top: 3px; }

    hr.sec-line { border: none; border-top: 1px solid #000; margin: 14px 0 6px; }

    @media print { body { padding: 1.5cm 2cm; } }
  `;

  // ── 1. Identitas ──
  const sec1 = `
    <div class="sec">1. IDENTITAS LAYANAN</div>
    <hr class="sec-line"/>
    <table class="info-tbl"><tbody>
      <tr><td class="lbl">Nama ${jenis === "PEKERJAAN" ? "Pekerjaan" : "Proyek"}</td><td class="sep">:</td><td>${namaItem}</td></tr>
      <tr><td class="lbl">Tipe</td><td class="sep">:</td><td>${jenis === "PEKERJAAN" ? "Pekerjaan" : "Proyek"}</td></tr>
      <tr><td class="lbl">Unit Peminta</td><td class="sep">:</td><td>${item.unitPeminta || "-"}</td></tr>
      <tr><td class="lbl">Lokasi</td><td class="sep">:</td><td>${item.lokasi || "-"}</td></tr>
      <tr><td class="lbl">Target Selesai</td><td class="sep">:</td><td>${fmtTgl(item.targetSelesai)}</td></tr>
      <tr><td class="lbl">Status Akhir</td><td class="sep">:</td><td>Selesai</td></tr>
    </tbody></table>`;

  // ── 2. Administrasi ──
  const sd = item.suratDetail;
  const sec2 = `
    <div class="sec">2. ADMINISTRASI</div>
    <hr class="sec-line"/>
    <table class="info-tbl"><tbody>
      <tr><td class="lbl">Nomor Surat Masuk</td><td class="sep">:</td><td>${item.nomorSuratMasuk || "-"}</td></tr>
      <tr><td class="lbl">Perihal Surat Masuk</td><td class="sep">:</td><td>${item.perihalSuratMasuk || "-"}</td></tr>
      <tr><td class="lbl">Nomor Surat Tugas</td><td class="sep">:</td><td>${sd?.nomorSurat || "-"}</td></tr>
      <tr><td class="lbl">Tanggal Surat Tugas</td><td class="sep">:</td><td>${fmtTgl(sd?.tanggalSuratKeluar)}</td></tr>
      <tr><td class="lbl">Tanggal Pelaksanaan</td><td class="sep">:</td><td>${fmtTgl(sd?.tanggalPelaksanaan)}</td></tr>
      <tr><td class="lbl">Lokasi Pelaksanaan</td><td class="sep">:</td><td>${sd?.lokasiPembuatan || "-"}</td></tr>
    </tbody></table>`;

  // ── 3. Tim Pelaksana ──
  const timRows = assignees.length > 0
    ? assignees.map((a, i) => `
        <tr>
          <td class="center">${i + 1}</td>
          <td>${a.nama}</td>
          <td>${a.nip}</td>
          <td>${a.divisi}</td>
          <td>${a.jabatan}</td>
          <td class="center">${a.statusKonfirmasi === "accepted" ? "Diterima" : a.statusKonfirmasi === "rejected" ? "Ditolak" : "-"}</td>
        </tr>`).join("")
    : `<tr><td colspan="6" style="text-align:center;padding:10px;color:#888;">Tidak ada data staf.</td></tr>`;

  const sec3 = `
    <div class="sec">3. TIM PELAKSANA</div>
    <hr class="sec-line"/>
    <table class="data-tbl">
      <thead><tr>
        <th style="width:6%">No</th><th style="width:28%">Nama</th>
        <th style="width:22%">NIP</th><th>Divisi</th>
        <th style="width:10%">Peran</th><th style="width:12%">Konfirmasi</th>
      </tr></thead>
      <tbody>${timRows}</tbody>
    </table>`;

  // ── 4. Progress (khusus proyek) ──
  let sec4 = "";
  if (jenis === "PROYEK") {
    const progRows = progressList.length > 0
      ? progressList.map((p, i) => `
          <tr>
            <td class="center">${i + 1}</td>
            <td>${p.tanggalProgress}</td>
            <td>${p.stafPelapor}</td>
            <td>${p.keteranganProgress}</td>
            <td>${p.lampiran ? `Terlampir: ${p.lampiran}` : "-"}</td>
          </tr>`).join("")
      : `<tr><td colspan="5" style="text-align:center;padding:10px;color:#888;">Belum ada progress.</td></tr>`;

    sec4 = `
      <div class="sec">4. PROGRESS PROYEK</div>
      <hr class="sec-line"/>
      <table class="data-tbl">
        <thead><tr>
          <th style="width:6%">No</th><th style="width:20%">Tanggal</th>
          <th style="width:22%">Pengunggah</th><th>Keterangan</th><th style="width:20%">Lampiran</th>
        </tr></thead>
        <tbody>${progRows}</tbody>
      </table>`;
  }

  // ── 5. Dokumentasi Akhir ──
  const secNumDok = jenis === "PROYEK" ? 5 : 4;
  let dokHtml = "";
  const dokFinal = dokumentasiList.filter(d => !d.judul.startsWith("Surat Masuk:"));

  if (dokFinal.length > 0) {
    dokFinal.forEach(dok => {
      dokHtml += `
        <table class="info-tbl" style="margin-bottom:4px"><tbody>
          <tr><td class="lbl">Nama Dokumen</td><td class="sep">:</td><td>${dok.judul}</td></tr>
          <tr><td class="lbl">Pengunggah</td><td class="sep">:</td><td>${dok.uploadedBy}</td></tr>
          <tr><td class="lbl">Tanggal Upload</td><td class="sep">:</td><td>${dok.tanggal}</td></tr>
        </tbody></table>`;
      if (isImageFile(dok.filePath) && dok.fileData) {
        const ext = dok.filePath.split(".").pop()?.toLowerCase() || "jpeg";
        const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        dokHtml += `<img src="data:${mime};base64,${dok.fileData}" class="dok-img" alt="${dok.judul}" />`;
      } else {
        dokHtml += `<div class="dok-meta">Lampiran dokumentasi akhir: ${dok.filePath}</div>`;
      }
    });
  } else {
    dokHtml = `<p style="font-size:11pt;color:#888;">Belum ada dokumentasi akhir.</p>`;
  }

  const secDok = `
    <div class="sec">${secNumDok}. DOKUMENTASI AKHIR</div>
    <hr class="sec-line"/>
    ${dokHtml}`;

  // ── 6. Survei Klien ──
  const secNumSurvei = secNumDok + 1;
  let surveiHtml = "";

  if (surveyList.length > 0) {
    const avg = avgSurvey(surveyList);
    surveyList.forEach(sv => {
      const pilihanQ = PERTANYAAN_SURVEY.filter(q => q.tipeJawaban === "pilihan");
      const teksQ = PERTANYAAN_SURVEY.filter(q => q.tipeJawaban === "teks");
      const totalNilai = pilihanQ.reduce((s, q) => {
        const j = sv.jawaban.find(j => j.pertanyaanId === q.id);
        return s + (j?.nilaiPilihan || 0);
      }, 0);
      const avgSv = pilihanQ.length > 0 ? totalNilai / pilihanQ.length : 0;

      const surveiRows = [
        ...pilihanQ.map((q, i) => {
          const j = sv.jawaban.find(j => j.pertanyaanId === q.id);
          return `<tr>
            <td class="center">${i + 1}</td>
            <td>${q.teks}</td>
            <td class="center">${j?.nilaiPilihan ?? "-"}</td>
          </tr>`;
        }),
        ...teksQ.map((q) => {
          const j = sv.jawaban.find(j => j.pertanyaanId === q.id);
          return j?.teksJawaban ? `<tr>
            <td class="center">${pilihanQ.length + 1}</td>
            <td>${q.teks}</td>
            <td>${j.teksJawaban}</td>
          </tr>` : "";
        }),
      ].join("");

      surveiHtml += `
        <table class="info-tbl" style="margin-bottom:8px"><tbody>
          <tr><td class="lbl">Nama Klien</td><td class="sep">:</td><td>${sv.namaKlien || sv.surveyor || "-"}</td></tr>
          ${sv.nipKlien ? `<tr><td class="lbl">NIP Klien</td><td class="sep">:</td><td>${sv.nipKlien}</td></tr>` : ""}
          <tr><td class="lbl">Rata-rata Nilai</td><td class="sep">:</td><td>${fmtNilai(avgSv)}</td></tr>
        </tbody></table>
        <table class="data-tbl">
          <thead><tr>
            <th style="width:6%">No</th>
            <th>Pertanyaan</th>
            <th style="width:14%">Jawaban</th>
          </tr></thead>
          <tbody>${surveiRows}</tbody>
        </table>`;
    });
  } else {
    surveiHtml = `<p style="font-size:11pt;color:#888;">Belum ada data survei klien.</p>`;
  }

  const secSurvei = `
    <div class="sec">${secNumSurvei}. SURVEI KLIEN</div>
    <hr class="sec-line"/>
    ${surveiHtml}`;

  // ── 7. Tinjauan Kadiv ──
  const secNumTinjauan = secNumSurvei + 1;
  const accBy = item.accBy;
  const secTinjauan = `
    <div class="sec">${secNumTinjauan}. TINJAUAN KADIV</div>
    <hr class="sec-line"/>
    <table class="info-tbl"><tbody>
      <tr><td class="lbl">Hasil Tinjauan</td><td class="sep">:</td><td>Disetujui</td></tr>
      <tr><td class="lbl">Catatan</td><td class="sep">:</td><td>${item.catatanKadiv || "-"}</td></tr>
      <tr><td class="lbl">Peninjau</td><td class="sep">:</td><td>${accBy?.nama || "-"}</td></tr>
      <tr><td class="lbl">Tanggal ACC</td><td class="sep">:</td><td>${item.accAt || "-"}</td></tr>
    </tbody></table>`;

  // ── 8. Kesimpulan ──
  const secNumKes = secNumTinjauan + 1;
  const secKesimpulan = `
    <div class="sec">${secNumKes}. KESIMPULAN</div>
    <hr class="sec-line"/>
    <p style="font-size:11pt;text-align:justify;line-height:1.7;">
      ${jenis === "PEKERJAAN" ? "Pekerjaan" : "Proyek"} ini telah selesai dan disetujui melalui proses tinjauan kinerja.
      Laporan ini dapat digunakan sebagai bukti penyelesaian layanan UPA TIK.
    </p>`;

  // ── Tanda Tangan ──
  const lokasiTtd = item.suratDetail?.lokasiPembuatan || "Bandar Lampung";
  const tanggalTtd = item.accAt || new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const ttd = `
    <div class="ttd-wrap">
      <div class="ttd-box">
        <div>${lokasiTtd}, ${tanggalTtd}</div>
        <div class="ttd-jabatan">Peninjau,</div>
        <div class="ttd-nama">${accBy?.nama || "_____________________"}</div>
        <div class="ttd-nip">NIP ${accBy?.nip || "___________________"}</div>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>Laporan Hasil ${jenis === "PEKERJAAN" ? "Pekerjaan" : "Proyek"} — ${namaItem}</title>
<style>${css}</style>
</head>
<body>
<div class="page">

  <!-- KOP -->
  <div class="kop">
    <img src="/logo-unila.png" alt="Logo Universitas Lampung" />
    <div style="flex:1">
      <div class="kop-kementerian">UNIVERSITAS LAMPUNG</div>
      <div class="kop-upa">UPA TEKNOLOGI INFORMASI DAN KOMUNIKASI</div>
      <div class="kop-alamat">Jl. Prof. Dr. Sumantri Brojonegoro No.1, Gedong Meneng, Bandar Lampung 35145</div>
    </div>
  </div>
  <hr class="tebal"/><hr class="tipis"/>

  <!-- JUDUL -->
  <div class="lap-judul">LAPORAN HASIL ${jenis === "PEKERJAAN" ? "PEKERJAAN" : "PROYEK"}</div>

  ${sec1}
  ${sec2}
  ${sec3}
  ${sec4}
  ${secDok}
  ${secSurvei}
  ${secTinjauan}
  ${secKesimpulan}
  ${ttd}

</div>
</body>
</html>`;
}

export function openLaporanInTab(d: LaporanData): void {
  try {
    const html = generateLaporanHTML(d);
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  } catch (e) {
    alert("Gagal membuka laporan: " + (e instanceof Error ? e.message : "Unknown error"));
  }
}
