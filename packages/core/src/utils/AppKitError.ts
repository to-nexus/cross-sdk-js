export class AppKitNotInitializedError extends Error {
  public readonly code = 'APPKIT_NOT_INITIALIZED'

  public constructor() {
    super('AppKit is not initialized. Call createAppKit() before using this API.')
    this.name = 'AppKitNotInitializedError'
  }
}
