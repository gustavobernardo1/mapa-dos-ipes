"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, LogOut, Check, X, RefreshCw } from "lucide-react";
import { api } from "@/lib/client";
import {
  labels,
  colors,
  photoUrl,
  formatDate,
  type Observation,
  type Tree,
  type Species,
  type Confidence,
  type Color,
  distanceMeters,
} from "@/lib/domain";
import { MunicipalBadge } from "./municipal-badge";
import { CityMap } from "./map";
type Pending = Observation & { arvore: Tree };
function Review({
  o,
  species,
  onDone,
}: {
  o: Pending;
  species: Species[];
  onDone: () => void;
}) {
  const [color, setColor] = useState<Color>(o.cor_observada),
    [confidence, setConfidence] = useState<Confidence>("D"),
    [specie, setSpecie] = useState(o.arvore.especie_id || ""),
    [tree, setTree] = useState(""),
    [nearby, setNearby] = useState<Tree[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    api<Tree[]>(
      `/api/trees?lat=${o.latitude}&lng=${o.longitude}&radius=30&limit=20`,
    )
      .then((ts) =>
        setNearby(
          ts.filter(
            (t) =>
              !t.origem_municipal ||
              distanceMeters(
                o.latitude,
                o.longitude,
                t.latitude,
                t.longitude,
              ) <= 10,
          ),
        ),
      )
      .catch((e) => setError(e.message));
  }, [o.latitude, o.longitude]);
  async function decide(status: "APROVADO" | "REJEITADO") {
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/${o.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          cor: color,
          confianca: confidence,
          especie_id: specie || null,
          criar_nova: tree === "new",
          ...(tree && tree !== "new" ? { arvore_id: tree } : {}),
        }),
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="review-card">
      <div className="review-photos">
        {o.fotos.map((p) => (
          <a
            key={p.id}
            href={photoUrl(p)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={photoUrl(p)}
              alt="Foto aguardando moderação"
              width={900}
              height={700}
              unoptimized
              loading="eager"
            />
          </a>
        ))}
        <div className="review-map">
          <CityMap compact point={{ lat: o.latitude, lng: o.longitude }} />
        </div>
      </div>
      <div className="review-data">
        <span className="eyebrow">PENDENTE · {o.arvore.codigo_publico}</span>
        <h2>{formatDate(o.data_observacao)}</h2>
        <MunicipalBadge tree={o.arvore} />
        <p>
          {labels[o.origem]} · {o.bairro || "Região não informada"}
        </p>
        <p>
          {labels[o.status_floracao]} · {labels[o.identificacao_usuario]}
        </p>
        <p className="coordinate">
          Declarado: {o.latitude}, {o.longitude}
        </p>
        {o.comentario && <p>{o.comentario}</p>}
        {o.nome_publico && <p>Nome público: {o.nome_publico}</p>}
        <details>
          <summary>EXIF relevante (privado)</summary>
          {o.metadata?.map((m) => (
            <p key={m.foto_id}>
              Data: {m.data_exif || "ausente"}
              <br />
              GPS: {m.latitude_exif ?? "ausente"},{" "}
              {m.longitude_exif ?? "ausente"}
            </p>
          ))}
          <p className="muted">
            Metadados são indícios, não prova de autenticidade. Compare com os
            dados declarados e a fotografia.
          </p>
        </details>
        <div className="field-row">
          <label>
            Cor
            <select
              value={color}
              onChange={(e) => setColor(e.target.value as Color)}
            >
              {colors.map((c) => (
                <option key={c} value={c}>
                  {labels[c]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Confiança dos dados
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as Confidence)}
            >
              {["A", "B", "C", "D"].map((c) => (
                <option key={c} value={c}>
                  {labels[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Classificação provável
          <select value={specie} onChange={(e) => setSpecie(e.target.value)}>
            <option value="">Sem determinação — ipê provável</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome_popular}
              </option>
            ))}
          </select>
        </label>
        <label>
          Associar à árvore
          <select value={tree} onChange={(e) => setTree(e.target.value)}>
            <option value="">
              {o.arvore.status === "APROVADO" || o.arvore.origem_municipal
                ? `Manter em ${o.arvore.codigo_publico}`
                : "Aprovar como nova árvore"}
            </option>
            <option value="new">Criar outra árvore neste ponto</option>
            {nearby.map((t) => (
              <option value={t.id} key={t.id}>
                {t.codigo_publico} · {Math.round(t.distancia || 0)} m ·{" "}
                {t.bairro}
              </option>
            ))}
          </select>
        </label>
        {nearby.length > 0 && (
          <div className="nearby-photos">
            {nearby.map((t) => (
              <div key={t.id}>
                {t.observacoes[0]?.fotos[0] && (
                  <Image
                    src={photoUrl(t.observacoes[0].fotos[0], true)}
                    width={80}
                    height={80}
                    unoptimized
                    alt={`Candidata ${t.codigo_publico}`}
                  />
                )}
                <small>{t.codigo_publico}</small>
              </div>
            ))}
          </div>
        )}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            disabled={busy}
            className="btn btn-danger"
            onClick={() => decide("REJEITADO")}
          >
            <X size={17} />
            Rejeitar
          </button>
          <button
            disabled={busy}
            className="btn btn-primary"
            onClick={() => decide("APROVADO")}
          >
            <Check size={17} />
            {busy ? "Salvando…" : "Aprovar"}
          </button>
        </div>
      </div>
    </article>
  );
}
export function Admin() {
  const [authenticated, setAuthenticated] = useState(false),
    [mode, setMode] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [pending, setPending] = useState<Pending[]>([]),
    [species, setSpecies] = useState<Species[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      setPending(await api<Pending[]>("/api/admin"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    api<{ backend: string; authenticated: boolean }>("/api/status")
      .then((s) => {
        setMode(s.backend);
        setAuthenticated(s.authenticated);
        if (s.authenticated)
          api<Pending[]>("/api/admin")
            .then(setPending)
            .catch((e) => setError(e.message));
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
    api<Species[]>("/api/species")
      .then(setSpecies)
      .catch(() => {});
  }, []);
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setPassword("");
      setAuthenticated(true);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="conteudo" className={`page ${authenticated ? "" : "narrow"}`}>
      <div className="page-intro">
        <span className="eyebrow inline">
          <ShieldCheck size={17} />
          CURADORIA DA COMUNIDADE
        </span>
        <h1>Moderação</h1>
        <p>
          Confira a fotografia, o local e a data antes de tornar um registro
          público.
        </p>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {!ready ? (
        <p role="status">Verificando acesso…</p>
      ) : !authenticated ? (
        <form onSubmit={signIn} className="form-card">
          <h2>Acesso de administrador</h2>
          {mode === "local" && (
            <p className="notice">
              Ambiente local de desenvolvimento. Configure a senha e o segredo
              da sessão em .env.local. Os envios locais não são dados de
              produção.
            </p>
          )}
          <label>
            E-mail{mode === "local" ? " (não utilizado no modo local)" : ""}
            <input
              type="email"
              autoComplete="username"
              required={mode !== "local"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      ) : (
        <>
          <div className="admin-toolbar">
            <p>
              <strong>{pending.length}</strong> registros pendentes{" "}
              {pending.length === 50
                ? "(primeira página; modere para carregar os próximos)"
                : ""}
            </p>
            <div className="inline">
              <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={refresh}
              >
                <RefreshCw size={17} />
                Atualizar
              </button>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    await api("/api/logout", { method: "POST" });
                    setAuthenticated(false);
                    setPending([]);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <LogOut size={17} />
                Sair
              </button>
            </div>
          </div>
          {pending.map((o) => (
            <Review key={o.id} o={o} species={species} onDone={refresh} />
          ))}
          {pending.length === 0 && !busy && !error && (
            <div className="empty-state">
              <Check size={42} />
              <h2>Nenhum registro aguardando revisão.</h2>
              <p>Os próximos envios aparecerão aqui.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
