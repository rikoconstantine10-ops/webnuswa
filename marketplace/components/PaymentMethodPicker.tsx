"use client";

import { BAYARIN_PAYMENT_GROUPS, BAYARIN_BANK_CODES, type BayarinBankCode } from "@/lib/bayarin";

// Radio "paymentType" (bank_code Bayarin) dikelompokkan per kategori. Dipakai bersama oleh
// BuyForm (checkout produk tunggal) dan CartCheckoutForm (checkout keranjang) — blok COD/Crypto
// tetap dirender terpisah di masing-masing form karena syaratnya beda (mis. butuh courier COD).
export default function PaymentMethodPicker({
  enabledPaymentTypes = [],
  defaultCode,
  onChange,
}: {
  enabledPaymentTypes?: string[];
  defaultCode?: string;
  onChange?: (code: BayarinBankCode) => void;
}) {
  const allowed = (code: string) => enabledPaymentTypes.length === 0 || enabledPaymentTypes.includes(code);
  const groups = BAYARIN_PAYMENT_GROUPS.map((g) => ({ ...g, codes: g.codes.filter(allowed) })).filter(
    (g) => g.codes.length > 0
  );
  const firstCode = groups[0]?.codes[0];

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">{g.label}</p>
          <div className="grid grid-cols-2 gap-2">
            {g.codes.map((code) => (
              <label
                key={code}
                className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50"
              >
                <input
                  type="radio"
                  name="paymentType"
                  value={code}
                  defaultChecked={defaultCode ? defaultCode === code : code === firstCode}
                  required
                  onChange={() => onChange?.(code)}
                />
                {BAYARIN_BANK_CODES[code]}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
