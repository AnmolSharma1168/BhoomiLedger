"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortalRoot() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("bl_token");
    if (token) router.replace("/portal/dashboard");
    else router.replace("/portal/login");
  }, []);
  return null;
}