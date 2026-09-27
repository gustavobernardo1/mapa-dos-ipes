import type { StyleSpecification, LayerSpecification } from "maplibre-gl";

export const fallbackBasemap: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: { "raster-saturation": -0.55, "raster-opacity": 0.95 },
    },
  ],
};

export function neutralBasemap(
  original: StyleSpecification,
): StyleSpecification {
  const style = structuredClone(original);
  for (const layer of style.layers) {
    const sourceLayer =
      "source-layer" in layer ? layer["source-layer"] || "" : "";
    if (layer.type === "background")
      layer.paint = { ...layer.paint, "background-color": "#f3efe3" };
    if (layer.type === "fill") {
      if (["grass", "forest", "wood", "leisure"].includes(sourceLayer))
        layer.paint = {
          ...layer.paint,
          "fill-color": "#c8ddb8",
          "fill-opacity": 1,
        };
      else if (sourceLayer === "water")
        layer.paint = { ...layer.paint, "fill-color": "#9ecfdf" };
      else if (sourceLayer === "residential")
        layer.paint = { ...layer.paint, "fill-color": "#e9eadf" };
      else if (sourceLayer === "building")
        layer.paint = {
          ...layer.paint,
          "fill-color": "#dde0d3",
          "fill-outline-color": "#cbd1c0",
        };
    }
    if (layer.type === "line") {
      if (sourceLayer === "waterway")
        layer.paint = { ...layer.paint, "line-color": "#87bacd" };
      else if (["road", "pathway"].includes(sourceLayer))
        layer.paint = {
          ...layer.paint,
          "line-color": [
            "match",
            ["get", "class"],
            ["motorway", "trunk", "primary", "secondary"],
            /outline/i.test(layer.id) ? "#b1b8a5" : "#ded7bd",
            /outline/i.test(layer.id) ? "#ccd2c3" : "#f8f7f0",
          ],
        };
    }
    if (layer.type === "symbol") {
      if (["road_label", "place_label"].includes(sourceLayer))
        layer.minzoom = Math.min(layer.minzoom ?? 12, 12);
      if (/poi/.test(sourceLayer))
        layer.layout = { ...layer.layout, visibility: "none" };
      else
        layer.paint = {
          ...layer.paint,
          "text-color": sourceLayer === "place_label" ? "#465742" : "#5c6753",
          "text-halo-color": "#faf8f2",
          "text-halo-width": 1.2,
        };
    }
  }
  const source = style.layers.find(
    (layer) => "source-layer" in layer && layer["source-layer"] === "waterway",
  );
  if (source && "source" in source) {
    const waterIndex = style.layers.findIndex(
      (layer) => layer.type === "fill" && layer["source-layer"] === "water",
    );
    const streams: LayerSpecification = {
      id: "Ipes streams",
      type: "line",
      source: source.source,
      "source-layer": "waterway",
      minzoom: 12,
      filter: [
        "match",
        ["get", "class"],
        ["stream", "canal", "drain"],
        true,
        false,
      ],
      paint: {
        "line-color": "#87bacd",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 17, 2.4],
      },
    };
    style.layers.splice(waterIndex >= 0 ? waterIndex : 1, 0, streams);
    const fontLayer = style.layers.find(
      (layer) => layer.type === "symbol" && layer.layout?.["text-font"],
    );
    const font = (fontLayer?.type === "symbol"
      ? fontLayer.layout?.["text-font"]
      : undefined) || ["Roboto Regular", "Noto Sans Regular"];
    style.layers.push({
      id: "Ipes park names",
      type: "symbol",
      source: source.source,
      "source-layer": "poi_public",
      minzoom: 12,
      filter: ["all", ["==", ["get", "subclass"], "park"], ["has", "name"]],
      layout: {
        "text-field": ["coalesce", ["get", "name:pt"], ["get", "name"]],
        "text-font": font,
        "text-size": 11,
        "text-max-width": 9,
        "text-padding": 4,
      },
      paint: {
        "text-color": "#537742",
        "text-halo-color": "#f6f8f1",
        "text-halo-width": 1,
      },
    });
    style.layers.push({
      id: "Ipes water names",
      type: "symbol",
      source: source.source,
      "source-layer": "water_label",
      minzoom: 12,
      filter: [
        "match",
        ["get", "class"],
        ["river", "stream", "canal"],
        true,
        false,
      ],
      layout: {
        "text-field": ["coalesce", ["get", "name:pt"], ["get", "name"]],
        "text-font": font,
        "text-size": 10,
        "symbol-placement": "line",
      },
      paint: {
        "text-color": "#42788c",
        "text-halo-color": "#f5f7f3",
        "text-halo-width": 1,
      },
    });
  }
  return style;
}

let basemap: Promise<StyleSpecification> | undefined;
export async function loadBasemap(): Promise<StyleSpecification> {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!key) return fallbackBasemap;
  basemap ??= fetch(
    `https://api.maptiler.com/maps/dataviz-v4-light/style.json?key=${encodeURIComponent(key)}`,
  )
    .then(async (response) => {
      if (!response.ok) throw new Error("Mapa-base indisponível.");
      return neutralBasemap(await response.json());
    })
    .catch((error) => {
      basemap = undefined;
      throw error;
    });
  return structuredClone(await basemap);
}
