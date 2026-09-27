"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Flower2, Camera } from "lucide-react";
import { api } from "@/lib/client";
import { type GalleryItem } from "@/lib/server/repository";
import {
  type Tree,
  type Stats,
  photoUrl,
  formatDate,
  labels,
} from "@/lib/domain";
import { TreeCard } from "./tree-card";
export function Collections({ gallery = false }: { gallery?: boolean }) {
  const [trees, setTrees] = useState<Tree[]>([]),
    [photos, setPhotos] = useState<GalleryItem[]>([]),
    [filter, setFilter] = useState(""),
    [region, setRegion] = useState(""),
    [offset, setOffset] = useState(0),
    [hasMore, setHasMore] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    api<Stats>("/api/stats")
      .then(setStats)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => {
      const q = new URLSearchParams({ limit: "24", offset: String(offset) });
      if (["AMARELO", "ROSA_ROXO", "BRANCO"].includes(filter))
        q.set("color", filter);
      if (filter === "historical") q.set("historical", "true");
      if (filter === "week") q.set("week", "true");
      if (filter === "blooming") q.set("blooming", "true");
      if (filter === "observations") q.set("sort", "observations");
      if (region) q.set("search", region);
      api<Tree[] | GalleryItem[]>(
        `/api/${gallery ? "gallery" : "trees"}?${q}`,
        { signal: abort.signal },
      )
        .then((data) => {
          setError("");
          setHasMore(data.length === 24);
          if (gallery)
            setPhotos((prev) =>
              offset
                ? [...prev, ...(data as GalleryItem[])]
                : (data as GalleryItem[]),
            );
          else
            setTrees((prev) =>
              offset ? [...prev, ...(data as Tree[])] : (data as Tree[]),
            );
          setLoading(false);
        })
        .catch((e) => {
          if (e.name !== "AbortError") {
            setError(e.message);
            setLoading(false);
          }
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [gallery, filter, region, offset]);
  function change(v: string) {
    setFilter(v);
    setOffset(0);
    setLoading(true);
  }
  const options = gallery
    ? [
        ["", "Recentes"],
        ["week", "Esta semana"],
        ["AMARELO", "Amarelos"],
        ["ROSA_ROXO", "Rosas / Roxos"],
        ["BRANCO", "Brancos"],
        ["historical", "Históricos"],
      ]
    : [
        ["", "Registros recentes"],
        ["blooming", "Floridos recentemente"],
        ["observations", "Mais observados"],
        ["AMARELO", "Amarelos"],
        ["ROSA_ROXO", "Rosas / Roxos"],
        ["BRANCO", "Brancos"],
      ];
  return (
    <main id="conteudo" className="page">
      <div className="page-intro">
        <span className="eyebrow">
          {gallery ? "A CIDADE PELOS NOSSOS OLHARES" : "ENCONTROS PELO CAMINHO"}
        </span>
        <h1>
          {gallery
            ? "Cada florada, uma história."
            : "Descubra os ipês da cidade."}
        </h1>
        <p>
          {gallery
            ? "Fotografias da comunidade, reunidas no espaço e no tempo."
            : "Explore cores, lugares e árvores que voltamos a observar."}
        </p>
      </div>
      {!gallery && stats && (
        <div className="explore-stats">
          <span>
            <strong>{stats.arvores}</strong> árvores mapeadas
          </span>
          <span>
            <strong>{stats.observacoes}</strong> observações
          </span>
          <span>
            <strong>{stats.amarelas}</strong> amarelas
          </span>
          <span>
            <strong>{stats.rosas_roxas}</strong> rosas / roxas
          </span>
          <span>
            <strong>{stats.brancas}</strong> brancas
          </span>
        </div>
      )}
      <div className="collection-filters">
        <div className="chips">
          {options.map(([v, label]) => (
            <button
              className={`chip ${filter === v ? "selected" : ""}`}
              key={v}
              aria-pressed={filter === v}
              onClick={() => change(v)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="region-filter">
          <MapPin size={17} />
          <input
            aria-label="Filtrar por região"
            value={region}
            placeholder="Filtrar por região"
            onChange={(e) => {
              setRegion(e.target.value);
              setOffset(0);
              setLoading(true);
            }}
          />
        </label>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className="muted" role="status">
          Buscando registros…
        </p>
      )}
      <div className={gallery ? "gallery-grid" : "tree-grid"}>
        {gallery
          ? photos.map((p) => (
              <article className="gallery-card" key={p.id}>
                <Link href={`/arvore/${p.arvore.id}`}>
                  <Image
                    src={photoUrl(p, true)}
                    alt={`${p.arvore.nome_popular} em ${p.arvore.bairro || "Goiânia"}`}
                    width={480}
                    height={480}
                    unoptimized
                    loading="lazy"
                  />
                </Link>
                <div>
                  <span className={`color-label ${p.observacao.cor_observada}`}>
                    {labels[p.observacao.cor_observada]}
                    {p.observacao.origem === "FOTO_HISTORICA"
                      ? " · Histórico"
                      : ""}
                  </span>
                  <h3>
                    <Link href={`/arvore/${p.arvore.id}`}>
                      {p.arvore.nome_popular}
                      <ArrowUpRight size={18} />
                    </Link>
                  </h3>
                  <p>
                    {formatDate(p.observacao.data_observacao)} ·{" "}
                    {p.arvore.bairro || "Goiânia"}
                  </p>
                  <p className="muted">
                    {labels[p.observacao.status_floracao]}
                    {p.observacao.nome_publico
                      ? ` · Foto: ${p.observacao.nome_publico}`
                      : ""}
                  </p>
                  <Link href={`/?arvore=${p.arvore.id}`} className="text-link">
                    <MapPin size={15} />
                    Ver no mapa
                  </Link>
                </div>
              </article>
            ))
          : trees.map((t) => <TreeCard key={t.id} tree={t} />)}
      </div>
      {!loading &&
        !error &&
        (gallery ? photos.length === 0 : trees.length === 0) && (
          <div className="empty-state">
            {gallery ? <Camera size={44} /> : <Flower2 size={44} />}
            <h2>
              {gallery
                ? "A galeria está esperando seus olhares."
                : "Este retrato começa com a comunidade."}
            </h2>
            <p>
              Nenhum registro aprovado para estes filtros. Fotografe um ipê ou
              resgate uma foto antiga para contribuir.
            </p>
            <Link className="btn btn-primary" href="/registrar">
              Registrar um ipê <ArrowUpRight size={17} />
            </Link>
          </div>
        )}
      {hasMore && (
        <button
          className="btn btn-secondary load-more"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setOffset(offset + 24);
          }}
        >
          Carregar mais
        </button>
      )}
    </main>
  );
}
