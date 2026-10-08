export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`brand-mark ${className}`} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M12 30V10h10a8 8 0 0 1 0 16h-5v4h-5Zm5-9h5a3 3 0 1 0 0-6h-5v6Z" fill="#ffffff" />
      <path d="M23 29h5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand ${compact ? 'compact' : ''}`}>
      <LogoMark />
      <span className="brand-wordmark">Precidoc{!compact && <small>by Rainc</small>}</span>
    </span>
  );
}
