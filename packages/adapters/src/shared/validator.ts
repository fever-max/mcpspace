import type { ValidationResult } from '@mcpspace/shared'
import { ClientConfigSchema } from './client-config-schema.js'

export interface AdapterValidator {
  validate(content: string): ValidationResult
}

export class JsonConfigValidator implements AdapterValidator {
  validate(content: string): ValidationResult {
    try {
      const parsed = JSON.parse(content) as unknown
      ClientConfigSchema.parse(parsed)
      return { valid: true, errors: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid config JSON'
      return { valid: false, errors: [message] }
    }
  }
}

