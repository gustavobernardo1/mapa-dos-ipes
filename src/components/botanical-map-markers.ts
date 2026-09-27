import type { Map as LibreMap, GeoJSONSource, Marker } from "maplibre-gl";
import {
  botanicalPalettes,
  botanicalSvg,
  clusterPalette,
  clusterSize,
} from "@/lib/botanical-icons";
import type { Color } from "@/lib/domain";
import { markMapPerformance } from "@/lib/map-performance";

export async function addBotanicalImages(
  map: LibreMap,
  isDisposed: () => boolean,
) {
  // A finite atlas, shared by every point: seven palettes × two provenance states.
  await Promise.all(
    Object.keys(botanicalPalettes).flatMap((key) =>
      [false, true].map(async (municipal) => {
        const palette = key as keyof typeof botanicalPalettes;
        const image = new Image(192, 192);
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(botanicalSvg(palette, false, municipal))}`;
        await image.decode();
        if (isDisposed()) return;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 192;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas indisponível para os ícones.");
        context.shadowColor = municipal ? "#263e3440" : "#183c3080";
        context.shadowBlur = municipal ? 6 : 8;
        context.shadowOffsetY = 4;
        context.drawImage(image, 0, 0, 192, 192);
        map.addImage(
          `ipe-${palette}${municipal ? "-municipal" : ""}`,
          context.getImageData(0, 0, 192, 192),
          { pixelRatio: 2 },
        );
      }),
    ),
  );
}

export function installBotanicalClusters(
  map: LibreMap,
  MarkerClass: typeof Marker,
  getColor: () => Color | undefined,
) {
  const markers = new Map<
    number,
    { marker: Marker; button: HTMLButtonElement; signature: string }
  >();
  let dirty = true;
  const invalidate = () => {
    dirty = true;
    map.triggerRepaint();
  };
  const onSource = (event: { sourceId?: string }) => {
    if (event.sourceId === "trees") invalidate();
  };
  const update = () => {
    if (!dirty || !map.isSourceLoaded("trees")) return;
    dirty = false;
    const ids = new Set<number>();
    const canvas = map.getCanvas();
    for (const feature of map.querySourceFeatures("trees", {
      filter: ["has", "point_count"],
    })) {
      if (feature.geometry.type !== "Point") continue;
      const id = Number(feature.properties.cluster_id);
      if (ids.has(id)) continue; // A source feature can occur in adjacent tiles.
      const coordinates = feature.geometry.coordinates.slice(0, 2) as [
        number,
        number,
      ];
      const point = map.project(coordinates);
      if (
        point.x < -48 ||
        point.y < -48 ||
        point.x > canvas.clientWidth + 48 ||
        point.y > canvas.clientHeight + 48
      )
        continue;
      ids.add(id);
      const count = Number(feature.properties.point_count);
      const palette = clusterPalette(getColor());
      const signature = `${count}:${palette}`;
      let entry = markers.get(id);
      if (!entry) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cluster-label botanical-cluster";
        entry = {
          marker: new MarkerClass({ element: button, anchor: "center" })
            .setLngLat(coordinates)
            .addTo(map),
          button,
          signature: "",
        };
        markers.set(id, entry);
      }
      const current = entry.marker.getLngLat();
      if (current.lng !== coordinates[0] || current.lat !== coordinates[1])
        entry.marker.setLngLat(coordinates);
      if (entry.signature !== signature) {
        entry.button.dataset.size = clusterSize(count);
        entry.button.dataset.palette = palette;
        entry.button.innerHTML = `${botanicalSvg(palette, true)}<span class="botanical-cluster-count">${count.toLocaleString("pt-BR")}</span>`;
        entry.button.setAttribute(
          "aria-label",
          `${count.toLocaleString("pt-BR")} árvores agrupadas. Aproximar.`,
        );
        entry.signature = signature;
      }
      entry.button.onclick = async (event) => {
        event.stopPropagation();
        try {
          const source = map.getSource("trees") as GeoJSONSource | undefined;
          if (!source) return;
          const zoom = await source.getClusterExpansionZoom(id);
          map.easeTo({ center: coordinates, zoom });
        } catch {
          // A filter/source replacement may invalidate a cluster while clicked.
          invalidate();
        }
      };
    }
    for (const [id, entry] of markers)
      if (!ids.has(id)) {
        entry.marker.remove();
        markers.delete(id);
      }
    if (ids.size) markMapPerformance("markers:visible");
  };
  map.on("sourcedata", onSource);
  map.on("move", invalidate);
  map.on("moveend", invalidate);
  map.on("render", update);
  invalidate();
  return {
    invalidate,
    dispose: () => {
      map.off("sourcedata", onSource);
      map.off("move", invalidate);
      map.off("moveend", invalidate);
      map.off("render", update);
      for (const entry of markers.values()) entry.marker.remove();
      markers.clear();
    },
  };
}
