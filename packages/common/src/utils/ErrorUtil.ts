/**
 * Safely extracts error message from any error type
 * Preserves original error information for debugging
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    // For objects, try to extract meaningful information
    const obj = error as Record<string, unknown>
    if ('message' in obj && typeof obj['message'] === 'string') {
      return obj['message']
    }
    if ('reason' in obj && typeof obj['reason'] === 'string') {
      return obj['reason']
    }
    // Fallback to JSON stringify for objects
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }

  return String(error)
}

/**
 * Serializes error object for logging/display
 * Handles Error objects properly (including stack and cause)
 */
export function serializeError(error: unknown): string {
  if (error instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: error.name,
      message: error.message
    }

    // Include stack trace if available
    if (error.stack) {
      serialized['stack'] = error.stack
    }

    // Include cause if available (Error Cause API)
    if ('cause' in error && error.cause !== undefined) {
      // Recursive for nested errors
      serialized['cause'] = error.cause instanceof Error ? serializeError(error.cause) : error.cause
    }

    // Include any custom properties
    const customProps = Object.keys(error).filter(
      key => !['name', 'message', 'stack', 'cause'].includes(key)
    )
    customProps.forEach(key => {
      serialized[key] = (error as unknown as Record<string, unknown>)[key]
    })

    return JSON.stringify(serialized, null, 2)
  }

  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

/**
 * Creates a new error with proper cause chain
 * Use this instead of: throw new Error(message)
 */
export function createError(message: string, cause?: unknown): Error {
  if (cause !== undefined) {
    return new Error(message, { cause })
  }

  return new Error(message)
}
