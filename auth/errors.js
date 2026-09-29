export class AuthError extends Error {
  constructor(message, { code, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "AuthError";
    this.code = code;
  }
}

const STATUS_BY_CODE = {
  MISSING_CONFIG: 500,
  INVALID_STATE: 400,
  STATE_EXPIRED: 400,
  STATE_REUSED: 400,
  LOGIN_FAILED: 401,
  NOT_IN_GUILD: 403,
  MISSING_ROLE: 403,
  SESSION_MISSING: 401,
  SESSION_EXPIRED: 401,
  SESSION_REVOKED: 401,
  ENTITLEMENT_EXPIRED: 401,
};

export function authStatus(code) {
  return STATUS_BY_CODE[code] ?? 500;
}
