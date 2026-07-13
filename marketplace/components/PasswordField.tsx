"use client";

import { useState } from "react";

export default function PasswordField({
  name,
  placeholder,
  className,
}: {
  name: string;
  placeholder: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        required
        placeholder={placeholder}
        className={className ?? "w-full border border-slate-300 rounded-xl px-4 py-3 text-sm pr-16"}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
      >
        {show ? "Sembunyikan" : "Lihat"}
      </button>
    </div>
  );
}
