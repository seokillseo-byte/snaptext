CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE extraction_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  version INTEGER NOT NULL CHECK (version > 0),
  field_definitions JSONB NOT NULL CHECK (jsonb_typeof(field_definitions) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name, version)
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  schema_id UUID REFERENCES extraction_schemas(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED', 'UPLOADING', 'QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED', 'CANCELLED')),
  total_images INTEGER NOT NULL DEFAULT 0 CHECK (total_images >= 0),
  processed_images INTEGER NOT NULL DEFAULT 0 CHECK (processed_images >= 0),
  failed_images INTEGER NOT NULL DEFAULT 0 CHECK (failed_images >= 0),
  ai_budget_usd NUMERIC(12, 4) NOT NULL DEFAULT 0 CHECK (ai_budget_usd >= 0),
  ai_spend_estimate_usd NUMERIC(12, 4) NOT NULL DEFAULT 0 CHECK (ai_spend_estimate_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (processed_images <= total_images),
  CHECK (failed_images <= total_images)
);

CREATE INDEX batches_workspace_created_idx ON batches(workspace_id, created_at DESC);

CREATE TABLE source_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  sha256 CHAR(64) NOT NULL,
  width INTEGER CHECK (width IS NULL OR width > 0),
  height INTEGER CHECK (height IS NULL OR height > 0),
  status TEXT NOT NULL DEFAULT 'UPLOADED'
    CHECK (status IN ('UPLOADED', 'QUEUED', 'OCR_RUNNING', 'EXTRACTING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED', 'CANCELLED')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  error_code TEXT,
  error_message TEXT,
  ocr_text TEXT,
  ocr_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, sha256)
);

CREATE INDEX source_images_batch_status_idx ON source_images(batch_id, status);

CREATE TABLE extracted_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  source_image_id UUID REFERENCES source_images(id) ON DELETE SET NULL,
  record_index INTEGER NOT NULL CHECK (record_index >= 0),
  status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW'
    CHECK (status IN ('NEEDS_REVIEW', 'APPROVED', 'REJECTED')),
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, source_image_id, record_index)
);

CREATE INDEX extracted_records_batch_status_idx ON extracted_records(batch_id, status);

CREATE TABLE extracted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES extracted_records(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL CHECK (length(trim(field_key)) BETWEEN 1 AND 160),
  raw_value JSONB,
  normalized_value JSONB,
  confidence NUMERIC(5, 4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  review_status TEXT NOT NULL DEFAULT 'UNREVIEWED'
    CHECK (review_status IN ('UNREVIEWED', 'CONFIRMED', 'EDITED', 'UNCERTAIN', 'MISSING')),
  source_image_id UUID REFERENCES source_images(id) ON DELETE SET NULL,
  source_locator JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (record_id, field_key)
);

CREATE TABLE duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  record_a_id UUID NOT NULL REFERENCES extracted_records(id) ON DELETE CASCADE,
  record_b_id UUID NOT NULL REFERENCES extracted_records(id) ON DELETE CASCADE,
  rule_key TEXT NOT NULL,
  score NUMERIC(5, 4) CHECK (score IS NULL OR (score >= 0 AND score <= 1)),
  explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (review_status IN ('PENDING', 'SAME_RECORD', 'DIFFERENT_RECORDS', 'DISMISSED')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (record_a_id <> record_b_id),
  UNIQUE (batch_id, record_a_id, record_b_id)
);

CREATE TABLE conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES extracted_records(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  alternatives JSONB NOT NULL CHECK (jsonb_typeof(alternatives) = 'array'),
  review_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (review_status IN ('PENDING', 'RESOLVED', 'ACCEPTED_AS_IS', 'DISMISSED')),
  resolution JSONB,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX conflicts_batch_status_idx ON conflicts(batch_id, review_status);

CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  source_image_id UUID REFERENCES source_images(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT,
  purpose TEXT NOT NULL,
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  estimated_cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost_usd >= 0),
  outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILED', 'BLOCKED_BUDGET', 'TIMED_OUT')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX usage_events_workspace_created_idx ON usage_events(workspace_id, created_at DESC);
CREATE INDEX usage_events_batch_idx ON usage_events(batch_id);
