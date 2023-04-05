// depricated: we use formatNumbers now
export function addCommas(value: number, decimals: number = 0) {
  return formatNumbers(value, decimals);
}

export function formatNumbers(value: number, decimals: number = 0) {
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals });
}
