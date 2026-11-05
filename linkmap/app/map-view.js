// View-only geometry follows the native map: a Layer is the convex hull of its
// Locations' saved areas, falling back to their point when no area is saved.
const valid = point => point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) &&
  Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
const longitude360 = longitude => ((longitude % 360) + 360) % 360;
const mercatorY = latitude => Math.log(Math.tan(Math.PI / 4 + Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI / 360));

function projection(points) {
  const longitudes = [...new Set(points.map(point => longitude360(point.longitude)))].sort((a, b) => a - b);
  let start = longitudes[0] || 0;
  let largest = -1;
  for (let index = 0; index < longitudes.length; index++) {
    const next = longitudes[(index + 1) % longitudes.length] + (index === longitudes.length - 1 ? 360 : 0);
    if (next - longitudes[index] > largest) {
      largest = next - longitudes[index];
      start = next % 360;
    }
  }
  return point => {
    let x = longitude360(point.longitude);
    if (x < start) x += 360;
    return { x, y: mercatorY(point.latitude), point };
  };
}

export function convexHull(coordinates) {
  const points = coordinates.filter(valid);
  if (points.length < 2) return points;
  const project = projection(points);
  const sorted = points.map(project).sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((point, index, all) => !index || point.x !== all[index - 1].x || point.y !== all[index - 1].y);
  if (sorted.length < 3) return sorted.map(item => item.point);
  const cross = (origin, a, b) => (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
  const half = values => {
    const hull = [];
    for (const point of values) {
      while (hull.length >= 2 && cross(hull.at(-2), hull.at(-1), point) <= 0) hull.pop();
      hull.push(point);
    }
    hull.pop();
    return hull;
  };
  return [...half(sorted), ...half([...sorted].reverse())].map(item => item.point);
}

export function visibleLocations(records, context = {}) {
  if (context.groundOnly) {
    return records.locations.filter(location => {
      const layer = records.layers?.find(item => item.id === location.layerID);
      return !layer || layer.level === 0;
    });
  }
  const layer = records.layers?.find(item => item.id === context.layerID);
  return layer?.regionID
    ? records.locations.filter(location => location.regionID === layer.regionID)
    : records.locations;
}

export function layerBoundaries(records, context = {}) {
  const visibleLayerIDs = new Set(visibleLocations(records, context).map(location => location.layerID));
  return (records.layers || []).filter(layer => visibleLayerIDs.has(layer.id)).map(layer => ({
    layer,
    selected: layer.id === context.layerID,
    vertices: convexHull(records.locations.filter(location => location.layerID === layer.id)
      .flatMap(location => location.vertices?.length ? location.vertices : valid(location.coordinate) ? [location.coordinate] : [])),
  })).filter(boundary => boundary.vertices.length >= 2)
    // Draw the active Layer after the quiet outlines so its edge stays visible.
    .sort((a, b) => Number(a.selected) - Number(b.selected));
}

export function regionAtCoordinate(records, coordinate) {
  if (!valid(coordinate)) return null;
  for (const { layer, vertices } of layerBoundaries(records)) {
    if (!layer.regionID || vertices.length < 3) continue;
    const project = projection(vertices);
    const polygon = vertices.map(project);
    const point = project(coordinate);
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a.y > point.y) !== (b.y > point.y) &&
          point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    if (inside) return layer.regionID;
  }
  return null;
}
