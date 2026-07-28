import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdminAuthed()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center">
          <div className="text-gold-gradient font-serif text-2xl font-semibold tracking-[0.14em]">
            AUTO REVIVAL
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-muted">
            Staff portal
          </div>
        </Link>

        <div className="card mt-8 p-7">
          <h1 className="text-xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Enter the staff password to view the job book.
          </p>
          <LoginForm />
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-muted hover:text-accent"
        >
          ← Back to website
        </Link>
      </div>
    </main>
  );
}
