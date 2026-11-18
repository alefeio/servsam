export class PermissionError extends Error {
  constructor(message = "Permissão insuficiente.") {
    super(message);
    this.name = "PermissionError";
  }
}
