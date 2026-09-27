import { describe, it, expect } from "vitest";
import {
  submissionSchema,
  distanceMeters,
  recentBloom,
  latest,
  type Observation,
  type Tree,
} from "../../src/lib/domain";
const valid = {
  latitude: -16.68,
  longitude: -49.26,
  data_observacao: "2026-01-01",
  origem: "CAMPO_ATUAL",
  cor_observada: "AMARELO",
  status_floracao: "INTENSA",
  identificacao_usuario: "PROVAVEL",
  consentimento: true,
};
describe("validation and temporal meaning", () => {
  it("requires permission and valid location and date", () => {
    expect(submissionSchema.safeParse(valid).success).toBe(true);
    for (const changes of [
      { latitude: 91 },
      { longitude: -181 },
      { data_observacao: "2025-02-30" },
      { data_observacao: "2999-01-01" },
      { consentimento: false },
      { origem: "IMPORTADO" },
      { comentario: "a".repeat(1501) },
    ])
      expect(submissionSchema.safeParse({ ...valid, ...changes }).success).toBe(
        false,
      );
  });
  it("uses observation date, not upload date, for blooming recently", () => {
    const now = new Date("2026-09-26T12:00:00Z");
    expect(
      recentBloom(
        {
          data_observacao: "2023-09-26",
          status_floracao: "INTENSA",
        } as Observation,
        now,
      ),
    ).toBe(false);
    expect(
      recentBloom(
        {
          data_observacao: "2026-09-24",
          status_floracao: "INTENSA",
        } as Observation,
        now,
      ),
    ).toBe(true);
    expect(
      recentBloom(
        {
          data_observacao: "2026-09-24",
          status_floracao: "SEM_FLORES",
        } as Observation,
        now,
      ),
    ).toBe(false);
  });
  it("a newly uploaded old photo does not replace the current observation", () => {
    const old = {
      data_observacao: "2023-09-26",
      criado_em: "2026-09-26",
    } as Observation;
    const current = {
      data_observacao: "2026-09-20",
      criado_em: "2026-09-20",
    } as Observation;
    expect(latest({ observacoes: [old, current] } as Tree)).toBe(current);
  });
  it("measures meters for duplicate candidates", () => {
    expect(distanceMeters(-16.68, -49.26, -16.68, -49.26)).toBe(0);
    expect(distanceMeters(-16.68, -49.26, -16.68005, -49.26)).toBeCloseTo(
      5.56,
      1,
    );
  });
});
