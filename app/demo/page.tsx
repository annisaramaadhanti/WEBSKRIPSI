"use client";
import { useState } from "react";

const FIELD = "flex flex-col gap-[5px] mb-4 [&>label]:uppercase [&>label]:font-bold [&>label]:text-[12px] [&>label]:text-[var(--text)] [&>label]:tracking-[0.4px] [&>input]:w-full [&>input]:outline-none [&>input]:px-[13px] [&>input]:py-[10px] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--r-sm)] [&>input]:text-[13px] [&>input]:text-[var(--text)] [&>input]:bg-[var(--surface)] [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:px-[13px] [&>textarea]:py-[10px] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--r-sm)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text)] [&>textarea]:bg-[var(--surface)] [&>textarea]:resize-y [&>textarea]:min-h-[80px] [&>select]:w-full [&>select]:outline-none [&>select]:px-[13px] [&>select]:py-[10px] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--r-sm)] [&>select]:text-[13px] [&>select]:text-[var(--text)] [&>select]:bg-[var(--surface)]";
const MODAL = "overflow-y-auto bg-[var(--surface)] rounded-[var(--r-xl)] p-7 w-full max-h-[90vh] shadow-[var(--shadow-xl)] border border-[var(--border-soft)] [&>h2]:m-0 [&>h2]:font-bold [&>h2]:text-[17px] [&>h2]:text-[var(--navy-900)] [&>h2]:mb-[18px] [&>h2]:pb-[14px] [&>h2]:border-b [&>h2]:border-[var(--border-soft)]";
const OVERLAY = "fixed inset-0 flex items-center justify-center bg-[rgba(11,30,75,0.50)] z-[9999] p-5 backdrop-blur-[5px]";
const BTN_PRIMARY = "inline-flex items-center justify-center gap-[6px] px-[20px] py-[9px] rounded-[var(--r-sm)] bg-[#0B1E4B] text-white text-[13px] font-semibold cursor-pointer border-none shadow-[0_2px_8px_rgba(11,30,75,0.25)] transition-all hover:bg-[#0F2150]";
const BTN_OUTLINE = "inline-flex items-center justify-center gap-[6px] px-[18px] py-[9px] rounded-[var(--r-sm)] bg-transparent text-[#64748B] text-[13px] font-semibold cursor-pointer border border-[1.5px] border-[#CBD5E1] transition-all hover:bg-[#F1F5F9]";
const BTN_DANGER = "inline-flex items-center justify-center gap-[6px] px-[20px] py-[9px] rounded-[var(--r-sm)] bg-[#C73434] text-white text-[13px] font-semibold cursor-pointer border-none shadow-[0_2px_8px_rgba(199,52,52,0.25)] transition-all hover:bg-[#A02020]";
const DIVIDER = "flex items-center uppercase font-bold gap-2 text-[10px] tracking-[0.8px] text-[var(--navy-700)] my-2 mb-4 px-3 py-[7px] bg-[var(--navy-50)] rounded-lg border-l-[3px] border-[var(--navy-600)]";
const FOOTER = "flex flex-wrap items-center gap-3 mt-5 pt-[14px] border-t border-[var(--border-soft)]";

const STAF_DUMMY = [
  { id: "1", nama: "Aditya Dwi Abrianto, S.E.", nip: "198710052025211077", divisi: "Layanan Sistem dan Teknologi Informasi" },
  { id: "2", nama: "Alifan Akbar Ikhsansah, A.Md.Kom.", nip: "122302000714101", divisi: "Layanan Sistem dan Teknologi Informasi" },
  { id: "3", nama: "Aprily Ayu Anbar, S.T.", nip: "122111970422201", divisi: "Manajemen dan Integrasi Sistem Teknologi Informasi" },
  { id: "4", nama: "Boby Mardani, S.Kom., S.E.", nip: "198804052025211066", divisi: "Layanan Sistem dan Teknologi Informasi" },
  { id: "5", nama: "Harno, S.I.Kom.", nip: "198204132025211037", divisi: "Pusat Data dan Keamanan Informasi" },
];

const MODALS = [
  "Tambah Pekerjaan",
  "Tambah Proyek",
  "Disposisi Staf",
  "Buat Surat Tugas",
  "Konfirmasi Publish",
  "Tolak Tugas",
  "Tambah Progress Proyek",
  "Ringkasan Pekerjaan",
];

export default function DemoPage() {
  const [active, setActive] = useState<number | null>(null);
  const [checked, setChecked] = useState<string[]>(["1", "3"]);
  const [alasan, setAlasan] = useState("Saya sedang memiliki beban kerja yang sangat tinggi sehingga tidak dapat menyelesaikan tugas ini tepat waktu.");

  const avatarInitials = (nama: string) => nama.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-1">SIMPROTIK — Screenshot Demo</div>
          <h1 className="text-[22px] font-bold text-[var(--navy-900)] mb-1">Pop-up / Modal Antarmuka</h1>
          <p className="text-[13px] text-[var(--text-muted)]">Klik salah satu tombol di bawah untuk membuka modal dengan data dummy.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MODALS.map((label, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="text-left px-5 py-4 rounded-[var(--r-lg)] bg-white border border-[var(--border-soft)] shadow-[var(--shadow-xs)] cursor-pointer transition-all hover:border-[var(--navy-200)] hover:shadow-[var(--shadow-sm)] hover:bg-[var(--navy-50)]">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-[2px]">Modal {i + 1}</div>
              <div className="text-[14px] font-semibold text-[var(--navy-900)]">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 1. TAMBAH PEKERJAAN ─── */}
      {active === 0 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[520px]`} onClick={e => e.stopPropagation()}>
            <h2>+ Tambah Pekerjaan</h2>
            <div className={FIELD}><label>Nama Pekerjaan *</label><input defaultValue="Pemetaan Kebutuhan Akun SSO Mahasiswa Baru" /></div>
            <div className={FIELD}><label>Unit Peminta *</label>
              <select defaultValue="bak"><option value="bak">Biro Akademik dan Kemahasiswaan</option></select>
            </div>
            <div className={FIELD}>
              <label>Divisi Penanggungjawab *</label>
              <div className="flex flex-col gap-[6px] mt-[4px]">
                {["Layanan Sistem dan Teknologi Informasi", "Manajemen dan Integrasi Sistem Teknologi Informasi", "Infrastruktur Jaringan", "Pengembangan dan Inovasi Teknologi Informasi"].map(d => (
                  <label key={d} className="flex items-center gap-[8px] cursor-pointer text-[13px] text-[var(--text)] py-[2px]">
                    <input type="checkbox" defaultChecked={d === "Layanan Sistem dan Teknologi Informasi"} readOnly /> {d}
                  </label>
                ))}
              </div>
            </div>
            <div className={FIELD}><label>Lokasi *</label><textarea rows={2} defaultValue="Gedung Rektorat Lantai 2, Ruang Sidang Utama" /></div>
            <div className={FIELD}><label>Target Selesai *</label><input type="date" defaultValue="2026-08-30" /></div>
            <div className={DIVIDER}>Surat Masuk</div>
            <div className={FIELD}><label>Nomor Surat Masuk *</label><input defaultValue="001/UN26/BAK/2026" /></div>
            <div className={FIELD}><label>Perihal Surat Masuk *</label><textarea rows={2} defaultValue="Permohonan Pembuatan dan Pemetaan Akun SSO untuk Mahasiswa Baru Tahun Ajaran 2026/2027" /></div>
            <div className={FIELD}>
              <label>Dokumen Surat Masuk (PDF) *</label>
              <div className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] w-fit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Pilih File PDF
              </div>
            </div>
            <div className={FOOTER}>
              <button className={BTN_PRIMARY}>Simpan</button>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. TAMBAH PROYEK ─── */}
      {active === 1 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[520px]`} onClick={e => e.stopPropagation()}>
            <h2>+ Tambah Proyek</h2>
            <div className={FIELD}><label>Nama Proyek *</label><input defaultValue="Pengembangan Sistem Informasi Akademik Terintegrasi" /></div>
            <div className={FIELD}><label>Unit Peminta *</label>
              <select defaultValue="lp3m"><option value="lp3m">Lembaga Penelitian dan Pengabdian Masyarakat</option></select>
            </div>
            <div className={FIELD}><label>Lokasi *</label><textarea rows={2} defaultValue="Gedung UPA TIK Lantai 3, Laboratorium Pengembangan" /></div>
            <div className={FIELD}><label>Target Selesai *</label><input type="date" defaultValue="2026-12-31" /></div>
            <div className={DIVIDER}>Surat Masuk</div>
            <div className={FIELD}><label>Nomor Surat Masuk *</label><input defaultValue="012/UN26/LP3M/2026" /></div>
            <div className={FIELD}><label>Perihal Surat Masuk *</label><textarea rows={2} defaultValue="Permohonan Pengembangan Sistem Informasi Akademik Terintegrasi Universitas Lampung" /></div>
            <div className={FIELD}>
              <label>Dokumen Surat Masuk (PDF) *</label>
              <div className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] w-fit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Pilih File PDF
              </div>
            </div>
            <div className={FOOTER}>
              <button className={BTN_PRIMARY}>Simpan</button>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. DISPOSISI STAF ─── */}
      {active === 2 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[840px]`} onClick={e => e.stopPropagation()}>
            <h2>Disposisi Staf</h2>
            <div className={FIELD}>
              <label>Pekerjaan</label>
              <input readOnly value="Pemetaan Kebutuhan Akun SSO Mahasiswa Baru" className="w-full outline-none px-[13px] py-[10px] border border-[var(--border)] rounded-[var(--r-sm)] text-[13px] text-[var(--text)] bg-[var(--surface-alt)] cursor-default" />
            </div>
            <div className="flex flex-col gap-[5px] mb-4">
              <label className="uppercase font-bold text-[12px] text-[var(--text)] tracking-[0.4px]">Pilih Staf *</label>
              <input
                className="w-full outline-none px-[13px] py-[10px] border border-[var(--border)] rounded-[var(--r-sm)] text-[13px] text-[var(--text)] bg-[var(--surface)]"
                placeholder="Cari nama, NIP, atau divisi..."
                defaultValue=""
              />
              <div className="border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden mt-1 max-h-[260px] overflow-y-auto">
                {STAF_DUMMY.map(s => (
                  <div key={s.id}
                    className={`flex items-center gap-3 px-[13px] py-[10px] border-b border-[var(--border-soft)] cursor-pointer transition-all last:border-b-0 ${checked.includes(s.id) ? "bg-[var(--navy-50)]" : "hover:bg-[var(--surface-alt)]"}`}
                    onClick={() => setChecked(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}>
                    <div className="w-[32px] h-[32px] rounded-full bg-[var(--navy-100)] text-[var(--navy-700)] flex items-center justify-center text-[11px] font-bold shrink-0">
                      {avatarInitials(s.nama)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[var(--text)]">{s.nama}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{s.nip} · <span className="text-[#2563EB]">{s.divisi}</span></div>
                    </div>
                    {checked.includes(s.id) && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#0B1E4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                ))}
              </div>
            </div>
            {checked.length > 0 && (
              <div className="mb-4">
                <label className="uppercase font-bold text-[12px] text-[var(--text)] tracking-[0.4px] block mb-2">Staf Dipilih ({checked.length})</label>
                <div className="flex flex-col gap-2">
                  {checked.map(id => {
                    const s = STAF_DUMMY.find(x => x.id === id)!;
                    return (
                      <div key={id} className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--navy-50)] border border-[var(--navy-100)] rounded-[var(--r-md)]">
                        <span className="text-[13px] font-semibold text-[var(--navy-900)]">{s.nama}</span>
                        <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[var(--text-soft)]">
                          <input type="checkbox" defaultChecked /> Sertakan dalam Surat Tugas
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className={FOOTER}>
              <button className={BTN_PRIMARY}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Simpan Disposisi
              </button>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. BUAT SURAT TUGAS ─── */}
      {active === 3 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[680px]`} onClick={e => e.stopPropagation()}>
            <h2>Buat Preview Surat Tugas</h2>
            <div className={FIELD}><label>Nomor Surat *</label><input defaultValue="ST/012/UN26.UPA/2026" /></div>
            <div className={FIELD}><label>Perihal *</label><input defaultValue="Surat Tugas Pemetaan Kebutuhan Akun SSO Mahasiswa Baru" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className={FIELD}><label>Tanggal Mulai *</label><input type="date" defaultValue="2026-07-01" /></div>
              <div className={FIELD}><label>Tanggal Selesai *</label><input type="date" defaultValue="2026-07-14" /></div>
            </div>
            <div className={FIELD}><label>Dasar *</label><textarea rows={2} defaultValue="Surat Permohonan Nomor 001/UN26/BAK/2026 tanggal 15 Juni 2026" /></div>
            <div className={FIELD}><label>Instruksi / Keterangan</label><textarea rows={3} defaultValue="Melaksanakan pemetaan dan pembuatan akun SSO untuk mahasiswa baru Tahun Ajaran 2026/2027 sesuai dengan data yang diberikan oleh Biro Akademik dan Kemahasiswaan." /></div>
            <div className="mb-4">
              <label className="uppercase font-bold text-[12px] text-[var(--text)] tracking-[0.4px] block mb-2">Staf Ditugaskan</label>
              <div className="border border-[var(--border-soft)] rounded-[var(--r-md)] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead><tr className="bg-[var(--surface-alt)] text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.5px]">
                    <th className="text-left px-4 py-2">Nama</th><th className="text-left px-4 py-2">NIP</th><th className="text-left px-4 py-2">Divisi</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-t border-[var(--border-soft)]"><td className="px-4 py-2">Aditya Dwi Abrianto, S.E.</td><td className="px-4 py-2">198710052025211077</td><td className="px-4 py-2">Layanan Sistem dan TI</td></tr>
                    <tr className="border-t border-[var(--border-soft)]"><td className="px-4 py-2">Aprily Ayu Anbar, S.T.</td><td className="px-4 py-2">122111970422201</td><td className="px-4 py-2">Manajemen & Integrasi</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className={FOOTER}>
              <button className={BTN_PRIMARY}>Buat Preview PDF</button>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. KONFIRMASI PUBLISH ─── */}
      {active === 4 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[440px]`} onClick={e => e.stopPropagation()}>
            <h2>Konfirmasi Publish Surat Tugas</h2>
            <div className="flex flex-col gap-3 mb-2">
              <div className="flex items-start gap-3 p-4 bg-[#FEF9E7] border border-[#F5D65B] rounded-[var(--r-md)]">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-[1px]"><path d="M9 2L1.5 15h15L9 2z" stroke="#D4A017" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 7v4M9 13v.5" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <p className="text-[13px] text-[#8A6010] leading-[1.6] m-0">Setelah di-publish, surat tugas <strong>tidak dapat diubah</strong> lagi. Pastikan semua data sudah benar sebelum melanjutkan.</p>
              </div>
              <div className="p-4 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-md)]">
                <div className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-[0.5px] mb-2">Detail Surat Tugas</div>
                <div className="flex flex-col gap-[6px] text-[13px]">
                  <div><span className="text-[var(--text-muted)]">Nomor:</span> <span className="font-semibold">ST/012/UN26.UPA/2026</span></div>
                  <div><span className="text-[var(--text-muted)]">Perihal:</span> <span className="font-semibold">Pemetaan Kebutuhan Akun SSO Mahasiswa Baru</span></div>
                  <div><span className="text-[var(--text-muted)]">Staf:</span> <span className="font-semibold">2 orang</span></div>
                </div>
              </div>
            </div>
            <div className={FOOTER}>
              <button className={BTN_PRIMARY}>Ya, Publish Sekarang</button>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. TOLAK TUGAS ─── */}
      {active === 5 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[480px]`} onClick={e => e.stopPropagation()}>
            <h2>Tolak Penugasan</h2>
            <div className="flex items-start gap-3 p-4 bg-[#FEE8E8] border border-[#FDCACA] rounded-[var(--r-md)] mb-4">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-[2px]"><circle cx="8" cy="8" r="6.5" stroke="#C73434" strokeWidth="1.3"/><path d="M8 5v4M8 11v.5" stroke="#C73434" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <p className="text-[13px] text-[var(--danger-600)] m-0 leading-[1.6]">Anda akan menolak penugasan untuk pekerjaan <strong>&ldquo;Pemetaan Kebutuhan Akun SSO Mahasiswa Baru&rdquo;</strong>. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex flex-col gap-[5px] mb-4">
              <label className="uppercase font-bold text-[12px] text-[var(--text)] tracking-[0.4px]">Alasan Penolakan *</label>
              <textarea
                className="w-full outline-none px-[13px] py-[10px] border border-[var(--border)] rounded-[var(--r-sm)] text-[13px] text-[var(--text)] bg-[var(--surface)] resize-y min-h-[100px]"
                rows={4}
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                placeholder="Jelaskan alasan penolakan penugasan ini..."
              />
            </div>
            <div className={FOOTER}>
              <button className={BTN_DANGER}>Tolak Penugasan</button>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. TAMBAH PROGRESS PROYEK ─── */}
      {active === 6 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[520px]`} onClick={e => e.stopPropagation()}>
            <h2>Tambah Progress Proyek</h2>
            <div className="p-3 bg-[var(--surface-alt)] border border-[var(--border-soft)] rounded-[var(--r-md)] mb-4 text-[13px]">
              <span className="text-[var(--text-muted)]">Proyek:</span> <span className="font-semibold">Pengembangan Sistem Informasi Akademik Terintegrasi</span>
            </div>
            <div className={FIELD}><label>Tanggal Progress *</label><input type="date" defaultValue="2026-06-21" /></div>
            <div className={FIELD}><label>Keterangan Progress *</label><textarea rows={3} defaultValue="Selesai melakukan analisis kebutuhan sistem dan pembuatan wireframe antarmuka pengguna. Tim telah menyepakati arsitektur sistem yang akan digunakan." /></div>
            <div className="flex flex-col gap-[5px] mb-4">
              <label className="uppercase font-bold text-[12px] text-[var(--text)] tracking-[0.4px]">Lampiran Dokumentasi (PDF/Gambar)</label>
              <div className="inline-flex items-center cursor-pointer font-semibold gap-[7px] px-[16px] py-[9px] border-[1.5px] border-dashed border-[var(--navy-500)] rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy-700)] text-[13px] w-fit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Pilih File
              </div>
              <div className="flex items-center font-semibold gap-[6px] px-[10px] py-[6px] bg-[#EEF5FF] border border-[#C9DEFF] rounded-[var(--r-sm)] text-[12px] text-[#1A3E8A] w-fit">
                dokumen_analisis_kebutuhan.pdf
              </div>
            </div>
            <div className={FOOTER}>
              <button className={BTN_PRIMARY}>Simpan Progress</button>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. RINGKASAN PEKERJAAN ─── */}
      {active === 7 && (
        <div className={OVERLAY} onClick={() => setActive(null)}>
          <div className={`${MODAL} max-w-[680px]`} onClick={e => e.stopPropagation()}>
            <h2>Ringkasan Pekerjaan</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                ["Nama Pekerjaan", "Pemetaan Kebutuhan Akun SSO Mahasiswa Baru"],
                ["Unit Peminta", "Biro Akademik dan Kemahasiswaan"],
                ["Target Selesai", "30 Agustus 2026"],
                ["Status", "Ditugaskan"],
                ["Nomor Surat Masuk", "001/UN26/BAK/2026"],
                ["Lokasi", "Gedung Rektorat Lantai 2, Ruang Sidang Utama"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-[3px]">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.5px]">{k}</span>
                  <span className="text-[13px] font-semibold text-[var(--text)]">{k === "Status"
                    ? <span className="inline-flex items-center font-semibold px-[10px] py-[3px] rounded-full text-[11px] bg-[#FEF3C7] text-[#D4A017]">Ditugaskan</span>
                    : v}</span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.5px] mb-2">Divisi Penanggungjawab</div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-[var(--navy-50)] text-[var(--navy-700)] border border-[var(--navy-100)]">Layanan Sistem dan Teknologi Informasi</span>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.5px] mb-2">Staf Ditugaskan</div>
              <div className="border border-[var(--border-soft)] rounded-[var(--r-md)] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead><tr className="bg-[var(--surface-alt)] text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.5px]">
                    <th className="text-left px-4 py-2">Nama</th>
                    <th className="text-center px-4 py-2">Konfirmasi</th>
                    <th className="text-center px-4 py-2">Surat Tugas</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-t border-[var(--border-soft)]">
                      <td className="px-4 py-2 font-semibold">Aditya Dwi Abrianto, S.E.</td>
                      <td className="px-4 py-2 text-center"><span className="inline-flex items-center px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#E8F5EE] text-[#1F8A4C]">Diterima</span></td>
                      <td className="px-4 py-2 text-center"><span className="text-[#16A34A]">✓</span></td>
                    </tr>
                    <tr className="border-t border-[var(--border-soft)]">
                      <td className="px-4 py-2 font-semibold">Aprily Ayu Anbar, S.T.</td>
                      <td className="px-4 py-2 text-center"><span className="inline-flex items-center px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#D4A017]">Menunggu</span></td>
                      <td className="px-4 py-2 text-center"><span className="text-[var(--text-muted)]">—</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className={FOOTER}>
              <button className={BTN_OUTLINE} onClick={() => setActive(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
