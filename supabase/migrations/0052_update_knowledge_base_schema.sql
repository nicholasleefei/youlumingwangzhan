-- Drop the old table if exists
DROP TABLE IF EXISTS public.knowledge_base CASCADE;

-- Create the new table based on colleague's schema
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'file')),
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  embedding VECTOR(1536),  -- OpenAI text-embedding-ada-002
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kb_content_type ON knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_is_active ON knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_base
  USING hnsw (embedding vector_cosine_ops);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_kb_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kb_updated_at ON knowledge_base;
CREATE TRIGGER kb_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_timestamp();

-- Re-enable RLS and add policies
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.knowledge_base FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.knowledge_base FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.knowledge_base FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.knowledge_base FOR DELETE USING (true);
