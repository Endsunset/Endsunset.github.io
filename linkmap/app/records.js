import { queryRecords } from "./cloudkit.js";
import { loadLocations, referenceID } from "./location.js";

function namedRecord(record, type) {
  const fields = record.fields || {};
  return {
    id: record.recordName,
    type,
    name: typeof fields.name?.value === "string" ? fields.name.value.trim() : "",
    detail: "",
    coordinate: null,
    vertices: [],
    projectID: referenceID(fields.project?.value),
    regionID: referenceID(fields.region?.value),
    layerID: null,
    record,
  };
}

export function regionFromRecord(record) {
  return namedRecord(record, "Region");
}

export function layerFromRecord(record) {
  const value = record.fields?.level?.value;
  return { ...namedRecord(record, "Layer"), level: Number.isSafeInteger(value) ? value : 0 };
}

export function itemFromRecord(record) {
  return namedRecord(record, "Item");
}

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });

async function projectRecords(project, type, convert) {
  const records = await queryRecords(project.databaseScope, project.zoneID, type, [{
    fieldName: "project",
    comparator: "EQUALS",
    fieldValue: { type: "REFERENCE", value: { recordName: project.id } },
  }]);
  return records.map(convert).sort(byName);
}

// Read every foundation collection in the selected Project's original database and zone.
export async function loadProjectRecords(project) {
  const [locations, regions, layers, items] = await Promise.all([
    loadLocations(project),
    projectRecords(project, "Region", regionFromRecord),
    projectRecords(project, "Layer", layerFromRecord),
    projectRecords(project, "Item", itemFromRecord),
  ]);
  layers.sort((a, b) => a.level - b.level || byName(a, b));
  return { locations, regions, layers, items };
}
