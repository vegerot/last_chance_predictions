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

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 49 },
      /*chatOdds*/ { pointsPerSide: [150, 100] },
    ),
    { side: 1, points: 49 },
  );

  assertEquals(
    calculateOptimalBet(
      /*userOdds*/ { odds: [50, 50], maxBet: 51 },
      /*chatOdds*/ { pointsPerSide: [150, 100] },
    ),
    null,
  );
});

// assertEquals(
//   someFutureFunction(
//     /*userOdds*/ { odds: [50, 50], maxBet: 51 },
//     /*chatOdds*/ { pointsPerSide: [150, 100] },
//   ),
// {side: 1, points: 49},
// );

function calculateOptimalBet(
  userOdds: { odds: [number, number]; maxBet: number },
  chatOdds: { pointsPerSide: [number, number] },
): { side: number; points: number } | null {
  let evIfSideA = expectedValue({ odds: userOdds.odds }, {
    pointsPerSide: [
      chatOdds.pointsPerSide[0] + userOdds.maxBet,
      chatOdds.pointsPerSide[1],
    ],
  })[0];
  let evIfSideB = expectedValue({ odds: userOdds.odds }, {
    pointsPerSide: [
      chatOdds.pointsPerSide[0],
      userOdds.maxBet + chatOdds.pointsPerSide[1],
    ],
  })[1];
  if (evIfSideA > evIfSideB) {
    if (evIfSideA < 0) {
      return null;
    }
    return { side: 0, points: userOdds.maxBet };
  } else {
    if (evIfSideB < 0) {
      return null;
    }
    return { side: 1, points: userOdds.maxBet };
  }
}

Deno.test("expected value of 50/50", () => {
  assertEquals(expectedValue({ odds: [50, 50] }, { pointsPerSide: [1, 1] }), [
    0,
    0,
  ]);
  assertEquals(
    expectedValue({ odds: [75, 25] }, { pointsPerSide: [100, 100] }),
    [100 * .75 - 100 * .25, /*=50*/ -100 * .75 + 100 * .25 /*=-50*/],
  );
  assertEquals(
    expectedValue({ odds: [50, 50] }, { pointsPerSide: [1000, 2000] }),
    [500, -500],
  );
});

function expectedValue(
  { odds }: { odds: [number, number] },
  { pointsPerSide }: { pointsPerSide: [number, number] },
): [number, number] {
  const sumOfOdds = odds[0] + odds[1];
  const normalizedOdds = odds.map((odd) => odd / sumOfOdds);
  assertEquals(1 - normalizedOdds[0], normalizedOdds[1]);

  const expectedValueOfPredictingA = pointsPerSide[1] * normalizedOdds[0] -
    pointsPerSide[0] * (1 - normalizedOdds[0]);
  const expectedValueOfPredictingB = pointsPerSide[0] * normalizedOdds[1] -
    pointsPerSide[1] * (1 - normalizedOdds[1]);
  return [expectedValueOfPredictingA, expectedValueOfPredictingB];
}
