import { describe, expect, it } from "vitest";
import { brl, num, pct } from "@/domain/format";
import { ref } from "./referencia";

const VALORES = [0, 0.5, 9.999, 10, 652.6315, 161200, 1234567.89, Infinity, NaN];
const PCTS = [0, 0.05, 0.2, 0.6, 0.875, 1];

describe("format", () => {
  it("brl igual ao original", () => VALORES.forEach((v) => expect(brl(v)).toBe(ref.brl(v))));
  it("pct igual ao original", () => PCTS.forEach((v) => expect(pct(v)).toBe(ref.pct(v))));
  it("num igual ao original", () => {
    for (const v of [0, 1.25, 6.448, 760, 2.5]) {
      expect(num(v)).toBe(ref.num(v));
      expect(num(v, 0)).toBe(ref.num(v, 0));
    }
  });
});
