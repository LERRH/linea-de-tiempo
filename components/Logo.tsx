import Link from "next/link";

export default function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`logo ${className}`} aria-label="RutaPRO">
      <span className="logo-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="logo-text">
        Ruta<b>PRO</b>
      </span>
    </Link>
  );
}
