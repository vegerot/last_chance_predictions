export function calculateBet(
  userOdds: { odds: [number, number]; maxBet: number },
  chatOdds: { pointsPerSide: [number, number] },
): { side: number; points: number } | null {
  let optimalBet = calculateOptimalBet(userOdds, chatOdds);
  if (optimalBet === null) return null;
  return {
    side: optimalBet.side,
    points: Math.min(optimalBet.points, userOdds.maxBet),
  };
}

export function calculateOptimalBet(
  userOdds: { odds: [number, number] },
  chatOdds: { pointsPerSide: [number, number] },
): { side: number; points: number } | null {
  // Ex[Py_, Ca_, Pa_, Pb_]:=Py*(Ca*Pb/(Py+Pa)-(1-Ca))
  // Maximize[{Ex[Py, Ca, Pa, Pb],Ca>0 &&Pa>0&&Pb>0&&Ca<1 &&Py>0 }, Py]
  function hmtbRounded(
    chance: number,
    pointsOnMySide: number,
    pointsOnTheirSide: number,
  ): number {
    let preciseBet = hmtb(chance, pointsOnMySide, pointsOnTheirSide);
    let low = Math.floor(preciseBet);
    let high = Math.ceil(preciseBet);
    let lowExpected = expectedValue2(
      low,
      chance,
      pointsOnMySide,
      pointsOnTheirSide,
    );
    let highExpected = expectedValue2(
      high,
      chance,
      pointsOnMySide,
      pointsOnTheirSide,
    );
    if (lowExpected > highExpected) {
      return low;
    } else return high;
  }
  function hmtb(
    chance: number,
    pointsOnMySide: number,
    pointsOnTheirSide: number,
  ): number {
    return (pointsOnMySide - chance * pointsOnMySide -
      Math.sqrt((1 - chance) * chance * pointsOnMySide * pointsOnTheirSide)) /
      (-1 + chance);
  }
  function expectedValue2(
    yourBet: number,
    chance: number,
    pointsOnMySide: number,
    pointsOnTheirSide: number,
  ): number {
    return yourBet *
      (chance * pointsOnTheirSide / (yourBet + pointsOnMySide) - (1 - chance));
  }
  let odds = normalizeOdds(userOdds.odds);
  let optimalBetA = hmtbRounded(
    odds[0],
    chatOdds.pointsPerSide[0],
    chatOdds.pointsPerSide[1],
  );
  let optimalBetB = hmtbRounded(
    odds[1],
    chatOdds.pointsPerSide[1],
    chatOdds.pointsPerSide[0],
  );
  if (optimalBetA > 0) {
    return {
      side: 0,
      points: optimalBetA,
    };
  }
  if (optimalBetB > 0) {
    return {
      side: 1,
      points: optimalBetB,
    };
  }
  return null;
}

// TODO: test against calculateOptimalBet
function calculateOptimalBetSlow(
  userOdds: { odds: [number, number]; maxBet: number },
  chatOdds: { pointsPerSide: [number, number] },
): { side: number; points: number } | null {
  let bestSide;
  let bestBet = -Infinity;
  let bestEV = -Infinity;
  for (let bet = 0; bet <= userOdds.maxBet; ++bet) {
    let evIfSideA = expectedValue({
      odds: userOdds.odds,
      pointsPerSide: [
        chatOdds.pointsPerSide[0] + bet,
        chatOdds.pointsPerSide[1],
      ],
      side: 0,
    });
    let evIfSideB = expectedValue({
      odds: userOdds.odds,
      pointsPerSide: [
        chatOdds.pointsPerSide[0],
        bet + chatOdds.pointsPerSide[1],
      ],
      side: 1,
    });
    let fractionOfWinningIfSideA = chatOdds.pointsPerSide[0] === 0
      ? bet
      : bet / (bet + chatOdds.pointsPerSide[0]);
    let fractionOfWinningIfSideB = chatOdds.pointsPerSide[1] === 0
      ? bet
      : bet / (bet + chatOdds.pointsPerSide[1]);
    evIfSideA = evIfSideA * fractionOfWinningIfSideA;
    evIfSideB = evIfSideB * fractionOfWinningIfSideB;
    if (evIfSideA > evIfSideB) {
      if (evIfSideA > bestEV) {
        bestBet = bet;
        bestEV = evIfSideA;
        bestSide = 0;
      }
    } else {
      if (evIfSideB > bestEV) {
        bestBet = bet;
        bestEV = evIfSideB;
        bestSide = 1;
      }
    }
  }
  if (bestBet === 0) {
    return null;
  }
  return { side: bestSide!, points: bestBet };
}


export function expectedValues(
  { odds, pointsPerSide }: {
    odds: [number, number];
    pointsPerSide: [number, number];
  },
): [number, number] {
  return [
    expectedValue({ odds, pointsPerSide, side: 0 }),
    expectedValue({ odds, pointsPerSide, side: 1 }),
  ];
}

function expectedValue(
  { odds, pointsPerSide, side }: {
    odds: [number, number];
    pointsPerSide: [number, number];
    side: number;
  },
): number {
  const normalizedOdds = normalizeOdds(odds);

  let pointsOnOtherSide = pointsPerSide[1 - side];
  return pointsOnOtherSide * normalizedOdds[side] -
    pointsPerSide[side] * (1 - normalizedOdds[side]);
}

function normalizeOdds(odds: [number, number]): [number, number] {
  const sumOfOdds = odds[0] + odds[1];
  return odds.map((odd) => odd / sumOfOdds) as [number, number];
}
