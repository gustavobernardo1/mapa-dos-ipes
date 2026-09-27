import { afterEach, expect, it, vi } from "vitest";
import { backend } from "../../src/lib/server/config";
afterEach(() => vi.unstubAllEnvs());
it("fails closed for missing Supabase credentials and unknown providers", () => {
  vi.stubEnv("DATA_BACKEND", "supabase");
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  expect(backend).toThrow("SUPABASE_SECRET_KEY");
  vi.stubEnv("DATA_BACKEND", "typo");
  expect(backend).toThrow("DATA_BACKEND");
});
it("forbids local persistence in production", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DATA_BACKEND", "local");
  expect(backend).toThrow("apenas de desenvolvimento");
});
