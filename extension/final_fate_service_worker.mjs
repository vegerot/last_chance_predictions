console.log("final_fate_service_worker.js loaded");
console.assert(typeof document === "undefined"); // cannot access host document in service worker
console.assert(typeof chrome.webRequest !== undefined); // can access most chrome APIs in service workers

let deadline = Date.now() + 2 * 60 * 1000;
let currentPredictionState = {
    predictionSettings: {
        status: 'active',
        title: 'Collect supers by 15:00?',
        deadlineTimeMS: deadline,
        outcomes: [
            {color: 'pink', iconURI: '', name: 'YES'},
            {color: 'blue', iconURI: '', name: 'no'},
        ],
    },
    userSettings: {
        predictionRatios: [30, 70],
        pointLimit: 6969,
        enabled: false,
        secondsBeforeDeadline: 3,
    },
    submission: {
        points: 42,
    },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.method) {
    case 'popup/getPredictionState': {
        console.log('service worker: got popup/getPredictionState request');
        sendResponse(currentPredictionState);
        break;
    }
    case 'popup/userStateChanged': {
        console.log('service worker: got popup/userStateChanged notification');
        currentPredictionState.userSettings = msg.userSettings;
        //predictionStateUpdated();  // Don't bother. UI already knows.
        break;
    }
    default:
        console.log(msg.yourMom);
        console.assert(msg.yourMom === "heyFromTwitch.tv");
        sendResponse({ msgFromSW: "hi from SW" });
        break;
    }
});

// Send predictionState to the popup (UI).
function predictionStateUpdated() {
    chrome.runtime.sendMessage({
        method: 'sw/predictionStateUpdated',
        predictionState: currentPredictionState,
    }).catch((e) => {
        if (e instanceof Error) {
            if (e.message === "Could not establish connection. Receiving end does not exist.") {
                // The pop-up isn't open. Ignore this error.
                return;
            }
        }
        throw e; // Make the error easier to find in dev tools.
    });
}

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
    if (typeof client_id === "string") client_state.client_id = client_id;
    if (typeof session_id === "string") client_state.session_id = session_id;
    if (typeof client_integrity === "string") {
      client_state.client_integrity = client_integrity;
    }
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

function testDifferentPredictionSettingsStates() {
  setTimeout(() => {
    currentPredictionState.predictionSettings.status = 'locked';
    predictionStateUpdated();
  }, 5000);
  setTimeout(() => {
    currentPredictionState.predictionSettings.status = 'none';
    predictionStateUpdated();
  }, 10000);
}
//testDifferentPredictionSettingsStates();
