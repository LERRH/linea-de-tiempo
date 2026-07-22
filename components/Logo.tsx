export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <line x1="3" y1="13" x2="23" y2="13" stroke="#00B5A6" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="3" cy="13" r="3" fill="#005B73" />
        <circle cx="13" cy="13" r="3" fill="#00B5A6" />
        <circle cx="23" cy="13" r="3" fill="#FF8A65" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-brand-ink">
        Ruta
        <span className="text-brand-coral">PRO</span>
      </span>
    </span>
  );
}
