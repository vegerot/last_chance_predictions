document.body.addEventListener('input', (event) => {
    let target = event.target;
    if (target.classList.contains('prediction-slider')) {
        updatePredictionSliderCSS(target);
    }
});

function updatePredictionSliderCSS(element) {
    element.style.setProperty('--value', `${element.value}%`)
}

for (let predictionSliderElement of document.querySelectorAll('.prediction-slider')) {
    updatePredictionSliderCSS(predictionSliderElement);
}
