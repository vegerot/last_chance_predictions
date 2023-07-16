const browser = chrome;
import { getActiveChannelPredictionAndChannelID } from "./get-active-predictions.mjs";
console.log("final_fate_service_worker.js loaded");
console.assert(typeof document === "undefined"); // cannot access host document in service worker
console.assert(typeof browser.webRequest !== undefined); // can access most chrome APIs in service workers

let deadline = Date.now() + 2 * 60 * 1000;
let currentAppState = {
  userSettings: {
    selectedChannelID: "1234",
  },
  channels: {},
};

/**
 * @type {TabChannels}
 */
let tabChannels = {};

function getDefaultUserSettings() {
  return {
    predictionRatios: [50, 50],
    pointLimit: 300,
    enabled: false,
    secondsBeforeDeadline: 3,
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.method) {
    case "popup/getAppState": {
      console.log("service worker: got popup/getAppState request");
      sendResponse(currentAppState);
      break;
    }
    case "popup/userStateChanged": {
      console.log("service worker: got popup/userStateChanged notification");
      if (
        !Object.hasOwnProperty.call(currentAppState.channels, msg.channelID)
      ) {
        console.error(`service worker: unknown channel ID ${msg.channelID}`);
        return;
      }
      let channelState = currentAppState.channels[msg.channelID];
      channelState.userSettings = msg.userSettings;
      //appStateUpdated();  // Don't bother. UI already knows.
      break;
    }
    case "content/onNavigation": {
      console.log("service worker: got content/onNavigation request");
      let tabId = sender.tab.id;
      console.assert(typeof tabId === "number");
      let channelLoginName = msg.channelLoginName;
      console.log({ channelLoginName });
      console.assert(typeof channelLoginName === "string");
      tabChannels[tabId] = channelLoginName;
      console.log(tabChannels);
      sendResponse({ ok: true });
      break;
    }
    default:
      console.log(msg.yourMom);
      console.assert(msg.yourMom === "heyFromTwitch.tv");
      sendResponse({ msgFromSW: "hi from SW" });
      break;
  }
});

// Send appState to the popup (UI).
function appStateUpdated() {
  browser.runtime.sendMessage({
    method: "sw/appStateUpdated",
    appState: currentAppState,
  }).catch((e) => {
    if (e instanceof Error) {
      if (
        e.message ===
          "Could not establish connection. Receiving end does not exist."
      ) {
        // The pop-up isn't open. Ignore this error.
        return;
      }
    }
    throw e; // Make the error easier to find in dev tools.
  });
}

// MUST CLICK ON EXTENSION ICON TO ACTIVATE LISTENER
browser.webRequest.onBeforeSendHeaders.addListener(
  (...args) => {
    const authorization_header = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "authorization"
    )?.value;
    const client_id = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "client-id"
    )?.value;
    const client_integrity = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "client-integrity"
    )?.value;
    const device_id = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "x-device-id"
    )?.value;
    const session_id = args[0].requestHeaders.find((h) =>
      h.name.toLowerCase() === "client-session-id"
    )?.value;
    if (typeof authorization_header === "string") {
      client_state.authorization_header = authorization_header;
    }
    if (typeof client_id === "string") client_state.client_id = client_id;
    if (typeof client_integrity === "string") {
      client_state.client_integrity = client_integrity;
    }
    if (typeof device_id === "string") client_state.device_id = device_id;
    if (typeof session_id === "string") client_state.session_id = session_id;
  },
  { urls: ["https://*.twitch.tv/*"] },
  ["requestHeaders"],
);

const client_state = {
  authorization_header: null,
  client_id: null,
  client_integrity: null,
  device_id: null,
  session_id: null,
};
setTimeout(() => console.log(client_state), 5000);
setInterval(
  async () => {
    await Promise.all(
      getWatchedChannelLoginNames().map(async (channelLoginName) => {
        let credentials = getCredentialsForChannelLoginName(channelLoginName);
        if (credentials === null) {
          console.warn(
            `service worker: cannot load predictions for channel ${channelLoginName} because credentials are not yet available`,
          );
          return null;
        }
        let { channelID, prediction } =
          await getActiveChannelPredictionAndChannelID(
            credentials,
            channelLoginName,
          );
        if (!Object.hasOwnProperty.call(currentAppState.channels, channelID)) {
          currentAppState.channels[channelID] = {
            channelID: channelID,
            channelLoginName: channelLoginName,
            channelDisplayName: channelLoginName, // TODO
            predictionSettings: {
              status: "none",
              title: null,
              deadlineTimeMS: null,
              outcomes: null,
            },
            userSettings: getDefaultUserSettings(),
            submission: null,
          };
        }
        currentAppState.channels[channelID].predictionSettings = prediction;
      }),
    );
    // TODO(strager): Delete old entries from currentAppState.channels.
  },
  1000,
);

function getWatchedChannelLoginNames() {
  return ["strager_sr"];
}

// Returns null if no credentials are available yet.
function getCredentialsForChannelLoginName(channelLoginName) {
  // TODO(strager): Find a tab with the channel open and use its credentials.
  if (
    client_state.authorization_header !== null &&
    client_state.client_id !== null &&
    client_state.client_integrity !== null &&
    client_state.device_id !== null &&
    client_state.session_id !== null
  ) {
    return client_state;
  }
  return null;
}

function testDifferentPredictionSettingsStates() {
  testDummyPredictions();
  setTimeout(() => {
    currentAppState.channels["1234"].predictionSettings.status = "locked";
    appStateUpdated();
  }, 5000);
  setTimeout(() => {
    currentAppState.channels["1234"].predictionSettings.status = "none";
    appStateUpdated();
  }, 10000);
}
function testDummyPredictions() {
  currentAppState.channels["1234"] = {
    channelID: "1234",
    channelLoginName: "strager_sr",
    channelDisplayName: "strager_SR",
    predictionSettings: {
      status: "active",
      title: "Collect supers by 15:00?",
      deadlineTimeMS: deadline,
      outcomes: [
        { color: "pink", iconURI: "", name: "YES" },
        { color: "blue", iconURI: "", name: "no" },
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

  currentAppState.channels["5678"] = {
    channelID: "5678",
    channelLoginName: "emceemc2",
    channelDisplayName: "emceeMC2",
    predictionSettings: {
      status: "none",
      title: null,
      deadlineTimeMS: null,
      outcomes: null,
    },
    userSettings: getDefaultUserSettings(),
    submission: null,
  };

  currentAppState.channels["666"] = {
    channelID: "666",
    channelLoginName: "oatsngoats",
    channelDisplayName: "Oatsngoats",
    predictionSettings: {
      status: "none",
      title: null,
      deadlineTimeMS: null,
      outcomes: null,
    },
    userSettings: getDefaultUserSettings(),
    submission: null,
  };
}
//testDifferentPredictionSettingsStates();
//testDummyPredictions();
