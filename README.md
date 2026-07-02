# SIMPROTIK

**Sistem Informasi Manajemen Proyek & Kinerja**  
UPA Teknologi Informasi dan Komunikasi — Universitas Lampung

---

## Instalasi

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Akun Demo

| Role | NIP | Password |
|---|---|---|
| Operator | 198610032025212042 | simprotik123 |
| Kepala UPA | 197203161999032002 | simprotik123 |
| Kepala Divisi (Infrastruktur Jaringan) | 198105112005011001 | simprotik123 |
| Staf (Infrastruktur Jaringan) | 199402152025211048 | simprotik123 |
| Kepala Divisi (Pengembangan & Inovasi TI) | 197506272005011001 | simprotik123 |
| Staf (Layanan Sistem dan Teknologi Informasi) | 198710052025211077 | simprotik123 |

---

## Alur Kerja

### Web

```
Operator → Tambah Pekerjaan/Proyek
Kadiv    → Disposisi (pilih staf)
Staf     → Terima / Tolak penugasan
           ↳ Tolak: isi alasan → Kadiv bisa Penugasan Ulang
Operator → Buat Preview Surat Tugas (setelah semua staf Diterima)
         → Publish Surat Tugas
Staf     → Mulai (setelah surat Published)
[Mobile] → Upload dokumentasi + Isi survei klien
Kadiv    → ACC di Tinjauan Kinerja
```

### Role & Hak Akses

| Role | Tambah | Disposisi | Buat Surat | Publish | ACC |
|---|---|---|---|---|---|
| Operator | ✅ | ✗ | ✅ | ✅ | ✗ |
| Kadiv | ✗ | ✅ | ✗ | ✗ | ✅ |
| Staf | ✗ | ✗ | ✗ | ✗ | ✗ |
| Kepala UPA | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## Catatan

- Upload dokumentasi akhir dan survei klien hanya dari **mobile** (belum tersedia di web)
- Setelah surat tugas di-Publish, data pekerjaan/proyek **terkunci** dan tidak bisa diedit
- Data dummy akan otomatis muncul saat localStorage kosong (1 pekerjaan + 1 proyek status Dalam Tinjauan, siap di-ACC)
- Untuk reset data: buka DevTools → Application → Local Storage → Clear All → Refresh
