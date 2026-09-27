"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  Images,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  LocateFixed,
  LoaderCircle,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { CityMap } from "./map";
import { api } from "@/lib/client";
import {
  colors,
  blooms,
  labels,
  photoUrl,
  submissionSchema,
  type Tree,
  municipalUnverified,
  distanceMeters,
} from "@/lib/domain";
import { MunicipalBadge } from "./municipal-badge";
export function Registration({
  historical = false,
  attachedId,
}: {
  historical?: boolean;
  attachedId?: string;
}) {
  const [step, setStep] = useState(1),
    [origin, setOrigin] = useState<"CAMPO_ATUAL" | "FOTO_HISTORICA">(
      historical ? "FOTO_HISTORICA" : "CAMPO_ATUAL",
    ),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [lat, setLat] = useState(""),
    [lng, setLng] = useState(""),
    [color, setColor] = useState("NAO_SEI"),
    [bloom, setBloom] = useState("NAO_SEI"),
    [identification, setIdentification] = useState("PROVAVEL"),
    [comment, setComment] = useState(""),
    [name, setName] = useState(""),
    [neighborhood, setNeighborhood] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [exif, setExif] = useState(""),
    [candidates, setCandidates] = useState<Tree[]>([]),
    [treeId, setTreeId] = useState(""),
    [attached, setAttached] = useState<Tree | null>(null),
    [success, setSuccess] = useState(false),
    [gpsMessage, setGpsMessage] = useState("");
  const nowInput = useRef<HTMLInputElement>(null),
    oldInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (attachedId)
      api<Tree | null>(`/api/trees/${attachedId}`)
        .then((t) => {
          if (t) {
            setAttached(t);
            setTreeId(t.id);
            setLat(String(t.latitude));
            setLng(String(t.longitude));
            setNeighborhood(t.bairro);
          }
        })
        .catch((e) => setError(e.message));
  }, [attachedId]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function choose(
    f: File | undefined,
    source: "CAMPO_ATUAL" | "FOTO_HISTORICA",
  ) {
    if (!f) return;
    setError("");
    setExif("");
    setOrigin(source);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      f.size > 4 * 1024 * 1024
    ) {
      setError(
        "Escolha JPEG, PNG ou WebP de até 4 MB. Exporte fotos HEIC como JPEG.",
      );
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setBusy(true);
    try {
      const parser = await import("exifr");
      const metadata = await parser.default.parse(f, {
        pick: [
          "DateTimeOriginal",
          "GPSLatitude",
          "GPSLongitude",
          "GPSLatitudeRef",
          "GPSLongitudeRef",
        ],
      });
      const parts: string[] = [];
      if (metadata?.DateTimeOriginal instanceof Date) {
        setDate(metadata.DateTimeOriginal.toISOString().slice(0, 10));
        parts.push("data original");
      }
      if (
        Number.isFinite(metadata?.latitude) &&
        Number.isFinite(metadata?.longitude)
      ) {
        setLat(String(metadata.latitude));
        setLng(String(metadata.longitude));
        parts.push("localização");
      }
      setExif(
        parts.length
          ? `Encontramos ${parts.join(" e ")} no EXIF. Confira e corrija antes de enviar.`
          : "Sem data ou GPS no EXIF. Informe esses dados manualmente.",
      );
    } catch {
      setExif(
        "Não foi possível ler o EXIF. Você pode informar data e local manualmente.",
      );
    } finally {
      setBusy(false);
    }
  }
  const validPoint =
    lat.trim() !== "" &&
    lng.trim() !== "" &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180;
  const point = validPoint ? { lat: Number(lat), lng: Number(lng) } : undefined;
  async function next() {
    setError("");
    if (step === 1) {
      if (!file) {
        setError("Adicione uma fotografia para continuar.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!validPoint) {
        setError(
          "Escolha um ponto no mapa ou informe latitude e longitude válidas.",
        );
        return;
      }
      setBusy(true);
      try {
        const nearby = await api<Tree[]>(`/api/nearby?lat=${lat}&lng=${lng}`);
        setCandidates(nearby);
        setStep(3);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  }
  function gps() {
    setGpsMessage("Buscando GPS…");
    if (!navigator.geolocation) {
      setGpsMessage("GPS indisponível. Informe o local manualmente.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(String(p.coords.latitude));
        setLng(String(p.coords.longitude));
        setGpsMessage(
          `Ponto obtido. Precisão estimada: ${Math.round(p.coords.accuracy)} m. Confira no mapa.`,
        );
      },
      () =>
        setGpsMessage(
          "Acesso ao GPS negado ou indisponível. Toque no mapa ou digite as coordenadas.",
        ),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  async function send() {
    if (busy) return;
    setError("");
    if (!validPoint) {
      setError("Informe uma localização válida.");
      return;
    }
    const parsed = submissionSchema.safeParse({
      latitude: Number(lat),
      longitude: Number(lng),
      data_observacao: date,
      origem: origin,
      cor_observada: color,
      status_floracao: bloom,
      identificacao_usuario: identification,
      comentario: comment,
      nome_publico: name,
      bairro: neighborhood,
      consentimento: consent,
      ...(treeId ? { arvore_id: treeId } : {}),
    });
    if (!parsed.success) {
      setError(
        "Confira a data e autorize a publicação dos dados antes de enviar.",
      );
      return;
    }
    if (!file) return;
    const selectedTree =
      candidates.find((t) => t.id === treeId) ||
      (attached?.id === treeId ? attached : null);
    if (
      selectedTree?.origem_municipal &&
      distanceMeters(
        Number(lat),
        Number(lng),
        selectedTree.latitude,
        selectedTree.longitude,
      ) > 10
    ) {
      setError(
        "Para confirmar o cadastro municipal, informe o ponto observado a até 10 m da árvore. Se for outra árvore, selecione novo cadastro.",
      );
      return;
    }
    const data = new FormData();
    data.set("photo", file);
    data.set("data", JSON.stringify(parsed.data));
    setBusy(true);
    try {
      await api("/api/submit", { method: "POST", body: data });
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <main id="conteudo" className="page narrow">
        <div className="success-card">
          <CheckCircle2 size={56} />
          <span className="eyebrow">REGISTRO RECEBIDO</span>
          <h1>Obrigada por registrar esse instante.</h1>
          <p>
            Sua fotografia está <strong>pendente de moderação</strong>. Depois
            de aprovada, ela aparecerá no mapa, na galeria e no histórico da
            árvore.
          </p>
          <span className="bloom-badge">PENDENTE</span>
          <Link href="/" className="btn btn-primary">
            Voltar ao mapa <ArrowRight size={17} />
          </Link>
          <Link className="btn btn-secondary" href="/registrar?novo=1">
            Enviar outro registro
          </Link>
        </div>
      </main>
    );
  return (
    <main id="conteudo" className="page narrow">
      <div className="page-intro">
        <span className="eyebrow">CADA REGISTRO CONTA</span>
        <h1>
          {attached
            ? municipalUnverified(attached)
              ? "Confirmar esta árvore"
              : "Revisite esta árvore."
            : "Uma foto. Um ponto. Uma contribuição."}
        </h1>
        <p>
          {attached
            ? `Adicionar ao histórico de ${attached.codigo_publico}.`
            : "Não precisa saber botânica. Basta observar e compartilhar."}
        </p>
      </div>
      {attached && (
        <>
          <MunicipalBadge tree={attached} />
          {attached.origem_municipal && (
            <p className="notice">
              Informe a localização da árvore que você fotografou. A associação
              ao cadastro municipal exige distância de até 10 m. Uma foto antiga
              contribui para o histórico e não comprova existência atual.
            </p>
          )}
        </>
      )}
      <ol className="steps" aria-label="Etapas do registro">
        {["Fotografia", "Localização", "Observação"].map((s, i) => (
          <li
            key={s}
            className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""}
          >
            <span>{step > i + 1 ? "✓" : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="form-card">
        {step === 1 && (
          <>
            <h2>Como você quer participar?</h2>
            <div className="upload-choices">
              <button
                className={`upload-choice ${origin === "CAMPO_ATUAL" ? "selected" : ""}`}
                onClick={() => {
                  setOrigin("CAMPO_ATUAL");
                  nowInput.current?.click();
                }}
              >
                <Camera size={29} />
                <strong>Fotografar agora</strong>
                <span>Um ipê que você está vendo hoje</span>
              </button>
              <button
                className={`upload-choice ${origin === "FOTO_HISTORICA" ? "selected" : ""}`}
                onClick={() => {
                  setOrigin("FOTO_HISTORICA");
                  oldInput.current?.click();
                }}
              >
                <Images size={29} />
                <strong>Enviar foto antiga</strong>
                <span>Resgate uma florada do seu arquivo</span>
              </button>
            </div>
            <input
              ref={nowInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              aria-label="Fotografar agora"
              className="file-input"
              onChange={(e) => choose(e.target.files?.[0], "CAMPO_ATUAL")}
            />
            <input
              ref={oldInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Enviar foto antiga"
              className="file-input"
              onChange={(e) => choose(e.target.files?.[0], "FOTO_HISTORICA")}
            />
            {preview ? (
              <div className="photo-preview">
                <Image
                  src={preview}
                  width={700}
                  height={500}
                  alt="Prévia da fotografia selecionada"
                  unoptimized
                />
                <span>
                  <CheckCircle2 size={16} />
                  {file?.name}
                </span>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={34} />
                <p>JPEG, PNG ou WebP · até 4 MB</p>
                <small>
                  Fotografe a árvore e as flores. Evite pessoas, placas de
                  carros e outros dados pessoais.
                </small>
              </div>
            )}
            {exif && <p className="notice">{exif}</p>}
            <label>
              Quando a fotografia foi feita?
              <input
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Onde está a árvore?</h2>
            <p className="muted">
              A localização deve ser da árvore. Confira o GPS e ajuste o ponto
              se necessário.
            </p>
            <button className="btn btn-secondary" type="button" onClick={gps}>
              <LocateFixed size={18} />
              Usar GPS do celular
            </button>
            {gpsMessage && (
              <p className="notice" role="status">
                {gpsMessage}
              </p>
            )}
            <div className="location-map">
              <CityMap
                compact
                point={point}
                onPoint={(p) => {
                  setLat(p.lat.toFixed(7));
                  setLng(p.lng.toFixed(7));
                }}
              />
            </div>
            <div className="field-row">
              <label>
                Latitude
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="-16.686"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </label>
              <label>
                Longitude
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="-49.264"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </label>
            </div>
            <label>
              Bairro ou região (opcional)
              <input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                maxLength={100}
                placeholder="Ex.: Setor Bueno"
              />
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <h2>Conte o que você observou.</h2>
            <div className="field-row">
              <label>
                Cor das flores
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                >
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {labels[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado da floração
                <select
                  value={bloom}
                  onChange={(e) => setBloom(e.target.value)}
                >
                  {blooms.map((b) => (
                    <option key={b} value={b}>
                      {labels[b]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Você acha que é um ipê?
              <select
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
              >
                {["CERTEZA", "PROVAVEL", "NAO_SEI"].map((v) => (
                  <option key={v} value={v}>
                    {labels[v]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Algum detalhe? (opcional)
              <textarea
                value={comment}
                maxLength={1500}
                rows={3}
                onChange={(e) => setComment(e.target.value)}
                placeholder="O que chamou sua atenção?"
              />
            </label>
            <label>
              Seu nome público (opcional)
              <input
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como quer aparecer nos créditos"
              />
            </label>
            {(candidates.length > 0 || attached) && (
              <div className="duplicate-card">
                <h3>
                  Encontramos uma árvore cadastrada perto deste local. É a
                  mesma?
                </h3>
                {[
                  ...(attached && !candidates.some((t) => t.id === attached.id)
                    ? [attached]
                    : []),
                  ...candidates,
                ].map((t) => (
                  <label className="candidate" key={t.id}>
                    <input
                      type="radio"
                      name="tree"
                      checked={treeId === t.id}
                      onChange={() => setTreeId(t.id)}
                    />
                    {t.observacoes[0]?.fotos[0] && (
                      <Image
                        src={photoUrl(t.observacoes[0].fotos[0], true)}
                        width={64}
                        height={64}
                        unoptimized
                        alt={t.nome_popular}
                      />
                    )}
                    <span>
                      <strong>{t.codigo_publico}</strong>
                      <MunicipalBadge tree={t} />
                      <small>
                        {t.nome_popular} ·{" "}
                        {t.distancia !== undefined
                          ? `${Math.round(t.distancia)} m`
                          : "árvore selecionada"}
                      </small>
                    </span>
                  </label>
                ))}
                <label className="checkbox">
                  <input
                    type="radio"
                    name="tree"
                    checked={!treeId}
                    onChange={() => setTreeId("")}
                  />
                  É outra árvore — criar novo cadastro
                </label>
              </div>
            )}
            <div className="notice inline">
              <ShieldCheck size={19} />
              Todo envio passa por moderação. Informações declaradas não se
              tornam dados científicos verificados automaticamente.
            </div>
            <label className="checkbox consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Autorizo a publicação da foto, data, localização da árvore e
                nome público informado, e seu possível uso em pesquisa, conforme
                a{" "}
                <Link href="/privacidade" target="_blank">
                  política de privacidade
                </Link>
                . Tenho autorização para compartilhar a foto.
              </span>
            </label>
          </>
        )}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {step > 1 ? (
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              <ArrowLeft size={17} />
              Voltar
            </button>
          ) : (
            <span className="muted inline">
              <MapPin size={15} />
              Goiânia — GO
            </span>
          )}
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={step === 3 ? send : next}
          >
            {busy ? <LoaderCircle className="spin" size={18} /> : null}
            {busy
              ? "Aguarde…"
              : step === 3
                ? "Enviar para moderação"
                : "Continuar"}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </main>
  );
}
