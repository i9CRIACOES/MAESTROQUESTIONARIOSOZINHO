/** "3,6%" → { antes: "", n: 3.6, casas: 1, depois: "%" }; "<10%" → antes "<". */
export function partesDoNumero(s: string) {
  const m = s.match(/^(\D*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const casas = m[2].includes(",") ? m[2].split(",")[1].length : 0;
  return { antes: m[1], n: Number(m[2].replace(/\./g, "").replace(",", ".")), casas, depois: m[3] };
}
