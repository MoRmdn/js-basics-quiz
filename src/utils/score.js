export const PASS_PERCENTAGE = 70

export function percentageFor(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0
}

export function didPass(score, total) {
  return percentageFor(score, total) >= PASS_PERCENTAGE
}
