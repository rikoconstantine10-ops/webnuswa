"use client";

import { useEffect, useRef, useState } from "react";

type Area = { id: string; name: string; postal_code: number };

// Autocomplete kecamatan/kota via Biteship maps. Menyimpan area terpilih ke hidden inputs.
export default function AreaSearch({
  nameField,
  areaIdField,
  postalField,
  defaultLabel,
  placeholder = "Ketik kecamatan / kota (min 3 huruf)",
  onSelect,
}: {
  nameField?: string;
  areaIdField: string;
  postalField: string;
  defaultLabel?: string;
  placeholder?: string;
  onSelect?: (area: Area) => void;
}) {
  const [query, setQuery] = useState(defaultLabel ?? "");
  const [results, setResults] = useState<Area[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Area | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected && query === selected.name) return;
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shipping/areas?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.areas ?? []);
        setOpen(true);
      } catch {}
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, selected]);

  function pick(a: Area) {
    setSelected(a);
    setQuery(a.name);
    setOpen(false);
    onSelect?.(a);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      <input type="hidden" name={areaIdField} value={selected?.id ?? ""} />
      <input type="hidden" name={postalField} value={selected?.postal_code ?? ""} />
      {nameField && <input type="hidden" name={nameField} value={selected?.name ?? ""} />}

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto text-sm">
          {results.map((a) => (
            <li
              key={a.id}
              onClick={() => pick(a)}
              className="px-3 py-2 hover:bg-teal-50 cursor-pointer"
            >
              {a.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
