"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import { getTinjauanList, getTinjauanDetail, accTinjauan, urlLaporanPdf, urlDokumen } from "@/lib/api";
import { extractList } from "@/lib/api-mapper";
import { PERTANYAAN_SURVEY } from "@/lib/data";
import type { StatusPekerjaan, Dokumentasi, HasilSurvey } from "@/types";

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
  "accepted":    "badge-cyan",
  "rejected":    "badge-red",
  // StatusPekerjaan
  "assigned":    "badge-purple",
  "in_progress": "badge-blue",
  "review":      "badge-orange",
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

  const load = () => {
    getTinjauanList()
      .then((res: any) => {
        const list = extractList(res);
        setItems(list.map((t: any): TinjauanItem => {
          const stafList: any[] = t.pekerjaan?.staf ?? t.proyek?.staf ?? [];
          const divisi: string[] = [...new Set(stafList.map((s: any) => s.divisi?.nama_divisi).filter(Boolean))] as string[];
          const stafNama = stafList.map((s: any) => s.pengguna?.nama_lengkap ?? "").filter(Boolean).join(", ") || null;
          const status: string = t.hasil_tinjauan === "disetujui" ? "done" : "review";
          return {
            id: t.id_tinjauan ?? "",
            jenis: t.id_pekerjaan ? "PEKERJAAN" : "PROYEK",
            judul: t.pekerjaan?.nama_pekerjaan ?? t.proyek?.nama_proyek ?? "",
            unitPeminta: t.pekerjaan?.unit_kerja?.nama_unit ?? t.proyek?.unit_kerja?.nama_unit ?? "—",
            divisi,
            status: status as TinjauanItem["status"],
            catatan: t.catatan ?? null,
            catatanKadiv: null,
            targetSelesai: t.pekerjaan?.target_selesai ?? t.proyek?.target_selesai ?? "",
            staf: stafNama,
            accBy: t.peninjau ? {
              stafId: t.peninjau.uuid ?? "",
              nama: t.peninjau.nama_lengkap ?? "",
              nip: t.peninjau.NIP ?? "",
              jabatan: t.peninjau.peran ?? "",
            } : null,
            accAt: t.ditinjau_at ?? null,
          };
        }));
      })
      .catch(console.error);
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

  const handleACC = async () => {
    if (!showACC || !user?.id) return;
    try {
      await accTinjauan(showACC.id, {
        id_ditinjau_oleh: user.id,
        catatan: catatanACC || "",
      });
      setShowACC(null); setCatatanACC(""); load();
    } catch (e: any) {
      alert("Gagal ACC: " + e.message);
    }
  };

  const openDoc = (item: TinjauanItem) => {
    getTinjauanDetail(item.id)
      .then((res: any) => {
        const rawData = res.data ?? res;
        const dok = rawData.dokumen;
        const docs: Dokumentasi[] = dok ? [{
          id: dok.id_dokumen ?? "",
          refId: item.id,
          jenis: item.jenis,
          judul: dok.nama_dokumen ?? dok.file_path ?? "",
          filePath: dok.file_path ?? "",
          tanggal: rawData.created_at?.split("T")[0] ?? "",
          uploadedBy: "",
          fileData: undefined,
        }] : [];
        setDocDokList(docs);
        setShowDoc(item);
      })
      .catch(console.error);
  };

  const openSurvei = (item: TinjauanItem) => {
    getTinjauanDetail(item.id)
      .then((res: any) => {
        const rawData = res.data ?? res;
        const sv = rawData.jawaban_survei;
        if (!sv) { setSurveiList([]); setShowSurvei(item); return; }
        const jawaban = PERTANYAAN_SURVEY.map((q, i) => {
          const n = i + 1;
          return q.tipeJawaban === "pilihan"
            ? { pertanyaanId: q.id, nilaiPilihan: sv[`jawaban${n}`] ?? undefined }
            : { pertanyaanId: q.id, teksJawaban: sv[`jawaban${n}`] ?? "" };
        });
        setSurveiList([{
          id: sv.id_jawaban ?? "",
          refId: item.id,
          jenis: item.jenis,
          tanggalSurvey: sv.created_at?.split("T")[0] ?? "",
          surveyor: "",
          namaKlien: sv.nama_klien ?? "",
          nipKlien: sv.nip_klien ?? "",
          jawaban,
        }]);
        setShowSurvei(item);
      })
      .catch(console.error);
  };

  const openLaporan = (item: TinjauanItem) => {
    if (item.status !== "done") return;
    window.open(urlLaporanPdf(item.id), "_blank");
  };

  const openPDF = (d: Dokumentasi) => {
    if ((d as any).id) {
      window.open(urlDokumen((d as any).id), "_blank");
    } else if (d.fileData) {
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
                          <thead><tr><th className="th-center" style={{ width: 40 }}>No</th><th>Pertanyaan</th><th className="th-center" style={{ width: 60 }}>Nilai</th></tr></thead>
                          <tbody>
                            {sv.jawaban.filter(j => typeof j.nilaiPilihan === "number").map((j, qi) => (
                              <tr key={j.pertanyaanId}>
                                <td className="td-center">{qi + 1}</td>
                                <td style={{ whiteSpace: "normal" }}>
                                  {PERTANYAAN_SURVEY.find(q => q.id === j.pertanyaanId)?.teks || j.pertanyaanId}
                                </td>
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
