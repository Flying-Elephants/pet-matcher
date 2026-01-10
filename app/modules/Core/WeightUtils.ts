export const WeightUtils = {
  KG_TO_GRAMS: 1000,
  LBS_TO_GRAMS: 453.592,

  /**
   * Converts a weight value from the given unit to grams.
   */
  toGrams(value: number | null | undefined, unit: 'kg' | 'lbs'): number | null {
    if (value === null || value === undefined || isNaN(value)) return null;
    const factor = unit === 'kg' ? this.KG_TO_GRAMS : this.LBS_TO_GRAMS;
    return Math.round(value * factor);
  },

  /**
   * Converts a weight value from grams to the given unit.
   * Returns a number rounded to 1 decimal place.
   */
  fromGrams(grams: number | null | undefined, unit: 'kg' | 'lbs'): number | null {
    if (grams === null || grams === undefined || isNaN(grams)) return null;
    const factor = unit === 'kg' ? this.KG_TO_GRAMS : this.LBS_TO_GRAMS;
    const value = grams / factor;
    return Math.round(value * 10) / 10;
  },

  /**
   * Formats a gram value into a display string with the unit.
   */
  format(grams: number | null | undefined, unit: 'kg' | 'lbs'): string {
    const value = this.fromGrams(grams, unit);
    if (value === null) return 'N/A';
    return `${value} ${unit}`;
  }
};
