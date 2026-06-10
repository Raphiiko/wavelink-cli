import { exitWithError } from "./error.js";

export function parsePercent(value: string, name: string): number {
  const percent = parseInt(value, 10);
  if (isNaN(percent) || percent < 0 || percent > 100) {
    exitWithError(`${name} must be a number between 0 and 100`);
  }
  return percent;
}

const TRUE_VALUES = new Set(["on", "true", "1", "enable", "enabled", "yes"]);
const FALSE_VALUES = new Set(["off", "false", "0", "disable", "disabled", "no"]);

export function parseOnOff(value: string, name: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  exitWithError(`${name} must be one of: on, off (also accepts true/false, 1/0, enable/disable)`);
}
