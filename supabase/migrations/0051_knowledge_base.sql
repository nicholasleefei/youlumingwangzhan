-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'file')),
    content TEXT,
    file_url TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policies for knowledge_base
CREATE POLICY "Enable read access for all users" ON public.knowledge_base FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.knowledge_base FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.knowledge_base FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.knowledge_base FOR DELETE USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge_base', 'knowledge_base', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for knowledge_base bucket" ON storage.objects FOR SELECT USING (bucket_id = 'knowledge_base');
CREATE POLICY "Public insert access for knowledge_base bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'knowledge_base');
CREATE POLICY "Public update access for knowledge_base bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'knowledge_base');
CREATE POLICY "Public delete access for knowledge_base bucket" ON storage.objects FOR DELETE USING (bucket_id = 'knowledge_base');
