# SIMPROTIK

**Sistem Informasi Manajemen Proyek & Kinerja**  
UPA Teknologi Informasi dan Komunikasi — Universitas Lampung

---

## Instalasi

```bash
cd output
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Akun Demo

| Role | Email | Password |
|---|---|---|
| Operator | operator@upa.id | operator123 |
| Kepala UPA | kaupa@upa.id | kaupa123 |
| Kepala Divisi (Infrastruktur Jaringan) | hendri.susanto@staff.unila.ac.id | kadiv123 |
| Staf (Infrastruktur Jaringan) | nyoman.herman@staff.unila.ac.id | staf123 |
| Kepala Divisi (Pengembangan & Inovasi TI) | rico.andrian@staff.unila.ac.id | kadiv123 |
| Staf (Pengembangan & Inovasi TI) | nurrahma@staff.unila.ac.id | staf123 |

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
