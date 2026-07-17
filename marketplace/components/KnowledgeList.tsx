"use client";

import { useState } from "react";
import {
  createKnowledgeItemAction,
  updateKnowledgeItemAction,
  deleteKnowledgeItemAction,
} from "@/app/actions/wa";

type Item = { id: string; title: string; answer: string };

function EditableItem({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateKnowledgeItemAction(fd);
          setEditing(false);
        }}
        className="bg-white rounded-xl ring-1 ring-slate-900/5 p-4 space-y-2"
      >
        <input type="hidden" name="id" value={item.id} />
        <input
          name="title"
          defaultValue={item.title}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
          placeholder="Pertanyaan"
        />
        <textarea
          name="answer"
          defaultValue={item.answer}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Jawaban"
        />
        <div className="flex gap-2">
          <button className="bg-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Simpan</button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100">
            Batal
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-900/5 p-4">
      <p className="text-sm font-bold">{item.title}</p>
      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{item.answer}</p>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100">
          Edit
        </button>
        <form action={deleteKnowledgeItemAction}>
          <input type="hidden" name="id" value={item.id} />
          <button className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Hapus</button>
        </form>
      </div>
    </div>
  );
}

export default function KnowledgeList({ items }: { items: Item[] }) {
  return (
    <div className="space-y-4">
      <form action={createKnowledgeItemAction} className="bg-white rounded-xl ring-1 ring-slate-900/5 p-4 space-y-2">
        <p className="text-sm font-bold mb-1">+ Tambah topik</p>
        <input
          name="title"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
          placeholder="Pertanyaan, mis. Berapa lama pengiriman?"
        />
        <textarea
          name="answer"
          required
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Jawaban yang akan dipakai bot sebagai referensi"
        />
        <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl">Tambah</button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada topik. Tambahkan di atas.</p>
      ) : (
        items.map((item) => <EditableItem key={item.id} item={item} />)
      )}
    </div>
  );
}
