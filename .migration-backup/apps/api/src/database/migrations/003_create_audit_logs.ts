const AUDIT_LOGS_SQL = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    user_email  TEXT NOT NULL DEFAULT '',
    method      TEXT NOT NULL,
    path        TEXT NOT NULL,
    body        TEXT,
    status_code INTEGER NOT NULL,
    ip          TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_method_path ON audit_logs (method, path);
`;

export default AUDIT_LOGS_SQL;
