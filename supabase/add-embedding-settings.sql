-- Add embedding settings to chat_settings
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS embedding_api_key TEXT;
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'openai/text-embedding-ada-002';

-- Comment
COMMENT ON COLUMN chat_settings.embedding_api_key IS 'API key for embedding provider (encrypted)';
COMMENT ON COLUMN chat_settings.embedding_model IS 'Model for generating embeddings';
