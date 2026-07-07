'use strict';

const https = require('https');

const CAL_API = 'api.cal.com';
const CAL_VERSION = '2024-06-14';
const EVENT_TYPE_ID = 6221470; // 30 min meeting
const USERNAME = 'hokage-art-rehdcp';
const TIMEZONE = 'Asia/Jakarta';

function calRequest(method, path, body, apiKey) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: CAL_API,
      path: '/v2' + path,
      method,
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'cal-api-version': CAL_VERSION,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch(e) { reject(new Error('Cal.com parse error: ' + raw)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Get available slots for the next N days, filtered by preferred hour range
async function getAvailableSlots(apiKey, daysAhead = 7) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(start.getHours() + 3); // min 3 jam dari sekarang
  const end = new Date(now);
  end.setDate(end.getDate() + daysAhead);

  const path = `/slots/available?startTime=${start.toISOString()}&endTime=${end.toISOString()}&eventTypeId=${EVENT_TYPE_ID}&username=${USERNAME}`;
  const res = await calRequest('GET', path, null, apiKey);
  if (res.status !== 'success') throw new Error('Cal.com error: ' + JSON.stringify(res));

  // Flatten slots: { "2026-07-07": [{time: "..."}] }
  const slots = [];
  for (const [date, times] of Object.entries(res.data || {})) {
    for (const slot of times) {
      slots.push({ date, time: slot.time });
    }
  }
  return slots;
}

// Filter slots by user preference (morning: 8-12, afternoon: 12-17, evening: 17-20)
function filterSlotsByPreference(slots, preference) {
  if (!preference) return slots;
  const pref = preference.toLowerCase();
  return slots.filter(s => {
    const hour = new Date(s.time).getUTCHours() + 7; // UTC+7 WIB
    if (pref.includes('pagi') || pref.includes('morning')) return hour >= 8 && hour < 12;
    if (pref.includes('siang') || pref.includes('noon')) return hour >= 12 && hour < 15;
    if (pref.includes('sore') || pref.includes('afternoon')) return hour >= 14 && hour < 18;
    if (pref.includes('malam') || pref.includes('evening')) return hour >= 18 && hour < 21;
    return true;
  });
}

// Filter slots by day preference
function filterSlotsByDay(slots, dayPref) {
  if (!dayPref) return slots;
  const pref = dayPref.toLowerCase();
  const now = new Date();
  const todayWib = new Date(now.getTime() + 7 * 3600 * 1000);

  return slots.filter(s => {
    const slotDate = new Date(s.time);
    const slotWib = new Date(slotDate.getTime() + 7 * 3600 * 1000);
    const diffDays = Math.floor((slotWib - todayWib) / 86400000);
    const dayName = slotWib.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).toLowerCase();

    if (pref.includes('hari ini') || pref.includes('today')) return diffDays === 0;
    if (pref.includes('besok') || pref.includes('tomorrow')) return diffDays === 1;
    if (pref.includes('lusa')) return diffDays === 2;
    if (pref.includes('senin') || pref.includes('monday')) return dayName.includes('senin');
    if (pref.includes('selasa') || pref.includes('tuesday')) return dayName.includes('selasa');
    if (pref.includes('rabu') || pref.includes('wednesday')) return dayName.includes('rabu');
    if (pref.includes('kamis') || pref.includes('thursday')) return dayName.includes('kamis');
    if (pref.includes('jumat') || pref.includes('friday')) return dayName.includes('jumat');
    if (pref.includes('sabtu') || pref.includes('saturday')) return dayName.includes('sabtu');
    return true;
  });
}

// Format slot for display
function formatSlot(slot, index) {
  const d = new Date(slot.time);
  const wib = new Date(d.getTime() + 7 * 3600 * 1000);
  const dayName = wib.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' });
  const dateStr = wib.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const timeStr = wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  return `${index + 1}. ${dayName}, ${dateStr} — ${timeStr} WIB`;
}

// Create a booking
async function createBooking(apiKey, slotTime, attendeeName, attendeeEmail, notes) {
  const body = {
    start: slotTime,
    eventTypeId: EVENT_TYPE_ID,
    attendee: {
      name: attendeeName,
      email: attendeeEmail,
      timeZone: TIMEZONE
    },
    metadata: {}
  };
  if (notes) body.bookingFieldsResponses = { notes };

  const res = await calRequest('POST', '/bookings', body, apiKey);
  if (res.status !== 'success') throw new Error('Booking failed: ' + JSON.stringify(res));
  return res.data;
}

module.exports = { getAvailableSlots, filterSlotsByPreference, filterSlotsByDay, formatSlot, createBooking };
