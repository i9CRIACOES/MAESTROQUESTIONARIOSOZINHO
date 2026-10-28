import { afterEach, describe, expect, it, vi } from "vitest";
import { novoUuid } from "@/lib/uuid";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe("novoUuid", () => {
  it("usa crypto.randomUUID quando existe", () => {
    expect(novoUuid()).toMatch(V4);
  });

  it("fallback via getRandomValues gera v4 válido e diferente a cada chamada", () => {
    vi.stubGlobal("crypto", { randomUUID: undefined, getRandomValues: crypto.getRandomValues.bind(crypto) });
    const ids = Array.from({ length: 200 }, () => novoUuid());
    for (const id of ids) expect(id).toMatch(V4);
    expect(new Set(ids).size).toBe(200);
  });

  it("fallback seta versão e variante mesmo com bytes extremos", () => {
    for (const fill of [0x00, 0xff]) {
      vi.stubGlobal("crypto", { randomUUID: undefined, getRandomValues: (a: Uint8Array) => a.fill(fill) });
      expect(novoUuid()).toMatch(V4);
    }
  });
});
