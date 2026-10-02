// Reuse the authenticated container; authentication remains in cloudkit-auth.js.
function database(scope) {
  const container = window.LinkMapAuth.container;
  return scope === "shared" ? container.sharedCloudDatabase : container.privateCloudDatabase;
}

async function checked(request) {
  let timer;
  try {
    const response = await Promise.race([request, new Promise((_, reject) => {
      timer = setTimeout(() => reject({ ckErrorCode: "NETWORK_ERROR", reason: "CloudKit request timed out" }), 20000);
    })]);
    if (response.hasErrors || response.errors?.length) throw response.errors?.[0] || response;
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchProjectZones(scope) {
  const response = await checked(database(scope).fetchAllRecordZones());
  return response.zones.map(zone => zone.zoneID).filter(zone =>
    scope === "shared" || zone.zoneName.startsWith("projectZone-")
  );
}

export async function queryRecords(scope, zoneID, recordType, filterBy = []) {
  const db = database(scope);
  let response = await checked(db.performQuery({ recordType, filterBy }, { zoneID }));
  const records = [...response.records];
  // Passing QueryResponse preserves the SDK's query, zone and continuation marker.
  while (response.moreComing) {
    response = await checked(db.performQuery(response));
    records.push(...response.records);
  }
  return records;
}
