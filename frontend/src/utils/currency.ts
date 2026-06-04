export const formatDonut = (vndAmount: number | null | undefined): string => {
  if (vndAmount === null || vndAmount === undefined) return '0 🍩';
  const val = vndAmount / 1000;
  return val.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' 🍩';
};

export const formatDonutRaw = (vndAmount: number | null | undefined): string => {
  if (vndAmount === null || vndAmount === undefined) return '0';
  const val = vndAmount / 1000;
  return val.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
};

export const donutToVnd = (donutAmount: number): number => {
  return donutAmount * 1000;
};

export const vndToDonut = (vndAmount: number): number => {
  return vndAmount / 1000;
};
