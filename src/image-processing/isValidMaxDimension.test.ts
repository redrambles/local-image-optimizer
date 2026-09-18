import { expect, test } from "vitest";
import { isValidMaxDimension } from "./isValidMaxDimension";

test("returns false if input is 0", () => {
  const result = isValidMaxDimension(0);

  expect(result).toEqual(false);
});

test("returns false if input is negative", () => {
  const result = isValidMaxDimension(-2);

  expect(result).toEqual(false);
});

test("returns true if number is 1", () => {
  const result = isValidMaxDimension(1);

  expect(result).toEqual(true);
});

test("returns true if number is 1000", () => {
  const result = isValidMaxDimension(1000);

  expect(result).toEqual(true);
});

test("returns false if number is a float", () => {
  const result = isValidMaxDimension(0.4);

  expect(result).toEqual(false);
});

test("returns false if number is a NaN", () => {
  const result = isValidMaxDimension(NaN);

  expect(result).toEqual(false);
});

test("returns false if number is Infinity", () => {
  const result = isValidMaxDimension(Infinity);

  expect(result).toEqual(false);
});
