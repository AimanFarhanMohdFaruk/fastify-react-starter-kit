/**
 * Typed domain / request errors — thrown by models & services.
 * composeWebApp setErrorHandler maps AppError → HTTP JSON.
 */

export type AppErrorKind = string

export class AppError extends Error {
  readonly statusCode: number
  readonly kind?: AppErrorKind

  constructor(statusCode: number, message: string, kind?: AppErrorKind) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.kind = kind
  }
}

export class ValidationError extends AppError {
  constructor(message: string, kind?: AppErrorKind) {
    super(400, message, kind)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}
