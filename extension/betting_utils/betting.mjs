// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function calculateBet(userOdds, chatOdds) {
    let optimalBet = calculateOptimalBet(userOdds, chatOdds);
    if (optimalBet === null) return null;
    return {
        side: optimalBet.side,
        points: Math.min(optimalBet.points, userOdds.maxBet)
    };
}
function calculateOptimalBet(userOdds, chatOdds) {
    function hmtbRounded(chance, pointsOnMySide, pointsOnTheirSide) {
        let preciseBet = hmtb(chance, pointsOnMySide, pointsOnTheirSide);
        let low = Math.floor(preciseBet);
        let high = Math.ceil(preciseBet);
        let lowExpected = expectedValue2(low, chance, pointsOnMySide, pointsOnTheirSide);
        let highExpected = expectedValue2(high, chance, pointsOnMySide, pointsOnTheirSide);
        if (lowExpected > highExpected) {
            return low;
        } else return high;
    }
    function hmtb(chance, pointsOnMySide, pointsOnTheirSide) {
        return (pointsOnMySide - chance * pointsOnMySide - Math.sqrt((1 - chance) * chance * pointsOnMySide * pointsOnTheirSide)) / (-1 + chance);
    }
    function expectedValue2(yourBet, chance, pointsOnMySide, pointsOnTheirSide) {
        return yourBet * (chance * pointsOnTheirSide / (yourBet + pointsOnMySide) - (1 - chance));
    }
    if (chatOdds.pointsPerSide[0] === 0 !== (chatOdds.pointsPerSide[1] === 0)) {
        let side = chatOdds.pointsPerSide[0] === 0 ? 0 : 1;
        return {
            side,
            points: 1
        };
    }
    let odds = normalizeOdds(userOdds.odds);
    let optimalBetA = hmtbRounded(odds[0], chatOdds.pointsPerSide[0], chatOdds.pointsPerSide[1]);
    let optimalBetB = hmtbRounded(odds[1], chatOdds.pointsPerSide[1], chatOdds.pointsPerSide[0]);
    if (optimalBetA > 0) {
        return {
            side: 0,
            points: optimalBetA
        };
    }
    if (optimalBetB > 0) {
        return {
            side: 1,
            points: optimalBetB
        };
    }
    return null;
}
function expectedValues({ odds , pointsPerSide  }) {
    return [
        expectedValue({
            odds,
            pointsPerSide,
            side: 0
        }),
        expectedValue({
            odds,
            pointsPerSide,
            side: 1
        })
    ];
}
function expectedValue({ odds , pointsPerSide , side  }) {
    const normalizedOdds = normalizeOdds(odds);
    let pointsOnOtherSide = pointsPerSide[1 - side];
    return pointsOnOtherSide * normalizedOdds[side] - pointsPerSide[side] * (1 - normalizedOdds[side]);
}
function normalizeOdds(odds) {
    const sumOfOdds = odds[0] + odds[1];
    return odds.map((odd)=>odd / sumOfOdds);
}
export { calculateBet as calculateBet };
export { calculateOptimalBet as calculateOptimalBet };
export { expectedValues as expectedValues };

