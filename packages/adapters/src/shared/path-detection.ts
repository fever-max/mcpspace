import { existsSync } from 'node:fs'
import { dirname } from 'node:path'

export type CandidatePathSelection = {
  selectedPath: string
  detected: boolean
}

export const selectPath = (candidates: string[]): CandidatePathSelection => {
  const normalized = candidates.filter((v) => v.length > 0)
  for (const path of normalized) {
    if (existsSync(path) || existsSync(dirname(path))) {
      return { selectedPath: path, detected: true }
    }
  }

  return {
    selectedPath: normalized[0] ?? '',
    detected: false,
  }
}
