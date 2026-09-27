"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  TreeDeciduous,
  Flower2,
  ArrowRight,
  X,
  List,
  Map as MapIcon,
  Camera,
  MapPin,
} from "lucide-react";
import { CityMap, type Bounds } from "./map";
import { TreeCard } from "./tree-card";
import { api } from "@/lib/client";
import {
  loadMapDataset,
  loadMapStats,
  filterMapTrees,
  treesInBounds,
} from "@/lib/map-dataset";
import {
  type Tree,
  type Color,
  type Stats,
  type Species,
  municipalUnverified,
} from "@/lib/domain";
const filters = [
  { name: "Todos", value: "" },
  { name: "Amarelos", value: "AMARELO" },
  { name: "Rosas / Roxos", value: "ROSA_ROXO" },
  { name: "Brancos", value: "BRANCO" },
  { name: "Floridos agora", value: "blooming" },
];
export function Home() {
  const [allTrees, setAllTrees] = useState<Tree[]>([]),
    [stats, setStats] = useState<Stats | null>(null),
    [filter, setFilter] = useState(""),
    [search, setSearch] = useState(""),
    [bounds, setBounds] = useState<Bounds>(),
    [selected, setSelected] = useState<Tree | null>(null),
    [list, setList] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [species, setSpecies] = useState<Species[]>([]),
    [specie, setSpecie] = useState(""),
    [confidence, setConfidence] = useState(""),
    [since, setSince] = useState("");
  const onBounds = useCallback((b: Bounds) => setBounds(b), []);
  const trees = useMemo(
    () =>
      filterMapTrees(allTrees, {
        color: filter && filter !== "blooming" ? filter : undefined,
        blooming: filter === "blooming",
        search,
        species: specie,
        confidence,
        since,
      }),
    [allTrees, filter, search, specie, confidence, since],
  );
  const visibleTrees = useMemo(
    () => treesInBounds(trees, bounds),
    [trees, bounds],
  );
  const selectedPoint = useMemo(
    () =>
      selected
        ? { lat: selected.latitude, lng: selected.longitude }
        : undefined,
    [selected],
  );
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("arvore");
    if (id)
      api<Tree | null>(`/api/trees/${id}`)
        .then(setSelected)
        .catch((e) => setError(e.message));
    loadMapStats()
      .then(setStats)
      .catch((e) => setError(e.message));
    api<Species[]>("/api/species")
      .then(setSpecies)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!selected) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.querySelector<HTMLButtonElement>(".sheet-close")?.focus();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [selected]);
  useEffect(() => {
    let disposed = false;
    loadMapDataset()
      .then((rows) => {
        if (disposed) return;
        setAllTrees(rows);
        setLoading(false);
      })
      .catch((error) => {
        if (disposed) return;
        setError(error.message);
        setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);
  return (
    <main id="conteudo" className="home">
      <div className="map-workspace">
        <CityMap
          trees={trees}
          colorFilter={
            ["AMARELO", "ROSA_ROXO", "BRANCO"].includes(filter)
              ? (filter as Color)
              : undefined
          }
          point={selectedPoint}
          onBounds={onBounds}
          onSelect={(id) => setSelected(trees.find((t) => t.id === id) || null)}
        />
        <div className="map-toolbar">
          <div className="search-box">
            <Search size={21} />
            <input
              aria-label="Buscar região, bairro ou código da árvore"
              placeholder="Buscar bairro ou árvore…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="icon-button small"
              aria-label="Filtros avançados"
              aria-expanded={advanced}
              onClick={() => setAdvanced(!advanced)}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
          <div className="chips" aria-label="Filtrar árvores">
            {filters.map((f) => (
              <button
                key={f.value}
                className={`chip ${filter === f.value ? "selected" : ""}`}
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.value && <span className={`dot ${f.value}`} />} {f.name}
              </button>
            ))}
          </div>
          {advanced && (
            <div className="advanced-filters">
              <label>
                Espécie
                <select
                  value={specie}
                  onChange={(e) => setSpecie(e.target.value)}
                >
                  <option value="">Todas</option>
                  {species.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome_popular}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Confiança
                <select
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="A">Atual verificado</option>
                  <option value="B">Histórico verificado</option>
                  <option value="C">Parcialmente verificado</option>
                  <option value="D">Declarado</option>
                </select>
              </label>
              <label>
                Observações desde
                <input
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
        <button className="list-toggle" onClick={() => setList(!list)}>
          {list ? <MapIcon size={17} /> : <List size={17} />}{" "}
          {list ? "Ver mapa" : "Ver em lista"}
        </button>
        {list && (
          <div className="map-list" aria-label="Árvores na área visível">
            {visibleTrees.length ? (
              visibleTrees.map((t) => <TreeCard key={t.id} tree={t} />)
            ) : (
              <p>Nenhuma árvore aprovada nesta área e nestes filtros.</p>
            )}
          </div>
        )}
        {selected && (
          <div
            className="tree-sheet"
            role="dialog"
            aria-label="Árvore selecionada"
          >
            <button
              className="sheet-close icon-button"
              aria-label="Fechar ficha"
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>
            <TreeCard tree={selected} />
            <Link className="btn btn-secondary" href={`/arvore/${selected.id}`}>
              Ver ficha completa
            </Link>
            <Link
              className="btn btn-primary"
              href={`/registrar?arvore=${selected.id}`}
            >
              {municipalUnverified(selected)
                ? "Confirmar esta árvore"
                : "Adicionar observação"}
            </Link>
          </div>
        )}
        <aside className="map-bottom">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">UM RETRATO VIVO DA NOSSA CIDADE</span>
              <h1>
                Ipês em Goiânia<span className="heading-flower">✿</span>
              </h1>
            </div>
            <Link href="/explorar" className="text-link">
              Explorar <ArrowRight size={17} />
            </Link>
          </div>
          <div className="stats-row">
            <div>
              <TreeDeciduous size={30} />
              <p>
                <strong>{stats?.arvores ?? "—"}</strong>
                <span>árvores mapeadas</span>
              </p>
            </div>
            <div>
              <Flower2 size={28} />
              <p>
                <strong>{stats?.floridas ?? "—"}</strong>
                <span>floridas nos últimos 7 dias</span>
              </p>
            </div>
            <div className="extra-stat">
              <Camera size={27} />
              <p>
                <strong>{stats?.fotos ?? "—"}</strong>
                <span>fotos aprovadas</span>
              </p>
            </div>
          </div>
          <div className="map-panel-footer">
            <div className="map-status" role="status">
              {error ? (
                <span className="error-text">{error}</span>
              ) : loading ? (
                "Buscando registros…"
              ) : visibleTrees.length ? (
                `${visibleTrees.length} árvores nesta área${allTrees.length === 5000 ? " · limite do conjunto local atingido" : ""}`
              ) : (
                "O mapa está começando. Seu registro pode ser o primeiro por aqui."
              )}
            </div>
            <span className="map-city-label">
              <MapPin size={14} /> Goiânia, GO
            </span>
          </div>
        </aside>
      </div>
      <section className="campaign-strip home-secondary">
        <div className="campaign-icon">
          <Flower2 size={29} />
        </div>
        <div>
          <span className="eyebrow">FLORADA 2026</span>
          <h2>A florada está acabando. Vamos registrá-la.</h2>
          <p>Ajude a construir um retrato colaborativo dos ipês de Goiânia.</p>
        </div>
        <Link className="btn btn-primary" href="/registrar">
          Registrar um ipê <ArrowRight size={17} />
        </Link>
      </section>
      <div className="home-links home-secondary">
        <Link href="/registrar?origem=historica">
          Tem fotos antigas? Contribua com o histórico ↗
        </Link>
        <Link href="/ciencia">
          Sua fotografia pode ajudar pesquisas futuras ↗
        </Link>
        <Link href="/privacidade">Privacidade</Link>
      </div>
    </main>
  );
}
