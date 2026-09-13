import { expect, test } from "vitest";
import { calculateSizeChange } from "./calculateSizeChange";

test("reports when the processed file is smaller than the original file", () => {
    const result = calculateSizeChange(1000, 250);

    expect(result).toEqual({
        kind: "smaller",
        percentage: 75,
        label: "75.0% smaller"
    })
})

test("reports when the processed file is larger than the original file", () => {
    const result = calculateSizeChange(250, 500);

    expect(result).toEqual({
        kind: "larger",
        percentage: 100,
        label: "100.0% larger"
    })
})


test("reports when the processed file is the same size as the original file", () => {
    const result = calculateSizeChange(1000, 1000);

    expect(result).toEqual({
        kind: "same",
        percentage: 0,
        label: "Same size"
    })
})