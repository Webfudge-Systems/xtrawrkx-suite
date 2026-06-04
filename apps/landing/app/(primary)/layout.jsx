import Navbar from "@/src/components/layout/Navbar";
import Footer from "@/src/components/layout/Footer";
import ClientLayout from "@/src/components/layout/ClientLayout";
import { PublicAuthProvider } from "@/src/contexts/PublicAuthContext";

export default function PrimaryLayout({ children }) {
  return (
    <PublicAuthProvider>
      <ClientLayout>
        <Navbar />
        {children}
        <Footer />
      </ClientLayout>
    </PublicAuthProvider>
  );
}
