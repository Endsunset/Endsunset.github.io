(() => {
  "use strict";
  const messages = {
    "ACCESS_DENIED": "You don’t have permission to access the endpoint, record, zone, or database.",
    "ATOMIC_ERROR": "An atomic batch operation failed.",
    "AUTH_PERSIST_ERROR": "The authentication state could not be persisted.",
    "AUTHENTICATION_FAILED": "Authentication was rejected.",
    "AUTHENTICATION_REQUIRED": "The request requires authentication but none was provided.",
    "BAD_REQUEST": "The request was not valid.",
    "CONFIGURATION_ERROR": "CloudKit JS configuration error.",
    "CONFLICT": "The recordChangeTag value expired. (Retry the request with the latest tag.)",
    "EXISTS": "The resource that you attempted to create already exists.",
    "INTERNAL_ERROR": "An internal error occurred.",
    "INVALID_ARGUMENTS": "The parameters you provided for this method are invalid.",
    "NETWORK_ERROR": "A network error occurred.",
    "NOT_FOUND": "The resource was not found.",
    "QUOTA_EXCEEDED": "If accessing the public database, you exceeded the app’s quota. If accessing the private database, you exceeded the user’s iCloud quota.",
    "SERVICE_UNAVAILABLE": "The CloudKit service could not be reached.",
    "SHARE_UI_TIMEOUT": "The share UI failed to load and timed out.",
    "SIGN_IN_FAILED": "The user failed to sign in.",
    "THROTTLED": "The request was throttled. Try the request again later.",
    "TRY_AGAIN_LATER": "An internal error occurred. Try the request again.",
    "UNEXPECTED_SERVER_RESPONSE": "CloudKit JS was not able to decode the server response.",
    "UNIQUE_FIELD_ERROR": "The server rejected the request because there was a conflict with a unique field.",
    "UNKNOWN_ERROR": "An unknown error occurred.",
    "VALIDATING_REFERENCE_ERROR": "The request violates a validating reference constraint.",
    "ZONE_NOT_FOUND": "The zone specified in the request was not found."
  };
  let notice;
  window.reportCloudKitError = error => {
    // Keep the original CKError, including reason, retryAfter and server details.
    console.error("CloudKit JS error:", error);
    // CKError.ckErrorCode is the SDK code; serverErrorCode is a server fallback.
    // https://developer.apple.com/documentation/cloudkitjs/cloudkit.ckerror
    const code = [error?.ckErrorCode, error?.serverErrorCode].find(value => Object.hasOwn(messages, value)) || "UNKNOWN_ERROR";
    let message = messages[code];
    if (code === "AUTH_PERSIST_ERROR") {
      const detail = [error?.reason, error?.message].find(value => typeof value === "string" && value.trim() && value.length <= 240 && !/[<>\n\r]|https?:|[{}]/i.test(value));
      if (detail) message = detail.trim();
    }
    notice?.dismiss();
    notice = window.showErrorNotification({ title: "iCloud", code, message, onRetry() {
      notice.dismiss();
      if (window.CloudKit && window.LinkMapAuth) window.LinkMapAuth.retry();
      else window.location.reload();
    } });
    return notice;
  };
})();
