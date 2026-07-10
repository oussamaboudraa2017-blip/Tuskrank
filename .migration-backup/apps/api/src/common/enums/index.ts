/**
 * Application-wide enums.
 * Database ENUMs are owned by PostgreSQL — these mirror them only when
 * TypeScript code needs to validate values at the boundary.
 */

export enum AppEnvironment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Trace = 'trace',
  Silent = 'silent',
}

export enum LogFormat {
  Pretty = 'pretty',
  Json = 'json',
}

/**
 * Allowed roles on a Supabase JWT (`app_metadata.user_role` or
 * `user_metadata.role`). Mirrored here for type-safe guards.
 */
export enum UserRole {
  Anonymous = 'anon',
  Authenticated = 'authenticated',
  Service = 'service_role',
  Admin = 'admin',
}
