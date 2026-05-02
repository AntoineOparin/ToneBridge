const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function seedNotes(seed: number, count = 10): string[] {
  let s = seed
  return Array.from({ length: count }, () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return `${NOTES[s % 12]}4`
  })
}
