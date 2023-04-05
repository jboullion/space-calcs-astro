// depricated: we use formatNumbers now
export function addCommas(value: number, decimals: number = 0) {
  return formatNumber(value, decimals);
}

export function formatNumber(value: number, decimals: number = 0) {
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals });
}
