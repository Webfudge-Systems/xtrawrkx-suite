"use client";
import { AuthProvider } from "@/src/contexts/AuthContext";

export default function AdminLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
