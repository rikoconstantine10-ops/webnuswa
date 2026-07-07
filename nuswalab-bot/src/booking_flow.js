'use strict';

const { getAvailableSlots, filterSlotsByPreference, filterSlotsByDay, formatSlot, createBooking } = require('./scheduler');

// In-memory state per phone number
const bookingStates = new Map();

const STEPS = {
  COLLECT_NAME_EMAIL: 'collect_name_email',
  COLLECT_PREFERENCE: 'collect_preference',
  SHOW_SLOTS: 'show_slots',
  CONFIRM: 'confirm',
};

function getState(phone) { return bookingStates.get(phone) || null; }
function setState(phone, state) { bookingStates.set(phone, state); }
function clearState(phone) { bookingStates.delete(phone); }
function isInBookingFlow(phone) { return bookingStates.has(phone); }

// Start booking flow
function startBooking(phone, customerName) {
  setState(phone, {
    step: STEPS.COLLECT_NAME_EMAIL,
    prefillName: customerName || '',
    name: '',
    email: '',
    slots: [],
    selectedSlot: null,
    dayPref: '',
    timePref: '',
  });
  const namePart = customerName ? `, ${customerName.split(' ')[0]}` : '';
  return `Oke${namePart}! Yuk kita jadwalkan konsultasi gratis 30 menit bareng tim Nuswalab 📅\n\nBoleh minta nama lengkap & email kamu untuk konfirmasi booking?`;
}

// Parse name + email from a message
function parseNameEmail(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';
  // Name: everything before the email, or the whole text if no email
  let name = text.replace(email, '').replace(/[,\-|\/]/g, ' ').trim();
  name = name.replace(/\s+/g, ' ').trim();
  if (name.length < 2) name = '';
  return { name, email };
}

// Parse time preference from natural language
function parseTimePreference(text) {
  const lower = text.toLowerCase();
  const dayKeywords = ['hari ini', 'today', 'besok', 'tomorrow', 'lusa', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const timeKeywords = ['pagi', 'morning', 'siang', 'noon', 'sore', 'afternoon', 'malam', 'evening'];

  let dayPref = '';
  let timePref = '';

  for (const k of dayKeywords) if (lower.includes(k)) { dayPref = k; break; }
  for (const k of timeKeywords) if (lower.includes(k)) { timePref = k; break; }

  return { dayPref, timePref };
}

// Handle incoming message during booking flow
async function handleBookingMessage(phone, text, apiKey) {
  const state = getState(phone);
  if (!state) return null;

  const lower = text.toLowerCase().trim();

  // Allow cancellation at any step
  if (lower === 'batal' || lower === 'cancel' || lower.includes('tidak jadi') || lower.includes('ga jadi')) {
    clearState(phone);
    return 'Oke, booking dibatalkan 😊 Kalau mau jadwalkan lagi, tinggal bilang ya!';
  }

  // STEP 1: Collect name & email
  if (state.step === STEPS.COLLECT_NAME_EMAIL) {
    const { name, email } = parseNameEmail(text);

    if (!email) {
      // Maybe they only gave name first
      if (state.prefillName && !state.name) {
        state.name = state.prefillName;
      }
      if (!state.name && name) state.name = name;
      setState(phone, state);
      return `Hmm, emailnya belum ketemu nih 😅 Boleh kirim dalam format:\n\n*Nama Lengkap, email@contoh.com*`;
    }

    state.name = name || state.prefillName || 'Customer';
    state.email = email;
    state.step = STEPS.COLLECT_PREFERENCE;
    setState(phone, state);

    return `Siap, ${state.name.split(' ')[0]}! ✅\n\nEnaknya jadwal konsultasinya kapan? Misalnya:\n• "besok sore"\n• "Rabu pagi"\n• "minggu ini, fleksibel"\n\nAtau ketik *"fleksibel"* biar saya cariin slot terdekat 😊`;
  }

  // STEP 2: Collect preference & show slots
  if (state.step === STEPS.COLLECT_PREFERENCE) {
    const { dayPref, timePref } = parseTimePreference(text);
    state.dayPref = dayPref;
    state.timePref = timePref;

    try {
      let slots = await getAvailableSlots(apiKey, 14);
      if (dayPref) slots = filterSlotsByDay(slots, dayPref);
      if (timePref) slots = filterSlotsByPreference(slots, timePref);

      // Take max 4 slots
      slots = slots.slice(0, 4);

      if (slots.length === 0) {
        // Widen search
        slots = await getAvailableSlots(apiKey, 14);
        slots = slots.slice(0, 4);
        if (slots.length === 0) {
          clearState(phone);
          return 'Maaf, sepertinya belum ada slot tersedia saat ini 😢 Coba hubungi tim kami langsung di +62 851-8130-1622 ya!';
        }
        state.dayPref = '';
        state.timePref = '';
      }

      state.slots = slots;
      state.step = STEPS.SHOW_SLOTS;
      setState(phone, state);

      const slotList = slots.map((s, i) => formatSlot(s, i)).join('\n');
      return `Ini slot yang tersedia:\n\n${slotList}\n\nBalas dengan nomor slot yang kamu pilih (1-${slots.length}), atau ketik *"batal"* untuk membatalkan 😊`;
    } catch(e) {
      console.error('[BOOKING] Error fetching slots:', e.message);
      clearState(phone);
      return 'Waduh, ada gangguan saat cek jadwal 😅 Coba lagi nanti atau hubungi +62 851-8130-1622 ya!';
    }
  }

  // STEP 3: User picks a slot
  if (state.step === STEPS.SHOW_SLOTS) {
    const num = parseInt(text.trim());
    if (isNaN(num) || num < 1 || num > state.slots.length) {
      return `Balas dengan angka 1 sampai ${state.slots.length} ya 😊\n\nAtau ketik *"batal"* untuk membatalkan.`;
    }

    const chosen = state.slots[num - 1];
    state.selectedSlot = chosen;
    state.step = STEPS.CONFIRM;
    setState(phone, state);

    const formatted = formatSlot(chosen, 0).replace('1. ', '');
    return `Oke, ini detail booking-nya:\n\n📅 *${formatted}*\n👤 Nama: ${state.name}\n📧 Email: ${state.email}\n\nKonfirmasi? Balas *"ya"* untuk booking atau *"batal"* untuk pilih ulang.`;
  }

  // STEP 4: Confirm & book
  if (state.step === STEPS.CONFIRM) {
    if (lower === 'ya' || lower === 'yes' || lower === 'iya' || lower === 'ok' || lower === 'oke') {
      try {
        const booking = await createBooking(apiKey, state.selectedSlot.time, state.name, state.email, 'Konsultasi gratis via NuswaBot WhatsApp');
        clearState(phone);

        const formatted = formatSlot(state.selectedSlot, 0).replace('1. ', '');
        return `Booking berhasil! 🎉\n\n📅 *${formatted}*\n👤 ${state.name}\n📧 ${state.email}\n\nLink meeting & konfirmasi sudah dikirim ke email kamu ya. Sampai jumpa di sesi konsultasinya! 🚀\n\nAda yang bisa saya bantu lagi sebelum meeting?`;
      } catch(e) {
        console.error('[BOOKING] Create booking error:', e.message);
        clearState(phone);
        return 'Maaf, ada kendala saat membuat booking 😢 Coba lagi atau hubungi langsung +62 851-8130-1622 ya!';
      }
    } else {
      // Go back to show slots
      state.step = STEPS.SHOW_SLOTS;
      setState(phone, state);
      const slotList = state.slots.map((s, i) => formatSlot(s, i)).join('\n');
      return `Oke, pilih ulang ya:\n\n${slotList}\n\nBalas dengan nomor slot (1-${state.slots.length}) atau *"batal"* untuk membatalkan.`;
    }
  }

  return null;
}

module.exports = { startBooking, handleBookingMessage, isInBookingFlow, clearState };
