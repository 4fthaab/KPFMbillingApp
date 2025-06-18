// utils/generateSerial.js

export const generateSerial = (name, date, previousSerials = []) => {
  if (!name || !date) return '';

  const namePart = name.toLowerCase().substring(0, 3);
  const [yyyy, mm, dd] = date.split('-'); // expected format: YYYY-MM-DD
  const datePart = dd + mm;

  const baseSerial = namePart + datePart;

  const matchingSerials = previousSerials.filter(s => s.startsWith(baseSerial));
  const serial = baseSerial + (matchingSerials.length + 1);

  return serial;
};
