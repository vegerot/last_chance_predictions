import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";

//Deno.test("hi", () => { assertEquals( calculateOptimalBet( /*userOdds*/ { odds: [50, 50], bet: 100 }, /*chatOdds*/ { pointsPerSide: [6000, 4000] },), { side: 1, points: 100 },); });

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
