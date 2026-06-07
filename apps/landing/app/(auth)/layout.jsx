import ClientLayout from "@/src/components/layout/ClientLayout";
import { PublicAuthProvider } from "@/src/contexts/PublicAuthContext";

export default function AuthLayout({ children }) {
  return (
    <PublicAuthProvider>
      <ClientLayout>{children}</ClientLayout>
    </PublicAuthProvider>
  );
}
