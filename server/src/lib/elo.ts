export function calculateElo(winnerElo: number, loserElo: number, k = 32) {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const change = Math.round(k * (1 - expected))
  return { winner: winnerElo + change, loser: loserElo - change }
}
