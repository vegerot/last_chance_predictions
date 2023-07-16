import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { calculateBet, calculateOptimalBet, expectedValues } from "./betting.ts";

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
