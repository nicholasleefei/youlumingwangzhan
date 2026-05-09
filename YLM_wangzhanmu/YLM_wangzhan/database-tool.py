# ============================================== 
#  Trae 万能 Supabase 工具箱（你的项目已配置好） 
#  功能：建表、增删改查、看表、看结构、改字段 
# ============================================== 
import psycopg2 

# 你的 Supabase 信息（从 .env.local 获取） 
# 注意：需要从 Supabase 控制台获取正确的数据库连接信息
# 参考：https://supabase.com/docs/guides/database/connecting-to-postgres
HOST = "xpksqkhgfqekysbebznv.supabase.co"  # 从 VITE_SUPABASE_URL 提取
PORT = "5432"  # PostgreSQL 默认端口
USER = "postgres"  # 默认用户名
PASSWORD = ""  # 需要从 Supabase 控制台获取
DATABASE = "postgres"  # 默认数据库名

# 连接数据库 
def get_conn():
    return psycopg2.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        dbname=DATABASE,
        sslmode="require"
    )

# ------------------------------ 
# 1. 执行任意 SQL（你想干嘛就写啥） 
# ------------------------------ 
def run(sql):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    try:
        for row in cur.fetchall():
            print(row)
    except:
        print("执行成功")
    cur.close()
    conn.close()

# ------------------------------ 
# 2. 查看数据库里所有表 
# ------------------------------ 
def show_tables():
    print("\n所有表：")
    run("SELECT tablename FROM pg_tables WHERE schemaname='public';")

# ------------------------------ 
# 3. 查看表结构（字段、类型、约束） 
# ------------------------------ 
def desc(table):
    print(f"\n表 {table} 结构：")
    run(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='{table}';")

# ------------------------------ 
# 4. 查询数据 
# ------------------------------ 
def select(table, where="1=1", limit=100):
    print(f"\n查询 {table}：")
    run(f"SELECT * FROM {table} WHERE {where} LIMIT {limit};")

# ------------------------------ 
# 5. 插入数据 
# ------------------------------ 
def insert(table, columns, values):
    cols = ",".join(columns)
    vals = ",".join([f"'{v}'" for v in values])
    run(f"INSERT INTO {table} ({cols}) VALUES ({vals});")

# ------------------------------ 
# 6. 更新数据 
# ------------------------------ 
def update(table, set_sql, where):
    run(f"UPDATE {table} SET {set_sql} WHERE {where};")

# ------------------------------ 
# 7. 删除数据 
# ------------------------------ 
def delete(table, where):
    run(f"DELETE FROM {table} WHERE {where};")

# ------------------------------ 
# 8. 创建表（你要的表结构设计） 
# ------------------------------ 
def create_table(table, sql):
    print(f"\n创建表 {table}...")
    run(f"CREATE TABLE IF NOT EXISTS {table} ({sql});")

# ============================================== 
# 网页需求相关的数据库操作 
# ============================================== 

def add_brand_filter():
    """添加品牌筛选功能所需的索引"""
    print("\n添加品牌索引...")
    run("CREATE INDEX IF NOT EXISTS idx_models_brand_active ON public.models(brand, is_active);")
    print("品牌索引添加成功")

def add_price_range_filter():
    """添加价格范围筛选功能所需的索引"""
    print("\n添加价格索引...")
    run("CREATE INDEX IF NOT EXISTS idx_models_price ON public.models(fob_price_min, fob_price_max, is_active);")
    print("价格索引添加成功")

def add_model_category():
    """添加车型分类字段"""
    print("\n添加车型分类字段...")
    run("ALTER TABLE public.models ADD COLUMN IF NOT EXISTS category text;")
    run("CREATE INDEX IF NOT EXISTS idx_models_category ON public.models(category, is_active);")
    print("车型分类字段添加成功")

def add_inquiry_file_upload():
    """添加询盘文件上传功能"""
    print("\n创建询盘文件表...")
    create_table("inquiry_files", """
        id uuid primary key default gen_random_uuid(),
        inquiry_id uuid not null references public.inquiries(id) on delete cascade,
        file_name text not null,
        file_path text not null,
        file_type text,
        file_size bigint,
        created_at timestamptz not null default now()
    """)
    run("CREATE INDEX IF NOT EXISTS idx_inquiry_files_inquiry_id ON public.inquiry_files(inquiry_id);")
    print("询盘文件表创建成功")

def add_user_dashboard():
    """添加用户仪表盘功能"""
    print("\n创建用户表...")
    create_table("users", """
        id uuid primary key references auth.users(id) on delete cascade,
        name text,
        company text,
        phone text,
        country text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
    """)
    run("CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);")
    print("用户表创建成功")

def add_sales_statistics():
    """添加销售统计功能"""
    print("\n创建销售统计表...")
    create_table("sales_statistics", """
        id uuid primary key default gen_random_uuid(),
        period text not null, -- 如 '2024-Q1', '2024-01'
        country text not null,
        brand text not null,
        model text not null,
        quantity int not null,
        revenue numeric not null,
        created_at timestamptz not null default now(),
        unique(period, country, brand, model)
    """)
    run("CREATE INDEX IF NOT EXISTS idx_sales_period ON public.sales_statistics(period);")
    run("CREATE INDEX IF NOT EXISTS idx_sales_country ON public.sales_statistics(country);")
    print("销售统计表创建成功")

def add_vehicle_configurations():
    """添加车型配置功能"""
    print("\n创建车型配置表...")
    create_table("vehicle_configurations", """
        id uuid primary key default gen_random_uuid(),
        model_id uuid not null references public.models(id) on delete cascade,
        name text not null,
        description text,
        price_diff numeric,
        is_default boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
    """)
    run("CREATE INDEX IF NOT EXISTS idx_vehicle_configurations_model_id ON public.vehicle_configurations(model_id);")
    print("车型配置表创建成功")

# ============================================== 
# 数据初始化 
# ============================================== 
def init_sample_data():
    """初始化示例数据"""
    print("\n初始化示例数据...")
    
    # 添加示例品牌
    sample_brands = ["BYD", "Geely", "Chery", "Great Wall", "SAIC", "NIO", "XPeng", "Li Auto"]
    
    # 添加示例车型
    sample_models = [
        ["byd-han", "BYD Han", "BYD", "Sedan", "Electric", "2024", "25000", "35000", "USD", "true", "true", "{}"],
        ["geely-coolray", "Geely Coolray", "Geely", "SUV", "Gasoline", "2024", "15000", "20000", "USD", "true", "true", "{}"],
        ["chery-tiggo-7", "Chery Tiggo 7", "Chery", "SUV", "Hybrid", "2024", "18000", "