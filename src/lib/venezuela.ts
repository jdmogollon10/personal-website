// Simplified outline of Venezuela as [longitude, latitude] points, plus a tiny
// equirectangular projection so a hometown can be placed by its real coordinates.

export const VENEZUELA: [number, number][] = [
  [-71.33, 11.85], [-72.25, 11.15], [-72.8, 10.45], [-73.35, 9.2], [-72.75, 8.35],
  [-72.35, 7.9], [-72.45, 7.4], [-71.5, 7.0], [-70.1, 6.97], [-69.4, 6.1],
  [-68.3, 6.2], [-67.45, 6.2], [-67.6, 5.55], [-67.85, 4.5], [-67.3, 3.4],
  [-67.85, 2.8], [-67.2, 2.2], [-66.87, 1.22], [-66.1, 0.72], [-65.5, 0.95],
  [-64.4, 1.5], [-64.0, 2.3], [-64.4, 3.2], [-64.1, 4.1], [-63.1, 3.8],
  [-62.3, 4.1], [-61.0, 4.5], [-60.73, 5.2], [-61.1, 6.2], [-60.4, 7.1],
  [-60.6, 7.8], [-59.8, 8.3], [-60.8, 8.6], [-61.6, 9.2], [-62.0, 9.9],
  [-62.4, 10.4], [-61.9, 10.72], [-62.8, 10.7], [-63.8, 10.65], [-64.2, 10.45],
  [-64.7, 10.2], [-65.1, 10.1], [-66.1, 10.6], [-66.9, 10.6], [-67.8, 10.5],
  [-68.2, 10.5], [-68.4, 10.9], [-69.2, 11.45], [-69.7, 11.5], [-69.8, 11.75],
  [-70.0, 12.15], [-70.25, 11.95], [-70.2, 11.6], [-69.95, 11.45], [-70.3, 11.3],
  [-71.0, 11.0], [-71.5, 10.9], [-71.95, 11.05], [-71.8, 11.4],
];

export const MIAMI: [number, number] = [-80.19, 25.76];

export type Bounds = { west: number; east: number; south: number; north: number };

export const VENEZUELA_BOUNDS: Bounds = { west: -73.6, east: -59.5, south: 0.4, north: 12.4 };

/** Projects lon/lat into an SVG box of the given width; returns the point and the box height. */
export function projector(b: Bounds, width: number) {
  const k = Math.cos((((b.north + b.south) / 2) * Math.PI) / 180); // squash longitude by latitude
  const sx = width / ((b.east - b.west) * k);
  const height = (b.north - b.south) * sx;
  const project = ([lon, lat]: [number, number]): [number, number] => [(lon - b.west) * k * sx, (b.north - lat) * sx];
  return { project, height };
}

export function outlinePath(project: (p: [number, number]) => [number, number]) {
  return VENEZUELA.map((p, i) => {
    const [x, y] = project(p);
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";
}
