"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function TambahPekerjaanPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/pekerjaan"); }, [router]);
  return null;
}
