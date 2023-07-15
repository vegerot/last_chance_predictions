console.log("final_fate_service_worker.js loaded");
console.assert(typeof document === "undefined"); // cannot access host document in service worker
console.assert(typeof chrome.webRequest !== undefined); // can access most chrome APIs in service workers

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg.yourMom);
  console.assert(msg.yourMom === "heyFromTwitch.tv");
  sendResponse({ msgFromSW: "hi from SW" });
});

// MUST CLICK ON EXTENSION ICON TO ACTIVATE LISTENER
chrome.webRequest.onBeforeSendHeaders.addListener(
  (...args) => {
    const client_id = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "client-id"
    );
    const session_id = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "client-session-id"
    );
    const client_integrity = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "client-integrity"
    );
    client_state.client_id ??= client_id;
    client_state.session_id ??= session_id;
    client_state.client_integrity ??= client_integrity;
  },
  { urls: ["https://*.twitch.tv/*"] },
  ["requestHeaders"],
);

const client_state = {
  client_id: null,
  session_id: null,
  client_integrity: null,
};

setTimeout(() => console.log(client_state), 5000);
