export type CursorPaths = {
  projectConfigPath: string
  detected: boolean
}

export const resolveCursorPaths = (
  cwd: string = process.cwd(),
): CursorPaths => {
  return {
    projectConfigPath: `${cwd}/.cursor/mcp.json`,
    detected: true,
  }
}
