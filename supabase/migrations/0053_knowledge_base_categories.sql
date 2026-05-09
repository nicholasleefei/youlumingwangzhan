-- Create knowledge_base_categories table
CREATE TABLE IF NOT EXISTS public.knowledge_base_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default categories
INSERT INTO public.knowledge_base_categories (name, sort_order) VALUES
    ('车型配置', 10),
    ('价格信息', 20),
    ('出口流程', 30),
    ('清关文件', 40),
    ('海运时效', 50),
    ('付款方式', 60),
    ('FAQ', 70),
    ('二手车规则', 80),
    ('改装服务', 90),
    ('其他', 100)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.knowledge_base_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.knowledge_base_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.knowledge_base_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.knowledge_base_categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.knowledge_base_categories FOR DELETE USING (true);

-- Create update trigger for updated_at
DROP TRIGGER IF EXISTS kb_categories_updated_at ON knowledge_base_categories;
CREATE TRIGGER kb_categories_updated_at
    BEFORE UPDATE ON knowledge_base_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_kb_timestamp();
