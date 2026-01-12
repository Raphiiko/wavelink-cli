import { exitWithError } from "./error.js";

export function parsePercent(value: string, name: string): number {
  const percent = parseInt(value, 10);
  if (isNaN(percent) || percent < 0 || percent > 100) {
    exitWithError(`${name} must be a number between 0 and 100`);
  }
  return percent;
}
