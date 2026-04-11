export function getDailySeed(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  // Use UTC date YYYY-MM-DD
  const iso = d.toISOString().slice(0, 10);
  return `daily-v1-${iso}`;
}

export function getDailyDateString(seed: string): string | null {
  const m = seed.match(/daily-v1-(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export default getDailySeed;
