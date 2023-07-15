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
}

// status: 'active' | 'locked' | 'none'
// outcomes: {color: string, iconURI: string, name: string}[]
// predictedPoints: number | null
// userPredictionRatios: number[]
// userPointLimit: number | null
// userSecondsBeforeDeadline: number | null
// TODO(strager): predictedOutcomeIndex
function predictionStateUpdated({
    status,
    title,
    deadlineTimeMS,
    outcomes,
    predictedPoints,
    userPredictionRatios,
    userPointLimit,
    userEnabled,
    userSecondsBeforeDeadline,
}) {
    console.assert(userPredictionRatios.reduce((a, b) => a+b, 0) === 100, `prediction ratios should add up to 100: ${userPredictionRatios}`);
    console.assert(userPredictionRatios.length === outcomes.length, 'number of outcomes must equal number of prediction ratios');

    startPredictionTimer(deadlineTimeMS);

    let rootElement = document.querySelector('#prediction');
    rootElement.classList.toggle('status-active', status === 'active');
    rootElement.classList.toggle('status-locked', status === 'locked');
    rootElement.classList.toggle('status-none', status === 'none');
    rootElement.classList.toggle('predicted-points', predictedPoints !== null);
    rootElement.classList.toggle('no-predicted-points', predictedPoints === null);

    rootElement.querySelector('.title').textContent = title;
    if (outcomes.length === 2) {
        let dualOutcomesElement = rootElement.querySelector('.dual-prediction');
        let outcomeAElement = dualOutcomesElement.querySelector('.outcome-a');
        let outcomeBElement = dualOutcomesElement.querySelector('.outcome-b');

        function initOutcomeUI(outcomeElement, outcome) {
            outcomeElement.querySelector('.name').textContent = outcome.name;
        }
        dualOutcomesElement.style.setProperty('--outcome-a-color', outcomes[0].color);
        dualOutcomesElement.style.setProperty('--outcome-b-color', outcomes[1].color);
        initOutcomeUI(outcomeAElement, outcomes[0]);
        initOutcomeUI(outcomeBElement, outcomes[1]);

        let predictionElement = dualOutcomesElement.querySelector('[name="prediction"]');
        setValueIfDifferent(predictionElement, userPredictionRatios[0]);
        updatePredictionSliderCSS(predictionElement);
    }

    setValueIfDifferent(rootElement.querySelector('[name="seconds-before-deadline"]'), userSecondsBeforeDeadline);
    setValueIfDifferent(rootElement.querySelector('[name="point-limit"]'), userPointLimit);
    rootElement.querySelector('[name="enable"]').value = userEnabled;

    rootElement.querySelector('.points-predicted').textContent = `${predictedPoints}`;
    rootElement.querySelector('.point-limit').textContent = `${userPointLimit}`;
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
    let msRemaining = predictionTimerDeadlineTimeMS - Date.now();
    predictionTimerElement.textContent = `${msRemaining/1000} s`;
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

initUI();
test();
