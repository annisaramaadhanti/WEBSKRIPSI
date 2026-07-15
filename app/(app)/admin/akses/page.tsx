"use client";

import { useEffect, useMemo, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import { aturAksesPengguna, getMasterDivisi, getMasterPengguna } from "@/lib/api";
import { getRoleLabel } from "@/lib/menu";
import type { Role, User } from "@/types";

type StatusAkun = NonNullable<User["statusAkun"]>;
type AccessUser = User & {
  email?: string;
  usernameSso?: string;
  firstLoginAt?: string;
  lastLoginAt?: string;
};

const roleOptions: Role[] = ["operator", "staf", "kepala-divisi", "kepala-upa"];
const statusOptions: StatusAkun[] = ["pending", "aktif", "ditolak", "nonaktif"];

const statusStyle: Record<StatusAkun, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ditolak: "bg-red-50 text-red-700 border-red-200",
  nonaktif: "bg-slate-100 text-slate-600 border-slate-200",
};

const peranToRole = (peran?: string): Role => {
  if (peran === "Operator") return "operator";
  if (peran === "Kepala UPA") return "kepala-upa";
  if (peran === "Kepala Divisi") return "kepala-divisi";
  return "staf";
};

const roleToPeran: Record<Role, "Operator" | "Staf" | "Kepala Divisi" | "Kepala UPA"> = {
  "operator": "Operator",
  "staf": "Staf",
  "kepala-divisi": "Kepala Divisi",
  "kepala-upa": "Kepala UPA",
};

export default function ManajemenAksesPage() {
  const { user } = useRole();
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"semua" | StatusAkun>("semua");
  const [selected, setSelected] = useState<AccessUser | null>(null);
  const [pegawaiSearch, setPegawaiSearch] = useState("");
  const [linkedUserId, setLinkedUserId] = useState("");
  const [masterDivisi, setMasterDivisi] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);

  const loadAccessData = () => {
    let active = true;
    setLoadingUsers(true);

    Promise.all([getMasterPengguna(), getMasterDivisi()])
      .then(([penggunaResponse, divisiResponse]: any[]) => {
        if (!active) return;
        const list = Array.isArray(penggunaResponse?.data) ? penggunaResponse.data : [];
        const divisi = Array.isArray(divisiResponse?.data)
          ? divisiResponse.data
          : Array.isArray(divisiResponse)
            ? divisiResponse
            : [];

        setUsers(list.map((item: any) => {
          const role = peranToRole(item.peran);
          return {
            id: item.uuid,
            nama: item.nama_lengkap,
            nip: item.NIP ?? "",
            usernameSso: item.username_sso ?? "",
            email: item.email ?? "",
            jabatan: item.peran ?? getRoleLabel(role),
            role,
            divisi: item.divisi?.nama_divisi ?? "-",
            isAdmin: Boolean(item.is_admin),
            statusAkun: item.status_akun ?? "aktif",
            firstLoginAt: item.created_at ? String(item.created_at).slice(0, 16).replace("T", " ") : "",
            lastLoginAt: item.last_login_at ? String(item.last_login_at).slice(0, 16).replace("T", " ") : "",
          } satisfies AccessUser;
        }));

        setMasterDivisi(
          divisi
            .map((item: any) => item.nama_divisi)
            .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
        );
      })
      .catch(() => {
        if (!active) return;
        setUsers([]);
        setMasterDivisi([]);
      })
      .finally(() => {
        if (active) setLoadingUsers(false);
      });

    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return loadAccessData();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((item) => {
      const hasSsoLogin = Boolean(item.usernameSso) || item.statusAkun === "pending";
      if (!hasSsoLogin) return false;

      const matchesStatus = status === "semua" || item.statusAkun === status;
      const matchesSearch = !keyword || [
        item.nama,
        item.usernameSso,
        item.divisi,
        item.jabatan,
      ].some((value) => String(value ?? "").toLowerCase().includes(keyword));
      return matchesStatus && matchesSearch;
    });
  }, [users, search, status]);

  const summary = useMemo(() => ({
    pending: users.filter((item) => item.usernameSso && item.statusAkun === "pending").length,
    linked: users.filter((item) => item.usernameSso && item.statusAkun === "aktif").length,
    admin: users.filter((item) => item.usernameSso && item.isAdmin && item.statusAkun === "aktif").length,
  }), [users]);

  const localPegawaiOptions = useMemo(() => {
    if (!selected) return [];
    const keyword = pegawaiSearch.trim().toLowerCase();
    return users.filter((item) =>
      item.id !== selected.id &&
      item.statusAkun !== "pending" &&
      !(item.statusAkun === "aktif" && item.usernameSso) &&
      item.nip &&
      item.nip !== selected.nip &&
      (!keyword || [
        item.nama,
        item.nip,
        item.divisi,
        getRoleLabel(item.role),
      ].some((value) => String(value ?? "").toLowerCase().includes(keyword)))
    ).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [users, selected, pegawaiSearch]);

  const linkedUser = useMemo(() => {
    if (!linkedUserId) return null;
    return users.find((item) => item.id === linkedUserId) ?? null;
  }, [users, linkedUserId]);

  const divisiOptions = useMemo(() => {
    const values = [
      ...masterDivisi,
      selected?.divisi,
      linkedUser?.divisi,
    ].filter((value): value is string => Boolean(value && value !== "-"));

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [masterDivisi, selected?.divisi, linkedUser?.divisi]);

  const saveAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;

    const form = new FormData(event.currentTarget);
    const nextStatus = String(form.get("statusAkun")) as StatusAkun;
    const nextRole = String(form.get("role")) as Role;
    const nextDivisi = String(form.get("divisi"));
    const nextIsAdmin = form.get("isAdmin") === "on";
    const linkToUserId = linkedUserId;
    const nextNip = linkToUserId ? (linkedUser?.nip ?? "") : String(form.get("nip") ?? "").trim();

    if (nextStatus === "aktif" && (!nextRole || !nextDivisi || nextDivisi === "-")) {
      alert("Role dan divisi wajib diisi sebelum akun diaktifkan.");
      return;
    }

    if (nextStatus === "aktif" && !linkToUserId && !nextNip) {
      alert("NIP wajib diisi jika akun baru diaktifkan tanpa dihubungkan ke pegawai lokal.");
      return;
    }

    setSavingAccess(true);
    try {
      await aturAksesPengguna({
        id_pengguna: selected.id,
        id_pengguna_lokal: linkToUserId || undefined,
        NIP: nextNip || undefined,
        status_akun: nextStatus,
        peran: roleToPeran[nextRole],
        nama_divisi: nextDivisi,
        is_admin: nextIsAdmin,
      });
      setSelected(null);
      setLinkedUserId("");
      setPegawaiSearch("");
      loadAccessData();
    } catch (error: any) {
      alert(error?.message ?? "Gagal menyimpan akses pengguna.");
    } finally {
      setSavingAccess(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="max-w-[720px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-[20px] font-bold text-[#0B1E4B]">Akses Ditolak</h1>
        <p className="mt-2 text-[13px] leading-6 text-slate-500">
          Menu Manajemen Akses hanya dapat dibuka oleh pengguna yang memiliki hak Admin Akses.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[1.6px] text-[#8A95A3]">Admin Akses</p>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.4px] text-[#0B1E4B]">Manajemen Akses Pengguna</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">Menunggu Aktivasi</div>
          <div className="mt-2 text-[26px] font-extrabold text-amber-600">{summary.pending}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">Sudah Dikaitkan</div>
          <div className="mt-2 text-[26px] font-extrabold text-emerald-600">{summary.linked}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">Admin Akses Aktif</div>
          <div className="mt-2 text-[26px] font-extrabold text-[#0B1E4B]">{summary.admin}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, role, atau divisi"
          className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-[13px] outline-none focus:border-[#0B1E4B]"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "semua" | StatusAkun)}
          className="h-10 rounded-md border border-slate-200 px-3 text-[13px] outline-none focus:border-[#0B1E4B]"
        >
          <option value="semua">Semua Status</option>
          {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.8px] text-slate-500">
            <tr>
              <th className="px-4 py-3">Akun SSO Masuk</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Divisi</th>
              <th className="px-4 py-3">Hak Admin</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Login Terakhir</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-slate-500">
                  Mengambil data akses pengguna...
                </td>
              </tr>
            ) : filteredUsers.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-bold text-[#0B1E4B]">{item.nama}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{item.statusAkun === "pending" ? "Menunggu pengaitan akun" : "Sudah memiliki akses"}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{getRoleLabel(item.role)}</td>
                <td className="max-w-[240px] px-4 py-3 text-slate-600">{item.divisi}</td>
                <td className="px-4 py-3 text-slate-600">{item.isAdmin ? "Ya" : "Tidak"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-bold capitalize ${statusStyle[item.statusAkun ?? "aktif"]}`}>
                    {item.statusAkun ?? "aktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{item.lastLoginAt ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setLinkedUserId("");
                      setPegawaiSearch("");
                    }}
                    className="rounded-md bg-[#0B1E4B] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#10275f]"
                  >
                    Atur Akses
                  </button>
                </td>
              </tr>
            ))}
            {!loadingUsers && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-slate-500">
                  Belum ada akun yang login melalui SSO. Akun baru akan muncul di sini setelah berhasil login SSO pertama kali.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-6">
          <form onSubmit={saveAccess} className="flex max-h-[calc(100vh-48px)] w-full max-w-[600px] flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="shrink-0 border-b border-slate-100 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#0B1E4B]">Atur Akses Pengguna</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100">x</button>
            </div>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600">
                <div className="text-[11px] font-bold uppercase tracking-[0.8px] text-slate-400">Akun SSO Masuk</div>
                <div className="mt-1 font-bold text-[#0B1E4B]">{selected.nama}</div>
              </div>

            <div key={`${selected.id}-${linkedUserId || "belum-terhubung"}`} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {selected.statusAkun === "pending" && (
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[12px] font-bold text-[#0B1E4B]">Hubungkan ke Pegawai di Database</div>
                  <input
                    type="text"
                    value={pegawaiSearch}
                    onChange={(event) => {
                      setPegawaiSearch(event.target.value);
                      if (linkedUserId) setLinkedUserId("");
                    }}
                    placeholder="Cari nama, NIP, role, atau divisi pegawai"
                    className="mt-3 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] outline-none focus:border-[#0B1E4B]"
                  />
                  {!linkedUser && (
                    <div className="mt-2 max-h-[216px] overflow-y-auto rounded-md border border-slate-200 bg-white">
                      {localPegawaiOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setLinkedUserId(item.id);
                            setPegawaiSearch(item.nama);
                          }}
                          className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50"
                        >
                          <span>
                            <span className="block font-bold text-[#0B1E4B]">{item.nama}</span>
                            <span className="block text-[11px] text-slate-500">{item.nip} - {getRoleLabel(item.role)} - {item.divisi}</span>
                          </span>
                        </button>
                      ))}
                      {localPegawaiOptions.length === 0 && (
                        <div className="px-3 py-3 text-[12px] text-slate-400">Pegawai tidak ditemukan.</div>
                      )}
                    </div>
                  )}
                  {linkedUser && (
                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{linkedUser.nama}</div>
                          <div className="mt-1 text-[11px]">{linkedUser.nip} - {getRoleLabel(linkedUser.role)} - {linkedUser.divisi}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLinkedUserId("");
                            setPegawaiSearch("");
                          }}
                          className="rounded-md border border-emerald-300 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          Ganti
                        </button>
                      </div>
                    </div>
                  )}
                  {!linkedUser && (
                    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-[12px] text-blue-800">
                      <div className="font-bold">Belum dihubungkan ke pegawai lama</div>
                      <div className="mt-1 text-[11px] leading-5">
                        Jika ini pegawai baru, pilih role dan divisi di bawah lalu simpan sebagai akun baru.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <label className="text-[12px] font-bold text-slate-600">
                Role SIMPROTIK
                <select name="role" defaultValue={linkedUser?.role ?? selected.role} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-[#0B1E4B]">
                  {roleOptions.map((item) => <option key={item} value={item}>{getRoleLabel(item)}</option>)}
                </select>
              </label>
              <label className="text-[12px] font-bold text-slate-600">
                Status Akun
                <select name="statusAkun" defaultValue={linkedUser ? "aktif" : selected.statusAkun ?? "aktif"} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-[#0B1E4B]">
                  {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="md:col-span-2 text-[12px] font-bold text-slate-600">
                NIP
                <input
                  name="nip"
                  defaultValue={linkedUser?.nip ?? selected.nip ?? ""}
                  readOnly={Boolean(linkedUser)}
                  placeholder="Isi NIP jika akun ini pegawai baru"
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-[#0B1E4B] read-only:bg-slate-50 read-only:text-slate-500"
                />
              </label>
              <label className="md:col-span-2 text-[12px] font-bold text-slate-600">
                Divisi
                <select name="divisi" defaultValue={linkedUser?.divisi ?? selected.divisi} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-[#0B1E4B]">
                  <option value="-">Belum diatur</option>
                  {divisiOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="md:col-span-2 flex items-center gap-2 rounded-md border border-slate-200 p-3 text-[12px] font-bold text-slate-600">
                <input name="isAdmin" type="checkbox" defaultChecked={linkedUser?.isAdmin ?? selected.isAdmin} className="h-4 w-4" />
                Berikan hak Admin Akses
              </label>
            </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} disabled={savingAccess} className="rounded-md border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60">Batal</button>
              <button type="submit" disabled={savingAccess} className="rounded-md bg-[#0B1E4B] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#10275f] disabled:opacity-60">{savingAccess ? "Menyimpan..." : "Simpan Akses"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
