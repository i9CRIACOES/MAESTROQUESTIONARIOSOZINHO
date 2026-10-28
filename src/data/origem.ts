export interface Origem { origem: string; utms: string; dispositivo: "celular" | "desktop" }

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function lerOrigem(search: string, ehCelular: boolean): Origem {
  const q = new URLSearchParams(search);
  const utms = UTM.filter((k) => q.get(k)).map((k) => `${k}=${q.get(k)!.slice(0, 80)}`).join("; ");
  return { origem: (q.get("o") ?? "").slice(0, 40), utms, dispositivo: ehCelular ? "celular" : "desktop" };
}

export function origemDoNavegador(): Origem {
  const celular = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  return lerOrigem(window.location.search, celular);
}
