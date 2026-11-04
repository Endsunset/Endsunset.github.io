import { queryRecords } from "./cloudkit.js";

export function referenceID(value) {
  return typeof value?.recordName === "string" ? value.recordName : null;
}

export function validCoordinate(value) {
  return value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) &&
    value.latitude >= -90 && value.latitude <= 90 && value.longitude >= -180 && value.longitude <= 180;
}

// CloudKit BYTES values contain the native JSONEncoder payload as base64.
export function decodeVertices(value) {
  if (value == null) return [];
  try {
    let json;
    if (typeof value === "string") {
      json = atob(value);
    } else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || Array.isArray(value)) {
      const bytes = value instanceof ArrayBuffer ? new Uint8Array(value)
        : ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : value;
      json = Array.from(bytes, byte => String.fromCharCode(byte)).join("");
    } else {
      return [];
    }
    const vertices = JSON.parse(json);
    // Do not join a damaged polygon across invalid or missing vertices.
    if (!Array.isArray(vertices) || !vertices.every(validCoordinate)) return [];
    return vertices.map(({ latitude, longitude }) => ({ latitude, longitude }));
  } catch {
    return [];
  }
}

export function locationFromRecord(record) {
  const fields = record.fields || {};
  const latitude = fields.latitude?.value;
  const longitude = fields.longitude?.value;
  const coordinate = { latitude, longitude };
  return {
    id: record.recordName,
    type: "Location",
    name: typeof fields.name?.value === "string" ? fields.name.value.trim() : "",
    detail: typeof fields.description?.value === "string" ? fields.description.value : "",
    coordinate: validCoordinate(coordinate) ? coordinate : null,
    vertices: decodeVertices(fields.vertices?.value),
    projectID: referenceID(fields.project?.value),
    regionID: referenceID(fields.region?.value),
    layerID: referenceID(fields.layer?.value),
    record,
  };
}

export async function loadLocations(project) {
  const records = await queryRecords(project.databaseScope, project.zoneID, "Location", [{
    fieldName: "project",
    comparator: "EQUALS",
    fieldValue: { type: "REFERENCE", value: { recordName: project.id } },
  }]);
  return records.map(locationFromRecord)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
