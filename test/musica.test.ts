import { describe, expect, it } from "vitest";
import { ACORDES, VOLUME_CAMADA, acordeDoPasso, midiParaHz } from "@/audio/musica";

describe("música", () => {
  it("midi → Hz", () => {
    expect(midiParaHz(69)).toBe(440);
    expect(midiParaHz(81)).toBeCloseTo(880);
  });
  it("4 acordes, troca a cada 32 passos de semicolcheia", () => {
    expect(ACORDES).toHaveLength(4);
    expect(acordeDoPasso(0)).toBe(ACORDES[0]);
    expect(acordeDoPasso(31)).toBe(ACORDES[0]);
    expect(acordeDoPasso(32)).toBe(ACORDES[1]);
    expect(acordeDoPasso(128)).toBe(ACORDES[0]);
  });
  it("4 camadas com volume baixo", () => {
    expect(VOLUME_CAMADA).toHaveLength(4);
    VOLUME_CAMADA.forEach((v) => expect(v).toBeLessThanOrEqual(0.5));
  });
});
