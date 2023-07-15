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

// outcomes: {color: string, iconURI: string, name: string}[]
function predictionStarted({title, deadlineTimeMS, outcomes}) {
    startPredictionTimer(deadlineTimeMS);

    let rootElement = document.querySelector('#active-prediction');
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
    predictionStarted({
        title: 'Collect supers by 15:00?',
        deadlineTimeMS: Date.now() + 2 * 60 * 1000,
        outcomes: [
            {color: 'pink', iconURI: '', name: 'YES'},
            {color: 'blue', iconURI: '', name: 'no'},
        ],
    });
}

initUI();
test();
