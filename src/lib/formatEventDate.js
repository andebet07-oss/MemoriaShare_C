/**
 * formatEventDate — single source of truth for the magnet date format.
 *
 * Israeli numeric format: DD.MM.YYYY (e.g. 12.06.2026). The magnet templates
 * draw their date with it, so the date looks identical everywhere.
 *
 * @param {string|Date} dateInput - 'YYYY-MM-DD' string or Date
 * @param {string} [sep] - separator between day, month and year (default '.')
 * @returns {string} 'DD.MM.YYYY' or '' when the input is empty/invalid
 */
export function formatEventDate(dateInput, sep = '.') {
  if (!dateInput) return '';
  const d = new Date(
    typeof dateInput === 'string' && dateInput.length === 10
      ? dateInput + 'T00:00:00'
      : dateInput
  );
  if (isNaN(d.getTime())) return '';
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return [dd, mm, yyyy].join(sep);
}
