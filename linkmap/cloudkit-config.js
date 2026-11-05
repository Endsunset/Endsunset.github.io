// Public browser configuration. Never put a server-to-server key here.
// These tokens use the CloudKit Console postMessage sign-in callback.
// CloudKit JS manages the popup response and session; no redirect page is needed.
const CLOUDKIT_ENVIRONMENT = "production";
const CLOUDKIT_API_TOKENS = Object.freeze({
  development: "e9b6952d3d1011a120e06a2a13388f845523d37d2605bb824045f650cb85b4e8",
  production: "28dc0e6311376aa0fdfcecd7a7e94703d8805ae532e0d0eea0398485dbb2b0b8"
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
