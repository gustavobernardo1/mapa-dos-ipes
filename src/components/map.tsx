"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Map as LibreMap, GeoJSONSource } from "maplibre-gl";
import { LocateFixed, Maximize2, MapPin } from "lucide-react";
import { municipalUnverified, type Color, type Tree } from "@/lib/domain";
import "maplibre-gl/dist/maplibre-gl.css";
import { treePalette } from "@/lib/botanical-icons";
import { loadBasemap } from "@/lib/map-basemap";
import { markMapPerformance } from "@/lib/map-performance";
import {
  addBotanicalImages,
  installBotanicalClusters,
} from "./botanical-map-markers";
export type Bounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};
type Props = {
  trees?: Tree[];
  onSelect?: (id: string) => void;
  onBounds?: (bounds: Bounds) => void;
  point?: { lat: number; lng: number };
  onPoint?: (p: { lat: number; lng: number }) => void;
  compact?: boolean;
  colorFilter?: Color;
};
const emptyTrees: Tree[] = [];
export function CityMap({
  trees = emptyTrees,
  onSelect,
  onBounds,
  point,
  onPoint,
  compact,
  colorFilter,
}: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<LibreMap | null>(null);
  const callbacks = useRef({ onSelect, onBounds, onPoint });
  const navigationPosition = useRef<"bottom-right" | "top-right">(
    compact || onPoint ? "bottom-right" : "top-right",
  );
  const treeRef = useRef(trees);
  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: trees.map((tree) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [tree.longitude, tree.latitude],
        },
        properties: {
          id: tree.id,
          municipalUnverified: municipalUnverified(tree),
          icon: `ipe-${treePalette(tree)}${municipalUnverified(tree) ? "-municipal" : ""}`,
        },
      })),
    }),
    [trees],
  );
  const dataRef = useRef(data);
  const appliedData = useRef<typeof data | null>(null);
  const colorRef = useRef(colorFilter);
  const clusterController = useRef<ReturnType<
    typeof installBotanicalClusters
  > | null>(null);
  useEffect(() => {
    colorRef.current = colorFilter;
    clusterController.current?.invalidate();
  }, [colorFilter]);
  const userMarker = useRef<{ remove: () => void } | null>(null);
  const [error, setError] = useState(""),
    [locationMessage, setLocationMessage] = useState("");
  useEffect(() => {
    callbacks.current = { onSelect, onBounds, onPoint };
  }, [onSelect, onBounds, onPoint]);
  useEffect(() => {
    treeRef.current = trees;
    dataRef.current = data;
  }, [trees, data]);
  useEffect(() => {
    let disposed = false;
    Promise.all([import("maplibre-gl"), loadBasemap()])
      .then(([lib, style]) => {
        if (disposed || !container.current) return;
        lib.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
        try {
          const m = new lib.Map({
            container: container.current,
            style,
            center: [-49.264, -16.686],
            zoom: 12.4,
            attributionControl: { compact: true },
          });
          map.current = m;
          m.addControl(
            new lib.NavigationControl({ showCompass: false }),
            navigationPosition.current,
          );
          m.on("error", () =>
            setError(
              "O mapa não carregou completamente. Você pode usar a lista ou informar coordenadas.",
            ),
          );
          m.on("load", async () => {
            try {
              await addBotanicalImages(m, () => disposed);
              if (disposed) return;
              m.addSource("trees", {
                type: "geojson",
                data: dataRef.current,
                cluster: true,
                clusterMaxZoom: 11,
                clusterRadius: 24,
              });
              appliedData.current = dataRef.current;
              markMapPerformance("source:ready");
              clusterController.current = installBotanicalClusters(
                m,
                lib.Marker,
                () => colorRef.current,
              );
              m.addLayer({
                id: "points",
                type: "symbol",
                source: "trees",
                filter: ["!", ["has", "point_count"]],
                layout: {
                  "icon-image": ["get", "icon"],
                  "symbol-sort-key": [
                    "case",
                    ["get", "municipalUnverified"],
                    0,
                    1,
                  ],
                  "icon-size": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    12,
                    0.32,
                    15,
                    0.4,
                    18,
                    0.5,
                  ],
                  "icon-allow-overlap": true,
                  "icon-ignore-placement": true,
                  "icon-padding": 2,
                },
                paint: {
                  "icon-opacity": [
                    "case",
                    ["get", "municipalUnverified"],
                    0.65,
                    1,
                  ],
                },
              });
              const markVisible = () => {
                if (
                  performance.getEntriesByName("ipes:markers:visible").length
                ) {
                  m.off("render", markVisible);
                  return;
                }
                if (m.queryRenderedFeatures({ layers: ["points"] }).length)
                  markMapPerformance("markers:visible");
              };
              m.on("render", markVisible);
              m.on("click", "points", (e) => {
                const id = e.features?.[0]?.properties.id;
                if (id) callbacks.current.onSelect?.(id);
              });
              m.on("mouseenter", "points", () => {
                m.getCanvas().style.cursor = "pointer";
              });
              m.on("mouseleave", "points", () => {
                m.getCanvas().style.cursor = "";
              });
              const b = m.getBounds();
              callbacks.current.onBounds?.({
                west: b.getWest(),
                south: b.getSouth(),
                east: b.getEast(),
                north: b.getNorth(),
              });
            } catch {
              if (!disposed)
                setError(
                  "Não foi possível carregar os ícones do mapa. Use a lista para consultar as árvores.",
                );
            }
          });
          m.on("moveend", () => {
            const b = m.getBounds();
            callbacks.current.onBounds?.({
              west: b.getWest(),
              south: b.getSouth(),
              east: b.getEast(),
              north: b.getNorth(),
            });
          });
          m.on("click", (e) => {
            if (callbacks.current.onPoint)
              callbacks.current.onPoint({
                lat: e.lngLat.lat,
                lng: e.lngLat.lng,
              });
          });
        } catch {
          setError(
            "Mapa indisponível neste navegador. Use a alternativa em lista ou as coordenadas.",
          );
        }
      })
      .catch(() => {
        if (!disposed)
          setError("Mapa indisponível. Use a lista para consultar as árvores.");
      });
    return () => {
      disposed = true;
      userMarker.current?.remove();
      clusterController.current?.dispose();
      clusterController.current = null;
      map.current?.remove();
      map.current = null;
      appliedData.current = null;
    };
  }, []);
  useEffect(() => {
    const apply = () => {
      const source = map.current?.getSource("trees") as
        GeoJSONSource | undefined;
      if (!source || appliedData.current === data) return;
      source.setData(data);
      appliedData.current = data;
      markMapPerformance("source:set-data");
    };
    apply();
    map.current?.on("load", apply);
    return () => {
      map.current?.off("load", apply);
    };
  }, [data]);
  useEffect(() => {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng))
      return;
    let marker: { remove: () => void } | undefined,
      disposed = false;
    import("maplibre-gl").then((lib) => {
      if (!map.current || disposed) return;
      const isTree =
        !callbacks.current.onPoint &&
        treeRef.current.some(
          (tree) => tree.latitude === point.lat && tree.longitude === point.lng,
        );
      if (!isTree)
        marker = new lib.Marker({ color: "#214b3c" })
          .setLngLat([point.lng, point.lat])
          .addTo(map.current);
      map.current.easeTo({ center: [point.lng, point.lat], zoom: 16 });
    });
    return () => {
      disposed = true;
      marker?.remove();
    };
  }, [point]);
  function locate() {
    if (!navigator.geolocation) {
      setLocationMessage("GPS indisponível. Informe um ponto manual.");
      return;
    }
    setLocationMessage("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const point = { lat: p.coords.latitude, lng: p.coords.longitude };
        map.current?.easeTo({ center: [point.lng, point.lat], zoom: 16 });
        callbacks.current.onPoint?.(point);
        if (!callbacks.current.onPoint)
          import("maplibre-gl").then((lib) => {
            if (!map.current) return;
            userMarker.current?.remove();
            userMarker.current = new lib.Marker({ color: "#397ba0" })
              .setLngLat([point.lng, point.lat])
              .addTo(map.current);
          });
        setLocationMessage(
          `Localização obtida (precisão aproximada: ${Math.round(p.coords.accuracy)} m).`,
        );
      },
      () =>
        setLocationMessage(
          "Não foi possível obter o GPS. Permita o acesso ou escolha o ponto manualmente.",
        ),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  return (
    <div className={`city-map ${compact ? "compact" : ""}`}>
      <div
        ref={container}
        className="map-canvas"
        aria-label="Mapa de Goiânia"
      />
      <div className="map-actions">
        {!onPoint && (
          <details className="map-legend-control">
            <summary>Legenda</summary>
            <span className="map-legend">
              <span>
                <Image
                  src="/map-icons/arvore-verde-municipal.svg"
                  width={24}
                  height={24}
                  alt=""
                />{" "}
                Cadastro municipal não verificado
              </span>
              <span>
                <Image
                  src="/map-icons/arvore-verde.svg"
                  width={24}
                  height={24}
                  alt=""
                />{" "}
                Verificação comunitária
              </span>
              <small>Cor indica o tipo de ipê; não a florada atual.</small>
            </span>
          </details>
        )}
        <button
          type="button"
          className="icon-button"
          onClick={locate}
          aria-label="Usar minha localização"
        >
          <LocateFixed size={22} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() =>
            map.current?.easeTo({ center: [-49.264, -16.686], zoom: 12.4 })
          }
          aria-label="Mostrar Goiânia"
        >
          <Maximize2 size={20} />
        </button>
      </div>
      {onPoint && (
        <span className="map-instruction">
          <MapPin size={15} />
          Toque no mapa para ajustar o ponto
        </span>
      )}
      {(error || locationMessage) && (
        <div className="map-notice" role="status">
          {error || locationMessage}
        </div>
      )}
    </div>
  );
}
