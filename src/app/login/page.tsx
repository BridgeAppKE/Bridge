import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <LoginForm />
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Premium property management for hosts in Kenya
      </p>
    </main>
  );
}
