import AuthForm from "@/src/components/auth/AuthForm";

export const metadata = {
  title: "Sign in or Register",
  robots: { index: false, follow: false },
};

export default async function AuthPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const modeParam = resolvedParams?.mode;
  const mode =
    modeParam === "login" ? "login" : modeParam === "forgot" ? "forgot" : "signup";
  const redirectTo = "/profile";

  return (
    <AuthForm initialMode={mode} isPage redirectTo={redirectTo} />
  );
}
