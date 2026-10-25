-- AniSoraDB Checkpoint Schema
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS anisora_ids (
    anisora_id INTEGER PRIMARY KEY,
    line_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS search_cache (
    query_key TEXT PRIMARY KEY,
    hianime_id TEXT,
    status TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entries (
    line_index INTEGER PRIMARY KEY,
    anisora_id INTEGER UNIQUE NOT NULL,
    hianime_id TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);

COMMIT;
