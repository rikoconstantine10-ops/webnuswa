"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addLandingBlockAction, updateLandingBlockAction, removeLandingBlockAction, reorderLandingBlocksAction } from "@/app/actions/landingPage";
import { BLOCK_LABELS, BLOCK_ICONS, BLOCK_CATEGORIES, type LandingBlock, type LandingBlockType } from "@/lib/landingBlocks";
import BlockEditor, { type Draft } from "./BlockEditor";

type Addon = { id: string; name: string };

function blockSummary(b: LandingBlock): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const any = b as any;
  return any.heading || any.body?.slice(0, 40) || any.buttonLabel || BLOCK_LABELS[b.type];
}

export default function LandingBuilderForm({
  landingPageId,
  initialBlocks,
  addons,
  onSaved,
}: {
  landingPageId: string;
  initialBlocks: LandingBlock[];
  addons: Addon[];
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<LandingBlock[]>(initialBlocks);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<{ type: LandingBlockType; draft: Draft; existingId?: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setBlocks(initialBlocks), [initialBlocks]);

  function openAdd(type: LandingBlockType) {
    setPickerOpen(false);
    setEditing({ type, draft: { type } });
  }

  function openEdit(b: LandingBlock) {
    setEditing({ type: b.type, draft: { ...b }, existingId: b.id });
  }

  async function saveEditing() {
    if (!editing) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("landingPageId", landingPageId);
      fd.set("blockJson", JSON.stringify(editing.draft));
      if (editing.existingId) {
        await updateLandingBlockAction(fd);
      } else {
        await addLandingBlockAction(fd);
      }
      setEditing(null);
      router.refresh();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    const fd = new FormData();
    fd.set("landingPageId", landingPageId);
    fd.set("blockId", id);
    await removeLandingBlockAction(fd);
    router.refresh();
    onSaved?.();
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setBlocks(next);
    setDragIndex(null);
    reorderLandingBlocksAction(landingPageId, next.map((b) => b.id)).then(() => {
      router.refresh();
      onSaved?.();
    });
  }

  return (
    <div className="space-y-4">
      {blocks.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">Belum ada blok. Mulai tambah blok pertamamu di bawah.</p>
      ) : (
        <div className="space-y-2">
          {blocks.map((b, i) => (
            <div
              key={b.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              onClick={() => openEdit(b)}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing hover:border-teal-300"
            >
              <span className="text-slate-300 text-sm select-none" title="Geser untuk urutkan">⠿</span>
              <span className="text-xl">{BLOCK_ICONS[b.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{BLOCK_LABELS[b.type]}</p>
                <p className="text-sm font-semibold truncate">{blockSummary(b)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBlock(b.id);
                }}
                className="text-red-500 hover:text-red-700 px-1"
                title="Hapus"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setPickerOpen(true)} className="w-full border-2 border-dashed border-teal-300 text-teal-700 font-bold py-3 rounded-xl hover:bg-teal-50">
        + Tambah Blok
      </button>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setPickerOpen(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Pilih Blok</h3>
              <button onClick={() => setPickerOpen(false)} className="text-slate-400 text-xl leading-none">×</button>
            </div>
            {BLOCK_CATEGORIES.map((cat) => (
              <div key={cat.label} className="mb-4">
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">{cat.label}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {cat.types.map((type) => (
                    <button
                      key={type}
                      onClick={() => openAdd(type)}
                      className="flex flex-col items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-4 text-xs font-medium hover:border-teal-400 hover:bg-teal-50"
                    >
                      <span className="text-2xl">{BLOCK_ICONS[type]}</span>
                      {BLOCK_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {BLOCK_ICONS[editing.type]} {BLOCK_LABELS[editing.type]}
              </h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 text-xl leading-none">×</button>
            </div>
            <BlockEditor type={editing.type} draft={editing.draft} setDraft={(draft) => setEditing({ ...editing, draft })} addons={addons} />
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="flex-1 border border-slate-300 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50">
                Batal
              </button>
              <button onClick={saveEditing} disabled={saving} className="flex-1 bg-teal-600 text-white font-bold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50">
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
