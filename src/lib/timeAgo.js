/** Relative age of a job — "עכשיו" / "לפני X דק׳" / "לפני X שע׳" / "לפני X ימים", then the date. */
export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '';
  const sec = Math.floor((now - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'עכשיו';
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שע׳`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(new Date(iso));
}
