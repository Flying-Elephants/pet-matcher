import { describe, it, expect } from "vitest";
import { WeightUtils } from "../../app/modules/Core/WeightUtils";

describe("WeightUtils", () => {
  it("should convert kg to grams", () => {
    expect(WeightUtils.toGrams(5, 'kg')).toBe(5000);
    expect(WeightUtils.toGrams(2.5, 'kg')).toBe(2500);
  });

  it("should convert lbs to grams", () => {
    // 1 lb = 453.592g
    expect(WeightUtils.toGrams(1, 'lbs')).toBe(454);
    expect(WeightUtils.toGrams(10, 'lbs')).toBe(4536);
  });

  it("should convert grams to kg", () => {
    expect(WeightUtils.fromGrams(5000, 'kg')).toBe(5);
    expect(WeightUtils.fromGrams(2500, 'kg')).toBe(2.5);
  });

  it("should convert grams to lbs", () => {
    // 453.592 / 453.592 = 1
    expect(WeightUtils.fromGrams(453.592, 'lbs')).toBe(1);
    expect(WeightUtils.fromGrams(4536, 'lbs')).toBe(10);
  });

  it("should handle null and undefined", () => {
    expect(WeightUtils.toGrams(null, 'kg')).toBeNull();
    expect(WeightUtils.fromGrams(undefined, 'lbs')).toBeNull();
  });

  it("should format weights correctly", () => {
    expect(WeightUtils.format(5000, 'kg')).toBe("5 kg");
    expect(WeightUtils.format(453.592, 'lbs')).toBe("1 lbs");
    expect(WeightUtils.format(null, 'kg')).toBe("N/A");
  });
});
