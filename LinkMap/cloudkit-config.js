// Public browser configuration. Never put a server-to-server key here.
// These tokens use the CloudKit Console postMessage sign-in callback.
// CloudKit JS manages the popup response and session; no redirect page is needed.
const CLOUDKIT_ENVIRONMENT = "development";
const CLOUDKIT_API_TOKENS = Object.freeze({
  development: "e9b6952d3d1011a120e06a2a13388f845523d37d2605bb824045f650cb85b4e8",
  production: "3788bcd80b3e8b4b0c8057e0039ed311350c1e6b5d2b59b4e230e433ead98ddb"
});

if (!Object.hasOwn(CLOUDKIT_API_TOKENS, CLOUDKIT_ENVIRONMENT) ||
    !CLOUDKIT_API_TOKENS[CLOUDKIT_ENVIRONMENT]?.trim()) {
  throw new Error(`Missing CloudKit API token for environment: ${CLOUDKIT_ENVIRONMENT}`);
}

window.LINKMAP_CLOUDKIT = Object.freeze({
  containerIdentifier: "iCloud.name.Endsunset.LinkMap",
  environment: CLOUDKIT_ENVIRONMENT,
  apiToken: CLOUDKIT_API_TOKENS[CLOUDKIT_ENVIRONMENT]
});
