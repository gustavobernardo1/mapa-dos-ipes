// Browser User Timing marks, inspectable without adding UI or telemetry calls.
export function markMapPerformance(
  name: "source:ready" | "markers:visible" | "source:set-data",
) {
  if (
    name !== "source:set-data" &&
    performance.getEntriesByName(`ipes:${name}`).length
  )
    return;
  performance.mark(`ipes:${name}`);
}
