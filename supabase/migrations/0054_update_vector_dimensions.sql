-- Since we are moving to Xenova/all-MiniLM-L6-v2 which generates 384-dimensional embeddings
-- We need to update the vector column in knowledge_base table to 384 dimensions

-- Drop the old embedding column
ALTER TABLE public.knowledge_base DROP COLUMN embedding;

-- Add the new embedding column with 384 dimensions
ALTER TABLE public.knowledge_base ADD COLUMN embedding VECTOR(384);

-- Recreate the index for the new column
DROP INDEX IF EXISTS idx_kb_embedding;
CREATE INDEX idx_kb_embedding ON knowledge_base
  USING hnsw (embedding vector_cosine_ops);
