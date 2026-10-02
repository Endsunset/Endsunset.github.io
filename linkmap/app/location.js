import { queryRecords } from "./cloudkit.js";

export function locationFromRecord(record) {
  const fields = record.fields || {};
  const latitude = fields.latitude?.value;
  const longitude = fields.longitude?.value;
  const valid = Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  return {
    id: record.recordName,
    name: typeof fields.name?.value === "string" ? fields.name.value.trim() : "",
    detail: typeof fields.detail?.value === "string" ? fields.detail.value : "",
    coordinate: valid ? { latitude, longitude } : null,
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
