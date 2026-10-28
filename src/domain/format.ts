export function brl(n: number): string {
  if (!isFinite(n)) return "—";
  if (n < 10) return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

export function pct(n: number): string {
  return (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: n < 0.1 ? 1 : 0 }) + "%";
}

export function num(n: number, d?: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: d === undefined ? 1 : d });
}
