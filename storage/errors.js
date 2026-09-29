export class StorageError extends Error {
  constructor(message, { code, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "StorageError";
    this.code = code;
  }
}
