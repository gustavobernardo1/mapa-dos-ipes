import { z } from "zod";
export const colors = [
  "AMARELO",
  "ROSA_ROXO",
  "BRANCO",
  "NAO_SEI",
  "OUTRO",
] as const;
export const blooms = [
  "INTENSA",
  "ALGUMAS",
  "CAINDO",
  "SEM_FLORES",
  "NAO_SEI",
] as const;
export const labels: Record<string, string> = {
  AMARELO: "Amarelo",
  ROSA_ROXO: "Rosa / Roxo",
  BRANCO: "Branco",
  NAO_SEI: "Não sei",
  OUTRO: "Outro",
  INTENSA: "Floração intensa",
  ALGUMAS: "Algumas flores",
  CAINDO: "Flores caindo",
  SEM_FLORES: "Sem flores",
  CERTEZA: "Tenho certeza de que é ipê",
  PROVAVEL: "Acho que é ipê",
  A: "Atual verificado",
  B: "Histórico verificado",
  C: "Parcialmente verificado",
  D: "Informações declaradas",
  CAMPO_ATUAL: "Fotografado agora",
  FOTO_HISTORICA: "Foto histórica",
};
export type Color = (typeof colors)[number];
export type Bloom = (typeof blooms)[number];
export type Confidence = "A" | "B" | "C" | "D";
export type Status = "PENDENTE" | "APROVADO" | "REJEITADO";
export const submissionSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  data_observacao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(v);
      return (
        Number.isFinite(d.getTime()) &&
        d.toISOString().slice(0, 10) === v &&
        v <= new Date().toISOString().slice(0, 10)
      );
    }, "Informe uma data válida que não esteja no futuro."),
  origem: z.enum(["CAMPO_ATUAL", "FOTO_HISTORICA"]),
  cor_observada: z.enum(colors),
  status_floracao: z.enum(blooms),
  identificacao_usuario: z.enum(["CERTEZA", "PROVAVEL", "NAO_SEI"]),
  comentario: z.string().trim().max(1500).default(""),
  nome_publico: z.string().trim().max(80).default(""),
  bairro: z.string().trim().max(100).default(""),
  arvore_id: z.uuid().optional(),
  consentimento: z.literal(true),
});
export type Submission = z.infer<typeof submissionSchema>;
export const moderationSchema = z.object({
  status: z.enum(["APROVADO", "REJEITADO"]),
  cor: z.enum(colors),
  confianca: z.enum(["A", "B", "C", "D"]),
  especie_id: z.uuid().nullable().default(null),
  arvore_id: z.uuid().optional(),
  criar_nova: z.boolean().default(false),
});
export type Moderation = z.infer<typeof moderationSchema>;
export type Photo = {
  id: string;
  observacao_id: string;
  key: string;
  thumbnail_key: string;
  hash_arquivo: string;
  largura: number;
  altura: number;
  criado_em: string;
};
export type Metadata = {
  foto_id: string;
  data_exif: string | null;
  latitude_exif: number | null;
  longitude_exif: number | null;
};
export type Observation = Omit<Submission, "arvore_id" | "consentimento"> & {
  id: string;
  arvore_id: string;
  campanha_id: string;
  confianca_dados: Confidence;
  status_moderacao: Status;
  criado_em: string;
  fotos: Photo[];
  metadata?: Metadata[];
};
export type Tree = {
  id: string;
  codigo_publico: string;
  especie_id: string | null;
  nome_popular: string;
  latitude: number;
  longitude: number;
  cor_principal: Color;
  bairro: string;
  status: Status;
  confianca: Confidence;
  criado_em: string;
  atualizado_em: string;
  observacoes: Observation[];
  distancia?: number;
  origem_municipal?: boolean;
  status_validacao?: "CADASTRO_PUBLICO" | "REGISTRO_COMUNITARIO";
  status_verificacao_comunitaria?:
    "NAO_VERIFICADA" | "VERIFICADA_FOTOGRAFICAMENTE";
  verificado_comunidade_em?: string | null;
  descricao_municipal?: string | null;
  cor_cadastral?: Color | null;
  proveniencia_municipal?: {
    fonte: string;
    dataset: string;
    layer: string;
    layer_id: number;
    OBJECTID: number;
    codigo_especie: number;
    descricao: string;
    nome_cientifico: string;
    data_consulta: string;
  } | null;
};
export const municipalUnverified = (t: Tree) =>
  t.origem_municipal === true &&
  t.status_verificacao_comunitaria !== "VERIFICADA_FOTOGRAFICAMENTE";
export const municipalBadge = (t: Tree) =>
  municipalUnverified(t)
    ? "Cadastro municipal — existência atual não verificada"
    : "Cadastro municipal — possui verificação fotográfica comunitária";
export type Stats = {
  arvores: number;
  observacoes: number;
  fotos: number;
  floridas: number;
  amarelas: number;
  rosas_roxas: number;
  brancas: number;
};
export type Species = {
  id: string;
  nome_popular: string;
  nome_cientifico: string | null;
};
export const recentBloom = (o: Observation, now = new Date()) =>
  ["INTENSA", "ALGUMAS", "CAINDO"].includes(o.status_floracao) &&
  o.data_observacao >=
    new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
export const latest = (t: Tree) =>
  [...t.observacoes].sort(
    (a, b) =>
      b.data_observacao.localeCompare(a.data_observacao) ||
      b.criado_em.localeCompare(a.criado_em),
  )[0];
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const rad = Math.PI / 180,
    a =
      Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
      Math.cos(lat1 * rad) *
        Math.cos(lat2 * rad) *
        Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371008.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export const photoUrl = (p: Photo, thumbnail = false) =>
  `/api/media/${thumbnail ? p.thumbnail_key : p.key}`;
export const formatDate = (v: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    dateStyle: "medium",
  }).format(new Date(v));
