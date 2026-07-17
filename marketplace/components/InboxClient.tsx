"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ConversationSummary = {
  id: string;
  buyerPhone: string;
  buyerName: string | null;
  mode: string;
  blocked: boolean;
  tags: string[];
  unreadCount: number;
  needsHumanSince: string | null;
  lastMessageAt: string;
  messages: Array<{ body: string | null; author: string; mediaType: string | null }>;
};

type Message = {
  id: string;
  direction: string;
  author: string;
  body: string | null;
  imageUrl: string | null;
  mediaType: string | null;
  createdAt: string;
};

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum dibaca" },
  { key: "human", label: "Butuh kamu" },
];

const QUICK_EMOJI = ["😊", "🙏", "👍", "✅", "🎉", "😅", "❤️", "📦"];

export default function InboxClient() {
  const [filter, setFilter] = useState("all");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const res = await fetch(`/api/wa/inbox?filter=${filter}`);
    if (res.ok) setConversations((await res.json()).conversations);
  }, [filter]);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/wa/inbox/${id}`);
    if (res.ok) setMessages((await res.json()).messages);
  }, []);

  useEffect(() => {
    loadList();
    const timer = setInterval(loadList, 4000);
    return () => clearInterval(timer);
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) return;
    loadThread(selectedId);
    const timer = setInterval(() => loadThread(selectedId), 3000);
    return () => clearInterval(timer);
  }, [selectedId, loadThread]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(imageUrl?: string) {
    if (!selectedId || (!text.trim() && !imageUrl)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/wa/inbox/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() || undefined, imageUrl }),
      });
      if (res.ok) {
        setText("");
        await loadThread(selectedId);
        await loadList();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Gagal mengirim pesan");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kind=image", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) {
        const appUrl = window.location.origin;
        await send(`${appUrl}${json.url}`);
      }
    } finally {
      setUploading(false);
    }
  }

  async function patch(body: { mode?: string; blocked?: boolean }) {
    if (!selectedId) return;
    await fetch(`/api/wa/inbox/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await loadList();
    await loadThread(selectedId);
  }

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-0 bg-white rounded-2xl ring-1 ring-slate-900/5 overflow-hidden h-[70vh]">
      <div className="border-r border-slate-100 flex flex-col">
        <div className="flex gap-1 p-2 border-b border-slate-100">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${
                filter === f.key ? "bg-teal-600 text-white" : "bg-slate-50 text-slate-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-xs text-slate-400 p-4">Belum ada percakapan.</p>
          )}
          {conversations.map((c) => {
            const last = c.messages[0];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 ${
                  selectedId === c.id ? "bg-slate-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold truncate">{c.buyerName || c.buyerPhone}</span>
                  {c.unreadCount > 0 && (
                    <span className="bg-teal-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {last?.author === "BOT" ? "🤖 " : last?.author === "SELLER" ? "Kamu: " : ""}
                  {last?.body || (last?.mediaType ? "📷 Media" : "")}
                </p>
                <div className="flex gap-1 mt-1">
                  {c.mode === "HUMAN" && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-1.5">Butuh kamu</span>
                  )}
                  {c.blocked && <span className="text-[10px] bg-red-100 text-red-700 rounded px-1.5">Diblokir</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Pilih percakapan di sebelah kiri
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold">{selected.buyerName || selected.buyerPhone}</p>
                <p className="text-xs text-slate-400">{selected.buyerPhone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => patch({ mode: selected.mode === "HUMAN" ? "BOT" : "HUMAN" })}
                  className="text-xs bg-slate-100 rounded-lg px-2.5 py-1.5"
                >
                  {selected.mode === "HUMAN" ? "Kembalikan ke bot" : "Ambil alih manual"}
                </button>
                <button
                  onClick={() => patch({ blocked: !selected.blocked })}
                  className="text-xs bg-red-50 text-red-600 rounded-lg px-2.5 py-1.5"
                >
                  {selected.blocked ? "Buka blokir" : "Blokir"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "IN" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      m.direction === "IN" ? "bg-white ring-1 ring-slate-900/5" : "bg-teal-600 text-white"
                    }`}
                  >
                    {m.author === "BOT" && <p className="text-[10px] opacity-70 mb-0.5">🤖 Bot</p>}
                    {m.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="" className="rounded-lg max-w-full mb-1" />
                    )}
                    {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                  </div>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>

            <div className="border-t border-slate-100 p-3 space-y-2">
              <div className="flex gap-1">
                {QUICK_EMOJI.map((e) => (
                  <button
                    key={e}
                    onClick={() => setText((t) => t + e)}
                    className="text-lg hover:scale-110 transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 bg-slate-100 rounded-xl px-3 py-2.5 text-sm disabled:opacity-50"
                >
                  {uploading ? "..." : "📷"}
                </button>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Tulis balasan..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm resize-none"
                />
                <button
                  onClick={() => send()}
                  disabled={sending || !text.trim()}
                  className="shrink-0 bg-teal-600 text-white font-bold rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Kirim
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
