import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";

Deno.test("hi", () => {
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [6000, 4000] },
    ),
    { side: 1, points: 100 },
  );
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [4000, 6000] },
    ),
    { side: 0, points: 100 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [75, 25], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [4000, 6000] },
    ),
    { side: 0, points: 100 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [75, 25], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [6000, 4000] },
    ),
    { side: 0, points: 100 },
  );
});

Deno.test("The only winning move is not to play.", () => {
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 51 },
      /*chatOdds*/ { pointsPerSide: [0, 0] },
    ),
    null,
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [90, 10], maxBet: 50_000 },
      /*chatOdds*/ { pointsPerSide: [9, 1] },
    ),
    null,
  );
});

Deno.test("bet less than maxBet", () => {
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 51 },
      /*chatOdds*/ { pointsPerSide: [150, 100] },
    ),
    { side: 1, points: 22 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 49 },
      /*chatOdds*/ { pointsPerSide: [150, 100] },
    ),
    { side: 1, points: 22 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [90, 10], maxBet: 100 },
      /*chatOdds*/ { pointsPerSide: [8, 1] },
    ),
    { side: 0, points: 1 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [90, 10], maxBet: 10_000 },
      /*chatOdds*/ { pointsPerSide: [800, 100] },
    ),
    { side: 0, points: 49 },
  );
});

Deno.test("bet with a best bet amount greater than maxBet", () => {
  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 10 },
      /*chatOdds*/ { pointsPerSide: [150, 100] },
    ),
    { side: 1, points: 10 }, // Best bet amount is 22, but maxBet is 10.
  );
});

function calculateOptimalBet(
  userOdds: { odds: [number, number]; maxBet: number },
  chatOdds: { pointsPerSide: [number, number] },
): { side: number; points: number } | null {
  let bet = userOdds.maxBet;
  let bestSide;
  let bestBet = -Infinity;
  let bestEV = -Infinity;
  for (let bet = 0; bet <= userOdds.maxBet; ++bet) {
    let evIfSideA = expectedValues({ odds: userOdds.odds,
      pointsPerSide: [
        chatOdds.pointsPerSide[0] + bet,
        chatOdds.pointsPerSide[1],
      ],
    })[0];
    let evIfSideB = expectedValues({ odds: userOdds.odds,
      pointsPerSide: [
        chatOdds.pointsPerSide[0],
        bet + chatOdds.pointsPerSide[1],
      ],
    })[1];
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
  const sumOfOdds = odds[0] + odds[1];
  const normalizedOdds = odds.map((odd) => odd / sumOfOdds);
  //assertEquals(1 - normalizedOdds[0], normalizedOdds[1]);

  let pointsOnOtherSide = pointsPerSide[1 - side];
  return pointsOnOtherSide * normalizedOdds[side] -
    pointsPerSide[side] * (1 - normalizedOdds[side]);
}
