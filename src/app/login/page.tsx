import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50/80 to-background px-4">
      <LoginForm />
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Built for short-term rental hosts in Nairobi, Kenya
      </p>
    </main>
  );
}
