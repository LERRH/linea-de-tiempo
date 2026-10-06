import Link from "next/link";
import { ReactNode } from "react";
import Logo from "@/components/Logo";

export default function AuthCard({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth card">
        <Logo />
        <div className="tabs" role="tablist">
          <Link href="/login" role="tab" aria-selected={mode === "login"} className={`tab ${mode === "login" ? "active" : ""}`}>
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            role="tab"
            aria-selected={mode === "register"}
            className={`tab ${mode === "register" ? "active" : ""}`}
          >
            Crear cuenta
          </Link>
        </div>
        {children}
        <p className="small muted" style={{ textAlign: "center", margin: "22px 0 0" }}>
          {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <Link href={mode === "login" ? "/register" : "/login"} className="link">
            {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
          </Link>
        </p>
      </section>
    </main>
  );
}
