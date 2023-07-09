import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";

Deno.test("hi", () => {
  assertEquals(
    calculateBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [6000, 4000] },
    ),
    { side: 1, points: 100 },
  );
  assertEquals(
    calculateBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [4000, 6000] },
    ),
    { side: 0, points: 100 },
  );

  assertEquals(
    calculateBet(
      /*userOdds*/ { odds: [75, 25], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [4000, 6000] },
    ),
    { side: 0, points: 100 },
  );

  assertEquals(
    calculateBet(
      /*userOdds*/ { odds: [75, 25], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [6000, 4000] },
    ),
    { side: 0, points: 100 },
  );
});

Deno.test("voting for less likely winner is best", () => {
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [75, 25] },
      /*chatOdds*/ { pointsPerSide: [900, 100] },
    )!.side,
    1,
  );
});

Deno.test("The only winning move is not to play.", () => {
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50] },
      /*chatOdds*/ { pointsPerSide: [0, 0] },
    ),
    null,
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [90, 10] },
      /*chatOdds*/ { pointsPerSide: [9, 1] },
    ),
    null,
  );
});

Deno.test("bet less than maxBet", () => {
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50] },
      /*chatOdds*/ { pointsPerSide: [150, 100] },
    ),
    { side: 1, points: 22 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [90, 10] },
      /*chatOdds*/ { pointsPerSide: [8, 1] },
    ),
    { side: 0, points: 1 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [90, 10] },
      /*chatOdds*/ { pointsPerSide: [800, 100] },
    ),
    { side: 0, points: 49 },
  );
});

Deno.test("bet with a best bet amount greater than maxBet", () => {
  assertEquals(
    calculateBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 10 },
      /*chatOdds*/ { pointsPerSide: [150, 100] },
    ),
    { side: 1, points: 10 }, // Best bet amount is 22, but maxBet is 10.
  );
});

function calculateBet(
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

function calculateOptimalBet(
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

Deno.test("expected value of 50/50", () => {
  assertEquals(expectedValues({ odds: [50, 50], pointsPerSide: [1, 1] }), [
    0,
    0,
  ]);
  assertEquals(
    expectedValues({ odds: [75, 25], pointsPerSide: [100, 100] }),
    [100 * .75 - 100 * .25, /*=50*/ -100 * .75 + 100 * .25 /*=-50*/],
  );
  assertEquals(
    expectedValues({ odds: [50, 50], pointsPerSide: [1000, 2000] }),
    [500, -500],
  );
});

function expectedValues(
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
