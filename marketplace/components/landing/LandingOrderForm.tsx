"use client";

import { useRef } from "react";
import BuyForm from "@/components/BuyForm";
import { captureLeadAction } from "@/app/actions/landingPage";

type Props = React.ComponentProps<typeof BuyForm> & { landingPageId: string };

// Sama seperti BuyForm, tapi menangkap lead (nama+HP) begitu pembeli mengisinya —
// walau belum tentu lanjut checkout — supaya seller bisa follow-up manual/japri lebih
// cepat (banyak buyer COD baru closing setelah di-chat duluan).
export default function LandingOrderForm(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCaptured = useRef("");

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    const target = e.target as HTMLInputElement;
    if (target.name !== "buyerPhone" || !target.form) return;
    const phone = target.value.replace(/\D/g, "");
    if (phone.length < 9 || phone === lastCaptured.current) return;
    const nameInput = target.form.elements.namedItem("buyerName") as HTMLInputElement | null;
    lastCaptured.current = phone;
    captureLeadAction(props.landingPageId, nameInput?.value ?? "", phone).catch(() => {});
  }

  return (
    <div ref={containerRef} onBlurCapture={handleBlur}>
      <BuyForm {...props} />
    </div>
  );
}
