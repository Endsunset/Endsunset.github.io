import { fetchProjectZones, queryRecords } from "./cloudkit.js";

export function projectFromRecord(record, databaseScope, zoneID) {
  return {
    id: record.recordName,
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
  return [...projects.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
