import AuthForm from "@/src/components/auth/AuthForm";

export const metadata = {
  title: "Sign in or Register",
  robots: { index: false, follow: false },
};

export default async function AuthPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const mode = resolvedParams?.mode === "login" ? "login" : "signup";
  const redirectTo = "/profile";

  return (
    <AuthForm initialMode={mode} isPage redirectTo={redirectTo} />
  );
}
