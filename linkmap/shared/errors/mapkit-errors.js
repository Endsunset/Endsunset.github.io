(() => {
  "use strict";
  const messages = {
    "BadRequest": "The service returned a bad request response when initializing.",
    "MalformedResponse": "The service returned a malformed response when initializing.",
    "NetworkError": "MapKit JS encountered a network error during initialization.",
    "Timeout": "The service timed out when initializing.",
    "TooManyRequests": "The Maps ID for the authorization token provided exceeded its allowed daily usage.",
    "Unauthorized": "The provided authorization token is invalid.",
    "Unknown": "MapKit JS encountered an unknown error during initialization."
  };
  // ConfigurationErrorStatus values contain spaces (e.g. "Bad Request").
  // https://developer.apple.com/documentation/mapkitjs/configurationerrorstatus
  const normalize = value => typeof value === "string" ? value.replace(/[\s_-]/g, "").toLowerCase() : "";
  let notice;
  window.reportMapKitError = error => {
    console.error("MapKit JS error:", error);
    const status = typeof error === "string" ? error : error?.status ?? error?.error?.status ?? error?.code;
    const code = Object.keys(messages).find(key => normalize(key) === normalize(status)) || "Unknown";
    notice?.dismiss();
    notice = window.showErrorNotification({ title: "Apple Maps", code, message: messages[code] });
    return notice;
  };
})();
