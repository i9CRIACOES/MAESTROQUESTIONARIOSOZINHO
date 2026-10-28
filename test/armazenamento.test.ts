import { afterEach, describe, expect, it, vi } from "vitest";
import { armazenamentoSeguro, gravar, ler } from "@/data/armazenamento";

afterEach(() => vi.unstubAllGlobals());

const quebrado = {
  getItem: () => { throw new Error("SecurityError"); },
  setItem: () => { throw new Error("QuotaExceeded"); },
};

describe("armazenamento seguro", () => {
  it("usa o localStorage quando funciona", () => {
    const m = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
    gravar("a1", "x");
    expect(m.get("a1")).toBe("x");
    expect(ler("a1")).toBe("x");
  });
  it("sem localStorage ou com localStorage que lança, cai para a memória", () => {
    vi.stubGlobal("localStorage", quebrado);
    expect(() => gravar("b1", "y")).not.toThrow();
    expect(ler("b1")).toBe("y");
    expect(ler("nada")).toBeNull();
  });
  it("se o setItem falha, a memória vale mais que o valor velho do disco", () => {
    const m = new Map<string, string>([["c1", "velho"]]);
    vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: () => { throw new Error("cheio"); } });
    gravar("c1", "novo");
    expect(ler("c1")).toBe("novo");
  });
  it("armazenamentoSeguro expõe getItem/setItem sem lançar", () => {
    vi.stubGlobal("localStorage", quebrado);
    const s = armazenamentoSeguro();
    expect(() => s.setItem("d1", "z")).not.toThrow();
    expect(s.getItem("d1")).toBe("z");
  });
});
