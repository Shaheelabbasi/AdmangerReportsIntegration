export function csvEscape(value) {
  if (value === null || value === undefined) return "";

  const str = String(value);

  // escape quotes and wrap if needed
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
