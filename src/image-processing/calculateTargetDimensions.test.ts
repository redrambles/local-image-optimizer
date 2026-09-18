import { expect, test } from "vitest";
import { calculateTargetDimensions } from "./calculateTargetDimensions";


test("scales down a landscape image while preserving its proportions", () => {
    const result = calculateTargetDimensions(4000, 3000, 1000);

    expect(result).toEqual({
        width: 1000,
        height: 750,
    });
});

test("it does not upscale an image that is narrower than the maximum dimension", () => {
    const result = calculateTargetDimensions(800, 600, 1000);

    expect(result).toEqual({
        width: 800,
        height: 600,
    })
})

test("it preserves the proportions of a square image", () => {
    const result = calculateTargetDimensions(2000, 2000, 1000);

    expect(result).toEqual({
        width: 1000,
        height: 1000,
    })
})

test("scales down a portrait image so neither dimension exceeds the maximum", () => {
    const result = calculateTargetDimensions(3000, 4000, 1000);

    expect(result).toEqual({
        width: 750,
        height: 1000
    });
});
