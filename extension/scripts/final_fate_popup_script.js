// TODO:
// * sync slider with <output> elements
// * put some things in a class

function updatePredictionSliderCSS(element) {
    element.style.setProperty('--value', `${element.value}%`)
}

function initUI() {
  stopPredictionTimer();

  document.body.addEventListener('input', (event) => {
    let target = event.target;
    if (target.classList.contains('prediction-slider')) {
      updatePredictionSliderCSS(target);
    }
  });
  for (let predictionSliderElement of document.querySelectorAll('.prediction-slider')) {
    updatePredictionSliderCSS(predictionSliderElement);
  }

  document.body.addEventListener('input', (_event) => {
    userSettingsUpdated();
  });
}

function userSettingsUpdated() {
  updateUIFromUserInput();
  sendUserSettingsToServiceWorker();
}

function updateUIFromUserInput() {
  let rootElement = document.querySelector('#prediction');
  let dualOutcomesElement = rootElement.querySelector('.dual-prediction');
  let predictionElement = dualOutcomesElement.querySelector('[name="prediction"]');

  let predictionRatios = [Number(predictionElement.value), 100 - predictionElement.value];
  dualOutcomesElement.querySelector('.outcome-a .estimate').textContent = `${predictionRatios[0].toFixed(0)}%`;
  dualOutcomesElement.querySelector('.outcome-b .estimate').textContent = `${predictionRatios[1].toFixed(0)}%`;
}

function sendUserSettingsToServiceWorker() {
  console.log('popup: sending updated user settings');
  let rootElement = document.querySelector('#prediction');
  let dualOutcomesElement = rootElement.querySelector('.dual-prediction');
  let predictionElement = dualOutcomesElement.querySelector('[name="prediction"]');

  let userSettings = {
    predictionRatios: [predictionElement.value, 100 - predictionElement.value],
    pointLimit: rootElement.querySelector('[name="point-limit"]').value,
    secondsBeforeDeadline: rootElement.querySelector('[name="seconds-before-deadline"]').value,
    enabled: rootElement.querySelector('[name="enable"]').checked,
  };
  chrome.runtime.sendMessage({
    method: 'popup/userStateChanged',
    userSettings: userSettings,
  });
}

// predictionSettings: {
//   status: 'active' | 'locked' | 'none',
//   // non-null if .status !== 'none':
//   outcomes: {color: string, iconURI: string, name: string}[] | null,
//   // non-null if .status !== 'none':
//   title: string | null,
//   // non-null if .status === 'active'
//   deadlineTimeMS: number | null,
// }
// userSettings: {
//   predictionRatios: number[],
//   pointLimit: number | null,
//   secondsBeforeDeadline: number | null,
//   enabled: boolean,
// }
// submission: null | {
//   points: number,
//   // TODO(strager): outcomeIndex
// }
function predictionStateUpdated({
    predictionSettings,
    userSettings,
    submission,
}) {
    console.assert(userSettings.predictionRatios.reduce((a, b) => a+b, 0) === 100, `prediction ratios should add up to 100: ${userSettings.predictionRatios}`);
    console.assert(userSettings.predictionRatios.length === predictionSettings.outcomes.length, 'number of outcomes must equal number of prediction ratios');

    startPredictionTimer(predictionSettings.deadlineTimeMS);

    let rootElement = document.querySelector('#prediction');
    rootElement.classList.toggle('status-active', predictionSettings.status === 'active');
    rootElement.classList.toggle('status-locked', predictionSettings.status === 'locked');
    rootElement.classList.toggle('status-none', predictionSettings.status === 'none');
    rootElement.classList.toggle('submitted', submission !== null);
    rootElement.classList.toggle('no-submitted', submission === null);

    rootElement.querySelector('.title').textContent = predictionSettings.title;
    if (predictionSettings.outcomes.length === 2) {
        let dualOutcomesElement = rootElement.querySelector('.dual-prediction');
        let outcomeAElement = dualOutcomesElement.querySelector('.outcome-a');
        let outcomeBElement = dualOutcomesElement.querySelector('.outcome-b');

        function initOutcomeUI(outcomeElement, outcome) {
            outcomeElement.querySelector('.name').textContent = outcome.name;
        }
        dualOutcomesElement.style.setProperty('--outcome-a-color', predictionSettings.outcomes[0].color);
        dualOutcomesElement.style.setProperty('--outcome-b-color', predictionSettings.outcomes[1].color);
        initOutcomeUI(outcomeAElement, predictionSettings.outcomes[0]);
        initOutcomeUI(outcomeBElement, predictionSettings.outcomes[1]);

        let predictionElement = dualOutcomesElement.querySelector('[name="prediction"]');
        setValueIfDifferent(predictionElement, userSettings.predictionRatios[0]);
        updatePredictionSliderCSS(predictionElement);
    }

    setValueIfDifferent(rootElement.querySelector('[name="seconds-before-deadline"]'), userSettings.secondsBeforeDeadline);
    setValueIfDifferent(rootElement.querySelector('[name="point-limit"]'), userSettings.pointLimit);
    rootElement.querySelector('[name="enable"]').checked = userSettings.enabled;

    rootElement.querySelector('.points-predicted').textContent = `${submission?.points}`;
    rootElement.querySelector('.point-limit').textContent = `${userSettings.pointLimit}`;

    updateUIFromUserInput();
}

// setValueIfDifferent prevents moving the user's text cursor unnecessarily.
function setValueIfDifferent(element, newValue) {
    if (String(element.value) !== String(newValue)) {
        element.value = newValue;
    }
}

let predictionTimerID = null;
let predictionTimerDeadlineTimeMS = null;
let predictionTimerElement = document.querySelector('.prediction-countdown');
function startPredictionTimer(deadlineTimeMS) {
    stopPredictionTimer();
    predictionTimerDeadlineTimeMS = deadlineTimeMS;
    predictionTimerID = setInterval(() => { updatePredictionTimer(); }, 200);
    updatePredictionTimer();
}
function stopPredictionTimer() {
    if (predictionTimerID !== null) {
        clearInterval(predictionTimerID);
        predictionTimerID = null;
        predictionTimerElement.textContent = '';
    }
}
function updatePredictionTimer() {
    let totalSecondsRemaining = Math.floor((predictionTimerDeadlineTimeMS - Date.now()) / 1000);
    if (totalSecondsRemaining < 0) totalSecondsRemaining = 0;
    let secondsRemaining = totalSecondsRemaining % 60;
    let minutesRemaining = Math.floor(totalSecondsRemaining / 60);
    predictionTimerElement.textContent = `${minutesRemaining.toString().padStart(2, '0')}:${secondsRemaining.toString().padStart(2, '0')}`;
}

function test() {
    let deadline = Date.now() + 2 * 60 * 1000;
    let state = {
        status: 'active',
        title: 'Collect supers by 15:00?',
        deadlineTimeMS: deadline,
        outcomes: [
            {color: 'pink', iconURI: '', name: 'YES'},
            {color: 'blue', iconURI: '', name: 'no'},
        ],
        predictedPoints: null,
        userPredictionRatios: [30, 70],
        userPointLimit: 6969,
        userEnabled: false,
        userSecondsBeforeDeadline: 3,
    };

    predictionStateUpdated({...state});

    setTimeout(() => {
        predictionStateUpdated({...state, status: 'locked', predictedPoints: 69});
    }, 2000);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.method) {
    case 'sw/predictionStateUpdated':
        console.log('popup: got updated prediction state:', msg.predictionState);
        predictionStateUpdated(msg.predictionState);
        break;
    }
});

async function requestDataFromServiceWorkerAsync() {
  let predictionState = await chrome.runtime.sendMessage({
    method: 'popup/getPredictionState',
  });
  console.log('popup: got initial prediction state:', predictionState);
  predictionStateUpdated(predictionState);
}

initUI();
requestDataFromServiceWorkerAsync();
//test();
