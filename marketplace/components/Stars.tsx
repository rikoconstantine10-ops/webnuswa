// Tampilan bintang rating (read-only). rating 0..5, boleh pecahan.
export default function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  const full = Math.round(rating);
  return (
    <span className={`${size} text-amber-500 tracking-tight`} aria-label={`Rating ${rating.toFixed(1)} dari 5`}>
      {"★".repeat(full)}
      <span className="text-slate-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
