const browser = chrome;
// TODO:
// * put some things in a class

function updatePredictionSliderCSS(element) {
  element.style.setProperty("--value", `${element.value}%`);
}

let currentAppState = {
  userSettings: {
    selectedChannelID: null,
  },
  channels: {},
};
let uiDisplayedChannelID = null;
window.__FinalFateAppState = currentAppState; // For debugging.

function initUI() {
  stopPredictionTimer();

  document.body.addEventListener("input", (event) => {
    let target = event.target;
    if (target.classList.contains("prediction-slider")) {
      updatePredictionSliderCSS(target);
    }
  });
  for (
    let predictionSliderElement of document.querySelectorAll(
      ".prediction-slider",
    )
  ) {
    updatePredictionSliderCSS(predictionSliderElement);
  }

  document.body.addEventListener("input", (_event) => {
    userSettingsUpdated();
  });
}

function userSettingsUpdated() {
  currentAppState.userSettings.selectedChannelID =
    document.querySelector('#prediction [name="current-channel"]').value;
  if (currentAppState.userSettings.selectedChannelID !== null) {
    let rootElement = document.querySelector("#prediction");
    let dualOutcomesElement = rootElement.querySelector(".dual-prediction");
    let predictionElement = dualOutcomesElement.querySelector(
      '[name="prediction"]',
    );

    let selectedChannel =
      currentAppState.channels[currentAppState.userSettings.selectedChannelID];
    selectedChannel.userSettings = {
      predictionRatios: [
        Number(predictionElement.value),
        100 - predictionElement.value,
      ],
      pointLimit: rootElement.querySelector('[name="point-limit"]').value,
      secondsBeforeDeadline:
        rootElement.querySelector('[name="seconds-before-deadline"]').value,
      enabled: rootElement.querySelector('[name="enable"]').checked,
    };
  }

  updateUIFromUserInput();
  if (uiDisplayedChannelID !== currentAppState.userSettings.selectedChannelID) {
    currentChannelStateUpdated();
  }
  sendUserSettingsToServiceWorker();
}

function updateUIFromUserInput() {
  let rootElement = document.querySelector("#prediction");
  let dualOutcomesElement = rootElement.querySelector(".dual-prediction");
  let predictionElement = dualOutcomesElement.querySelector(
    '[name="prediction"]',
  );

  let predictionRatios = [
    Number(predictionElement.value),
    100 - predictionElement.value,
  ];
  dualOutcomesElement.querySelector(".outcome-a .estimate").textContent = `${
    predictionRatios[0].toFixed(0)
  }%`;
  dualOutcomesElement.querySelector(".outcome-b .estimate").textContent = `${
    predictionRatios[1].toFixed(0)
  }%`;
}

function sendUserSettingsToServiceWorker() {
  if (currentAppState.userSettings.selectedChannelID !== null) {
    console.log("popup: sending updated user settings");
    let selectedChannel =
      currentAppState.channels[currentAppState.userSettings.selectedChannelID];
    chrome.runtime.sendMessage({
      method: "popup/userStateChanged",
      channelID: currentAppState.userSettings.selectedChannelID,
      userSettings: selectedChannel?.userSettings,
    });
  }
}

function appStateUpdated() {
  channelListUpdated();
  console.log(
    `popup: selected channel ID ${currentAppState.userSettings.selectedChannelID}`,
  );
  currentChannelStateUpdated();
}

function channelListUpdated() {
  let channels = currentAppState.channels;
  let channelIDs = Object.getOwnPropertyNames(channels);

  let channelsElement = document.querySelector(
    '#prediction [name="current-channel"]',
  );
  let channelIDsInUI = [];
  let optionElementsToRemove = [];
  for (let optionElement of channelsElement.querySelectorAll("option")) {
    if (!channelIDs.includes(optionElement.value)) {
      optionElementsToRemove.push(optionElement);
    } else {
      channelIDsInUI.push(optionElement.value);
    }
  }
  for (let optionElement of optionElementsToRemove) {
    optionElement.remove();
  }

  for (let channelID of channelIDs) {
    if (!channelIDsInUI.includes(channelID)) {
      let channel = channels[channelID];
      let optionElement = document.createElement("option");
      optionElement.value = channel.channelID;
      optionElement.textContent = channel.channelDisplayName;
      channelsElement.appendChild(optionElement);
    }
  }

  if (!channelIDs.includes(currentAppState.userSettings.selectedChannelID)) {
    if (channelIDs.length === 0) {
      currentAppState.userSettings.selectedChannelID = null;
    } else {
      currentAppState.userSettings.selectedChannelID = channelIDs[0];
    }
    console.log(
      `channelListUpdated: forcefully changed selected channel ID to ${currentAppState.userSettings.selectedChannelID}`,
    );
  }
  setValueIfDifferent(
    channelsElement,
    currentAppState.userSettings.selectedChannelID,
  );
}

function currentChannelStateUpdated() {
  uiDisplayedChannelID = currentAppState.userSettings.selectedChannelID;
  if (currentAppState.userSettings.selectedChannelID === null) {
    // TODO
    return;
  }
  let selectedChannel =
    currentAppState.channels[currentAppState.userSettings.selectedChannelID];
  let { predictionSettings, userSettings, submission } = selectedChannel;

  console.assert(
    userSettings.predictionRatios.reduce((a, b) => a + b, 0) === 100,
    `prediction ratios should add up to 100: ${userSettings.predictionRatios}`,
  );
  if (predictionSettings.outcomes !== null) {
    console.assert(
      userSettings.predictionRatios.length ===
        predictionSettings.outcomes.length,
      "number of outcomes must equal number of prediction ratios",
    );
  }

  startPredictionTimer(predictionSettings.deadlineTimeMS);

  let rootElement = document.querySelector("#prediction");
  rootElement.classList.toggle(
    "status-active",
    predictionSettings.status === "active",
  );
  rootElement.classList.toggle(
    "status-locked",
    predictionSettings.status === "locked",
  );
  rootElement.classList.toggle(
    "status-none",
    predictionSettings.status === "none",
  );
  rootElement.classList.toggle("submitted", submission !== null);
  rootElement.classList.toggle("no-submitted", submission === null);

  rootElement.querySelector(".title").textContent = predictionSettings.title;
  let isDualOutcome = predictionSettings.outcomes?.length === 2;
  rootElement.classList.toggle("is-dual-outcome", isDualOutcome);

  if (isDualOutcome) {
    let dualOutcomesElement = rootElement.querySelector(".dual-prediction");
    let outcomeAElement = dualOutcomesElement.querySelector(".outcome-a");
    let outcomeBElement = dualOutcomesElement.querySelector(".outcome-b");

    function initOutcomeUI(outcomeElement, outcome) {
      outcomeElement.querySelector(".name").textContent = outcome.name;
    }
    dualOutcomesElement.style.setProperty(
      "--outcome-a-color",
      getOutcomeCSSColor(predictionSettings.outcomes[0].color),
    );
    dualOutcomesElement.style.setProperty(
      "--outcome-b-color",
      getOutcomeCSSColor(predictionSettings.outcomes[1].color),
    );
    initOutcomeUI(outcomeAElement, predictionSettings.outcomes[0]);
    initOutcomeUI(outcomeBElement, predictionSettings.outcomes[1]);

    let predictionElement = dualOutcomesElement.querySelector(
      '[name="prediction"]',
    );
    setValueIfDifferent(predictionElement, userSettings.predictionRatios[0]);
    updatePredictionSliderCSS(predictionElement);
  }

  setValueIfDifferent(
    rootElement.querySelector('[name="seconds-before-deadline"]'),
    userSettings.secondsBeforeDeadline,
  );
  setValueIfDifferent(
    rootElement.querySelector('[name="point-limit"]'),
    userSettings.pointLimit,
  );
  rootElement.querySelector('[name="enable"]').checked = userSettings.enabled;

  rootElement.querySelector(".points-predicted").textContent =
    `${submission?.points}`;
  rootElement.querySelector(".point-limit").textContent =
    `${userSettings.pointLimit}`;

  updateUIFromUserInput();
}

function getOutcomeCSSColor(color) {
  if (color === 'PINK') {
    return 'rgb(245, 0, 155)';
  }
  if (color === 'BLUE') {
    return 'rgb(56, 122, 255)';
  }
  return color;
}

// setValueIfDifferent prevents moving the user's text cursor unnecessarily.
function setValueIfDifferent(element, newValue) {
  if (String(element.value) !== String(newValue)) {
    element.value = newValue;
  }
}

let predictionTimerID = null;
let predictionTimerDeadlineTimeMS = null;
let predictionTimerElement = document.querySelector(".prediction-countdown");
function startPredictionTimer(deadlineTimeMS) {
  stopPredictionTimer();
  predictionTimerDeadlineTimeMS = deadlineTimeMS;
  predictionTimerID = setInterval(() => {
    updatePredictionTimer();
  }, 200);
  updatePredictionTimer();
}
function stopPredictionTimer() {
  if (predictionTimerID !== null) {
    clearInterval(predictionTimerID);
    predictionTimerID = null;
    predictionTimerElement.textContent = "";
  }
}
function updatePredictionTimer() {
  let totalSecondsRemaining = Math.floor(
    (predictionTimerDeadlineTimeMS - Date.now()) / 1000,
  );
  if (totalSecondsRemaining < 0) totalSecondsRemaining = 0;
  let secondsRemaining = totalSecondsRemaining % 60;
  let minutesRemaining = Math.floor(totalSecondsRemaining / 60);
  predictionTimerElement.textContent = `${
    minutesRemaining.toString().padStart(2, "0")
  }:${secondsRemaining.toString().padStart(2, "0")}`;
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.method) {
    case "sw/appStateUpdated":
      console.log("popup: got updated app state:", msg.appState);
      currentAppState = msg.appState;
      appStateUpdated();
      break;
  }
});

async function requestDataFromServiceWorkerAsync() {
  let appState = await browser.runtime.sendMessage({
    method: "popup/getAppState",
  });
  console.log("popup: got initial app state:", appState);
  currentAppState = appState;
  appStateUpdated();
}

initUI();
requestDataFromServiceWorkerAsync();
