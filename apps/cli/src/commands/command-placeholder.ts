export interface CommandHandler {
  run(): Promise<void>
}

export const notImplemented = (): never => {
  throw new Error('Not implemented')
}
