-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products_cache
ALTER TABLE products_cache ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products_cache USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Comment on column
COMMENT ON COLUMN products_cache.embedding IS 'OpenAI text-embedding-ada-002 vector (1536 dimensions) for product name similarity search';
