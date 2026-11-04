import { fetchProjectZones, queryRecords } from "./cloudkit.js";

export function projectFromRecord(record, databaseScope, zoneID) {
  return {
    id: record.recordName,
    type: "Project",
    name: typeof record.fields?.name?.value === "string" ? record.fields.name.value.trim() : "",
    databaseScope,
    zoneID,
    record,
  };
}

export async function loadProjects() {
  const projects = new Map();
  // Match CKUtility: private project zones first, then all accepted shared zones.
  for (const scope of ["private", "shared"]) {
    for (const zoneID of await fetchProjectZones(scope)) {
      const records = await queryRecords(scope, zoneID, "Project");
      for (const record of records) {
        const project = projectFromRecord(record, scope, zoneID);
        // Native ProjectModel uses the UUID record name as logical identity.
        projects.set(project.id, project);
      }
    }
  }
  const createdAt = project => {
    const timestamp = project.record.created?.timestamp;
    if (Number.isFinite(timestamp)) return timestamp;
    return typeof timestamp === "string" && Number.isFinite(Date.parse(timestamp)) ? Date.parse(timestamp) : -Infinity;
  };
  return [...projects.values()].sort((a, b) => {
    const leftDate = createdAt(a);
    const rightDate = createdAt(b);
    return (leftDate === rightDate ? 0 : leftDate < rightDate ? 1 : -1) ||
      a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}
