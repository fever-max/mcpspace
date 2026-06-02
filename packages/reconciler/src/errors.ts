export type ReconcileErrorCode = 'CLIENT_NOT_FOUND' | 'INVALID_MCP_REFERENCE'

export class ReconcileError extends Error {
  constructor(
    readonly code: ReconcileErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ReconcileError'
  }
}
