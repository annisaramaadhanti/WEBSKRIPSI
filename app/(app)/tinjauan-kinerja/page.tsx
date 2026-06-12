"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import {
  getPekerjaan, getProyek, updatePekerjaan, updateProyek, seedIfEmpty,
  getDokumentasiByRef, getHasilSurveyByRef, getProgressByProyekId,
} from "@/lib/storage";
import { openLaporanInTab } from "@/lib/laporan-pdf";
import type { Pekerjaan, StatusPekerjaan, Dokumentasi, HasilSurvey } from "@/types";

type TinjauanItem = {
  id: string;
  jenis: "PEKERJAAN" | "PROYEK";
  judul: string;
  unitPeminta: string;
  divisi: string[];
  staf: string | null;
  status: StatusPekerjaan;
  catatan: string | null;
  catatanKadiv?: string | null;
  targetSelesai: string;
  accBy?: { stafId: string; nama: string; nip: string; jabatan: string } | null;
  accAt?: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  // StatusKonfirmasi
  "pending":     "badge-yellow",
  "accepted":    "badge-green",
  "rejected":    "badge-red",
  // StatusPekerjaan
  "assigned":    "badge-purple",
  "in_progress": "badge-blue",
  "review":      "badge-yellow",
  "done":        "badge-green",
};

const STATUS_LABEL: Record<string, string> = {
  "pending":     "Menunggu Konfirmasi",
  "accepted":    "Diterima",
  "rejected":    "Ditolak",
  "assigned":    "Ditugaskan",
  "in_progress": "Sedang Berlangsung",
  "review":      "Dalam Tinjauan",
  "done":        "Selesai",
};

const TINJAUAN_STATUSES: StatusPekerjaan[] = ["review", "done"];

export default function TinjauanKinerjaPage() {
  const { role, user } = useRole();
  const [items, setItems] = useState<TinjauanItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterJenis, setFilterJenis] = useState<string>("semua");

  const [showACC, setShowACC] = useState<TinjauanItem | null>(null);
  const [catatanACC, setCatatanACC] = useState("");
  const [showDoc, setShowDoc] = useState<TinjauanItem | null>(null);
  const [docDokList, setDocDokList] = useState<Dokumentasi[]>([]);
  const [showSurvei, setShowSurvei] = useState<TinjauanItem | null>(null);
  const [surveiList, setSurveiList] = useState<HasilSurvey[]>([]);
  const [showRingkasan, setShowRingkasan] = useState<TinjauanItem | null>(null);

  const load = () => { seedIfEmpty();
    const pk = getPekerjaan().map((p: Pekerjaan): TinjauanItem => ({
      id: p.id, jenis: "PEKERJAAN", judul: p.namaPekerjaan,
      unitPeminta: p.unitPeminta || "—",
      divisi: p.divisi, status: p.status, catatan: p.catatan,
      catatanKadiv: p.catatanKadiv,
      targetSelesai: p.targetSelesai,
      staf: p.assignees.length > 0 ? p.assignees.map(a => a.nama).join(", ") : null,
      accBy: p.accBy, accAt: p.accAt,
    }));
    const pr = getProyek().map((p): TinjauanItem => ({
      id: p.id, jenis: "PROYEK", judul: p.namaProyek,
      unitPeminta: p.unitPeminta || "—",
      divisi: p.divisi, status: p.status, catatan: p.catatan,
      catatanKadiv: p.catatanKadiv,
      targetSelesai: p.targetSelesai,
      staf: p.assignees.length > 0 ? p.assignees.map(a => a.nama).join(", ") : p.staf,
      accBy: p.accBy, accAt: p.accAt,
    }));
    setItems([...pk, ...pr]);
  };

  useEffect(() => { load(); }, []);

  if (role === "staf") {
    return (
      <div>
        <div className="page-header"><h1 className="title">Tinjauan Kinerja</h1></div>
        <div className="card card-locked">
          <div className="locked-icon"></div>
          <p>Halaman ini hanya dapat diakses oleh Kepala Divisi, Operator, dan Kepala UPA.</p>
        </div>
      </div>
    );
  }

  const filtered = items.filter((x) => {
    if (!TINJAUAN_STATUSES.includes(x.status)) return false;
    if (role === "kepala-divisi" && !x.divisi.includes(user?.divisi || "")) return false;
    if (filterStatus !== "semua" && x.status !== filterStatus) return false;
    if (filterJenis !== "semua" && x.jenis !== filterJenis) return false;
    return true;
  });

  const handleACC = () => {
    if (!showACC) return;
    const now = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const accBy = user ? { stafId: user.id, nama: user.nama, nip: user.nip, jabatan: user.jabatan } : null;
    const payload = { status: "done" as const, catatan: null, catatanKadiv: catatanACC || null, accBy, accAt: now };
    if (showACC.jenis === "PEKERJAAN") updatePekerjaan(showACC.id, payload);
    else updateProyek(showACC.id, payload);
    setShowACC(null); setCatatanACC(""); load();
  };

  const openDoc = (item: TinjauanItem) => {
    setShowDoc(item);
    setDocDokList(getDokumentasiByRef(item.id).filter(d => !d.judul.startsWith("Surat Masuk:")));
  };

  const openSurvei = (item: TinjauanItem) => {
    setShowSurvei(item);
    setSurveiList(getHasilSurveyByRef(item.id));
  };

  // ─── Buka PDF Laporan ───
  const openLaporan = (item: TinjauanItem) => {
    if (item.status !== "done") return;
    const fullItem = item.jenis === "PEKERJAAN"
      ? getPekerjaan().find(p => p.id === item.id)
      : getProyek().find(p => p.id === item.id);
    if (!fullItem) { alert("Data tidak ditemukan."); return; }

    const dokumentasiList = getDokumentasiByRef(item.id).filter(d => !d.judul.startsWith("Surat Masuk:"));
    const surveyList = getHasilSurveyByRef(item.id);
    const progressList = item.jenis === "PROYEK" ? getProgressByProyekId(item.id) : [];

    openLaporanInTab({ item: fullItem, jenis: item.jenis, progressList, dokumentasiList, surveyList });
  };

  const openPDF = (d: Dokumentasi) => {
    if (d.fileData) {
      const byteChars = atob(d.fileData);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob), "_blank");
    } else { alert(`File: ${d.filePath}`); }
  };

  const fmt = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const countByStatus = (s: string) => items.filter(x => {
    if (!TINJAUAN_STATUSES.includes(x.status as StatusPekerjaan)) return false;
    if (x.status !== s) return false;
    if (role === "kepala-divisi") return x.divisi.includes(user?.divisi || "");
    return true;
  }).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="title">Tinjauan Kinerja</h1>
        <p className="subtitle">
          {role === "kepala-divisi"
            ? "Tinjau hasil pekerjaan dan proyek — berikan ACC untuk menyelesaikan."
            : "Monitoring status tinjauan pekerjaan dan proyek."}
        </p>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        {[
          { s: "review", label: "Menunggu ACC", cls: "yellow" },
          { s: "done", label: "Disetujui", cls: "green" },
        ].map(({ s, label, cls }) => (
          <div
            key={s}
            className={`summary-card ${cls} ${filterStatus === s ? "active" : ""}`}
            onClick={() => setFilterStatus(filterStatus === s ? "semua" : s)}
          >
            <p>{label}</p>
            <h2>{countByStatus(s)}</h2>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filter-row">
          <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="select-box">
            <option value="semua">Semua Jenis</option>
            <option value="PEKERJAAN">Pekerjaan</option>
            <option value="PROYEK">Proyek</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="col-nama">Nama</th>
                <th className="th-center col-status">Tipe</th>
                <th className="col-unit">Unit Peminta</th>
                <th className="col-staf">Divisi</th>
                <th className="col-staf">Staf</th>
                <th className="th-center col-surat">Dokumentasi</th>
                <th className="th-center col-surat">Survei</th>
                <th className="th-center col-status">Status Tinjauan</th>
                <th className="th-center col-laporan">Laporan</th>
                <th className="th-center col-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((item) => (
                <tr key={`${item.jenis}-${item.id}`}>
                  <td><strong>{item.judul}</strong></td>
                  <td className="td-center">
                    <span className={`badge ${item.jenis === "PROYEK" ? "badge-blue" : "badge-cyan"}`}>
                      {item.jenis === "PROYEK" ? "Proyek" : "Pekerjaan"}
                    </span>
                  </td>
                  <td className="text-small">{item.unitPeminta}</td>
                  <td className="text-small">{item.divisi.join(", ") || "—"}</td>
                  <td className="text-small">{item.staf || <span className="text-muted">—</span>}</td>

                  {/* Dokumentasi */}
                  <td className="td-center">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openDoc(item)}>
                      Lihat File
                    </button>
                  </td>

                  {/* Survei */}
                  <td className="td-center">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openSurvei(item)}>
                      Lihat Survei
                    </button>
                  </td>

                  {/* Status Tinjauan */}
                  <td className="td-center">
                    {item.status === "review"
                      ? <span className="badge badge-yellow">Menunggu</span>
                      : <span className="badge badge-green">Disetujui</span>
                    }
                  </td>

                  {/* Laporan - hanya saat sudah ACC (done) */}
                  <td className="td-center">
                    {item.status === "done"
                      ? <button type="button" className="btn-link-pdf" onClick={() => openLaporan(item)}>PDF Laporan</button>
                      : <span className="text-muted text-small">Belum Tersedia</span>
                    }
                  </td>

                  {/* Aksi per role dan status */}
                  <td className="td-center">
                    <div className="table-actions table-actions--center">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRingkasan(item)}>
                        Ringkasan
                      </button>
                      {/* ACC: hanya Kadiv, hanya saat Menunggu */}
                      {role === "kepala-divisi" && item.status === "review" && (
                        <button type="button" className="btn-success btn-sm" onClick={() => { setCatatanACC(""); setShowACC(item); }}>
                          ACC
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr className="empty-row"><td colSpan={10}>Tidak ada item yang sesuai filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL ACC ─── */}
      {showACC && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="text-success"> Konfirmasi ACC</h2>
            <p className="text-muted mt-3">Anda akan memberikan ACC untuk:</p>
            <p className="font-semibold mt-2">{showACC.judul}</p>
            <p className="text-small text-muted mt-1 mb-4">
              Status akan berubah menjadi <strong>Selesai</strong> dan laporan PDF akan tersedia.
            </p>
            <div className="form-group">
              <label>Catatan Kadiv <span className="text-muted">(opsional)</span></label>
              <textarea
                value={catatanACC}
                onChange={(e) => setCatatanACC(e.target.value)}
                placeholder="Catatan atau komentar untuk laporan..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-success" onClick={handleACC}>Ya, ACC</button>
              <button type="button" className="btn-secondary" onClick={() => setShowACC(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL RINGKASAN ─── */}
      {showRingkasan && (
        <div className="modal-overlay">
          <div className="modal-box modal-wide">
            <h2>Ringkasan Tinjauan</h2>
            <div className="info-box">
              <div className="info-box-title">Data {showRingkasan.jenis === "PROYEK" ? "Proyek" : "Pekerjaan"}</div>
              <table><tbody>
                <tr><td className="info-label">Nama</td><td>: <strong>{showRingkasan.judul}</strong></td></tr>
                <tr><td className="info-label">Tipe</td><td>: {showRingkasan.jenis === "PROYEK" ? "Proyek" : "Pekerjaan"}</td></tr>
                <tr><td className="info-label">Unit Peminta</td><td>: {showRingkasan.unitPeminta}</td></tr>
                <tr><td className="info-label">Divisi</td><td>: {showRingkasan.divisi.join(", ") || "—"}</td></tr>
                <tr><td className="info-label">Staf</td><td>: {showRingkasan.staf || "—"}</td></tr>
                <tr><td className="info-label">Target Selesai</td><td>: {showRingkasan.targetSelesai}</td></tr>
                <tr><td className="info-label">Status Tinjauan</td><td>: {showRingkasan.status === "review" ? <span className="badge badge-yellow">Menunggu</span> : <span className="badge badge-green">Disetujui</span>}</td></tr>
              </tbody></table>
            </div>

            {/* Data tinjauan Kadiv jika sudah Selesai */}
            {showRingkasan.status === "done" && showRingkasan.accBy && (
              <div className="info-box mt-4">
                <div className="info-box-title">Hasil Tinjauan Kadiv</div>
                <table><tbody>
                  <tr><td className="info-label">Disetujui Oleh</td><td>: {showRingkasan.accBy.nama}</td></tr>
                  <tr><td className="info-label">Jabatan</td><td>: {showRingkasan.accBy.jabatan}</td></tr>
                  <tr><td className="info-label">Tanggal ACC</td><td>: {showRingkasan.accAt}</td></tr>
                  {showRingkasan.catatanKadiv && (
                    <tr><td className="info-label">Catatan</td><td>: {showRingkasan.catatanKadiv}</td></tr>
                  )}
                </tbody></table>
              </div>
            )}

            {showRingkasan.catatan && (
              <div className="notice-card notice-warning mt-4">
                <div className="notice-card-title">Catatan:</div>
                <div className="text-small">{showRingkasan.catatan}</div>
              </div>
            )}

            {showRingkasan.status === "done" && (
              <div className="notice-card notice-success mt-4">
                <div className="notice-card-title">Laporan Tersedia</div>
                <div className="text-small mb-2">Pekerjaan/proyek telah selesai dan laporan bisa diexport.</div>
                <button type="button" className="btn-link-pdf" onClick={() => openLaporan(showRingkasan)}>
                  PDF Laporan
                </button>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowRingkasan(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DOC (Dokumentasi Akhir) ─── */}
      {showDoc && (
        <div className="modal-overlay">
          <div className="modal-box modal-wide">
            <h2> Dokumentasi Akhir</h2>
            <p className="text-small text-muted mt-1 mb-4">{showDoc.judul}</p>

            {docDokList.length > 0 ? (
              <div>
                {docDokList.map((d) => {
                  const ext = d.filePath?.split('.').pop()?.toLowerCase() || '';
                  const isImg = ['jpg','jpeg','png','gif','webp','bmp'].includes(ext);
                  const isPdf = ext === 'pdf';
                  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
                  return (
                    <div key={d.id} style={{ marginBottom: 16, padding: 14, background: 'var(--surface-alt)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{d.judul}</div>
                      <div className="text-small text-muted" style={{ marginBottom: 10 }}>{d.uploadedBy} · {d.tanggal}</div>
                      {isImg && d.fileData ? (
                        <img
                          src={`data:${mimeType};base64,${d.fileData}`}
                          alt={d.judul}
                          style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-soft)', display: 'block' }}
                        />
                      ) : isPdf && d.fileData ? (
                        <iframe
                          src={`data:application/pdf;base64,${d.fileData}`}
                          title={d.judul}
                          style={{ width: '100%', height: 420, borderRadius: 8, border: '1px solid var(--border-soft)', display: 'block' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="text-small text-muted">{d.filePath}{d.fileSize ? ` · ${fmt(d.fileSize)}` : ''}</span>
                          {d.fileData && <a href="#" onClick={(e) => { e.preventDefault(); openPDF(d); }} className="btn-link-pdf">Buka File</a>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="doc-empty-state">
                <div className="doc-empty-state-icon"></div>
                <p>Belum ada dokumentasi yang dikirim dari mobile.</p>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowDoc(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SURVEI KLIEN ─── */}
      {showSurvei && (
        <div className="modal-overlay">
          <div className="modal-box modal-wide">
            <h2>Hasil Survei Klien</h2>
            <p className="text-small text-muted mt-1 mb-4">{showSurvei.judul}</p>

            {surveiList.length > 0 ? (
              <div>
                {surveiList.map((sv) => {
                  const pilihanQ = sv.jawaban.filter(j => typeof j.nilaiPilihan === "number");
                  const avg = pilihanQ.length > 0 ? pilihanQ.reduce((s, j) => s + (j.nilaiPilihan ?? 0), 0) / pilihanQ.length : 0;
                  const saran = sv.jawaban.find(j => j.teksJawaban)?.teksJawaban;
                  return (
                    <div key={sv.id} style={{ marginBottom: 20, padding: 16, background: "var(--surface-alt)", borderRadius: 10, border: "1px solid var(--border-soft)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border-soft)" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{sv.namaKlien || sv.surveyor || "Klien"}</div>
                          {sv.nipKlien && <div className="text-small text-muted">NIP: {sv.nipKlien}</div>}
                          <div className="text-small text-muted">{sv.tanggalSurvey}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: avg >= 4 ? "#16A34A" : avg >= 3 ? "#D97706" : "#DC2626", lineHeight: 1 }}>{avg.toFixed(1)}</div>
                          <div className="text-small text-muted">/ 5.0</div>
                        </div>
                      </div>
                      <div className="table-wrap" style={{ marginBottom: saran ? 10 : 0 }}>
                        <table className="table">
                          <thead><tr><th className="th-center">No</th><th className="th-center">Pertanyaan</th><th className="th-center">Nilai</th></tr></thead>
                          <tbody>
                            {sv.jawaban.filter(j => typeof j.nilaiPilihan === "number").map((j, qi) => (
                              <tr key={j.pertanyaanId}>
                                <td className="td-center">{qi + 1}</td>
                                <td className="td-center">{j.pertanyaanId}</td>
                                <td className="td-center">
                                  <span style={{ fontWeight: 700, color: (j.nilaiPilihan ?? 0) >= 4 ? "#16A34A" : (j.nilaiPilihan ?? 0) >= 3 ? "#D97706" : "#DC2626" }}>
                                    {j.nilaiPilihan}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {saran && (
                        <div style={{ padding: "10px 12px", background: "#FEFCE8", border: "1px solid #FEF08A", borderRadius: 8, fontSize: 12, color: "#713F12" }}>
                          <strong>Kritik &amp; Saran:</strong> {saran}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="doc-empty-state">
                <div className="doc-empty-state-icon"></div>
                <p>Belum ada data survei klien.</p>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowSurvei(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
