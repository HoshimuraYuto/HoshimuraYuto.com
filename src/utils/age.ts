const MS_PER_DAY = 86_400_000;
function daysBetween(from: string, to: Date): number {
  return Math.max(
    0,
    Math.floor((to.getTime() - Date.parse(from)) / MS_PER_DAY),
  );
}

export { daysBetween };
