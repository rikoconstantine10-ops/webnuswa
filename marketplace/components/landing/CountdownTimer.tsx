"use client";

import { useEffect, useState } from "react";

function remaining(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSec = Math.floor(diff / 1000);
  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

export default function CountdownTimer({ endAt, expiredText }: { endAt: string; expiredText?: string }) {
  const [left, setLeft] = useState(() => remaining(endAt));

  useEffect(() => {
    const id = setInterval(() => setLeft(remaining(endAt)), 1000);
    return () => clearInterval(id);
  }, [endAt]);

  if (!left) {
    return <p className="text-center font-bold text-slate-500">{expiredText || "Promo sudah berakhir"}</p>;
  }

  return (
    <div className="flex justify-center gap-2">
      {[
        [left.d, "Hari"],
        [left.h, "Jam"],
        [left.m, "Menit"],
        [left.s, "Detik"],
      ].map(([val, label]) => (
        <div key={label as string} className="bg-rose-600 text-white rounded-xl px-3 py-2 text-center min-w-14">
          <p className="text-xl font-extrabold tabular-nums">{String(val).padStart(2, "0")}</p>
          <p className="text-[10px] uppercase">{label}</p>
        </div>
      ))}
    </div>
  );
}
