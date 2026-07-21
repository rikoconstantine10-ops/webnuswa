// Badge "Terverifikasi" — sinyal kepercayaan untuk toko yang sudah diverifikasi admin.
export default function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Toko Terverifikasi NuswaMart"
      className={`inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-sky-600" aria-hidden="true">
        <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.3 1.9-.9 2.9.9 2.9-2.3 1.9-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.3 15.4 4.2 12l-.9-2.9L5.6 7.2l1-2.8 3-.1L12 2zm-1 13l5-5-1.4-1.4L11 12.2 9.4 10.6 8 12l3 3z" />
      </svg>
      Terverifikasi
    </span>
  );
}
