"use client";

import { useEffect } from "react";

export default function HomeFX() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".nm-home");
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("fx");

    // scroll reveal
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    root.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));

    // hero parallax tilt
    const deck = root.querySelector<HTMLElement>("#nm-deck");
    const stage = deck?.parentElement ?? null;
    const onMove = (ev: MouseEvent) => {
      if (!deck || !stage) return;
      const r = stage.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      deck.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`;
    };
    const onLeave = () => {
      if (deck) deck.style.transform = "rotateY(-4deg) rotateX(3deg)";
    };
    if (deck && stage && !reduce) {
      stage.addEventListener("mousemove", onMove);
      stage.addEventListener("mouseleave", onLeave);
    }

    // feature card tilt
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".fcard"));
    const cardMove = (card: HTMLElement) => (ev: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
    };
    const cardLeave = (card: HTMLElement) => () => {
      card.style.transform = "";
    };
    const cardHandlers: Array<[HTMLElement, (e: MouseEvent) => void, () => void]> = [];
    if (!reduce) {
      cards.forEach((card) => {
        const mv = cardMove(card);
        const lv = cardLeave(card);
        card.addEventListener("mousemove", mv);
        card.addEventListener("mouseleave", lv);
        cardHandlers.push([card, mv, lv]);
      });
    }

    // typed caption
    const typedEl = root.querySelector<HTMLElement>("#nm-typed");
    let typedTimer: ReturnType<typeof setTimeout> | undefined;
    let io2: IntersectionObserver | undefined;
    if (typedEl) {
      const text =
        "Madu hutan murni dari pedalaman Kalimantan 🍯 Dipanen alami tanpa campuran, kaya enzim & antioksidan. Cocok untuk keluarga sehat. Stok terbatas — pesan sekarang!";
      const cursor = '<span class="cursor"></span>';
      let i = 0;
      let started = false;
      if (reduce) {
        typedEl.innerHTML = text + cursor;
      } else {
        const type = () => {
          if (i <= text.length) {
            typedEl.innerHTML = text.slice(0, i) + cursor;
            i++;
            typedTimer = setTimeout(type, 24 + Math.random() * 36);
          }
        };
        io2 = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting && !started) {
                started = true;
                typedTimer = setTimeout(type, 400);
              }
            });
          },
          { threshold: 0.4 }
        );
        io2.observe(typedEl);
      }
    }

    return () => {
      io.disconnect();
      io2?.disconnect();
      if (typedTimer) clearTimeout(typedTimer);
      if (stage) {
        stage.removeEventListener("mousemove", onMove);
        stage.removeEventListener("mouseleave", onLeave);
      }
      cardHandlers.forEach(([card, mv, lv]) => {
        card.removeEventListener("mousemove", mv);
        card.removeEventListener("mouseleave", lv);
      });
      root.classList.remove("fx");
    };
  }, []);

  return null;
}
