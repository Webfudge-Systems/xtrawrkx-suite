import Container from "@/src/components/layout/Container";
import AuthForm from "@/src/components/auth/AuthForm";

export default async function AuthPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const mode = resolvedParams?.mode === "login" ? "login" : "signup";
  /** Preserved for auth links; post-login navigation always uses `/profile` in AuthForm. */
  const redirectTo = "/profile";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(255,74,116,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc,_#eef6ff_42%,_#ffffff)] pb-20 pt-28">
      <Container className="max-w-[1240px]">
        <AuthForm
          initialMode={mode}
          isPage
          redirectTo={redirectTo}
        />
      </Container>
    </main>
  );
}
