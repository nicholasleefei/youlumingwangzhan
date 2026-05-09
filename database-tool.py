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
PASSWORD = "feifaguo2010"  # 数据库密码
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
# 批量更新功能的数据库迁移
# ==============================================

def add_activity_status_columns():
    """为 brands, models, series 添加 activity_status 列"""
    print("\n开始添加 activity_status 列到所有表...")

    try:
        print("\n1. 为 brands 表添加 activity_status 列...")
        run("ALTER TABLE brands ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;")
        print("   brands 表列添加成功")
    except Exception as e:
        print(f"   brands 表: {e}")

    try:
        print("\n2. 为 models 表添加 activity_status 列...")
        run("ALTER TABLE models ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;")
        print("   models 表列添加成功")
    except Exception as e:
        print(f"   models 表: {e}")

    try:
        print("\n3. 为 series 表添加 activity_status 列...")
        run("ALTER TABLE series ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;")
        print("   series 表列添加成功")
    except Exception as e:
        print(f"   series 表: {e}")

    try:
        print("\n4. 创建查询索引...")
        run("CREATE INDEX IF NOT EXISTS idx_brands_activity_status ON brands(activity_status);")
        run("CREATE INDEX IF NOT EXISTS idx_models_activity_status ON models(activity_status);")
        run("CREATE INDEX IF NOT EXISTS idx_series_activity_status ON series(activity_status);")
        print("   索引创建成功")
    except Exception as e:
        print(f"   索引: {e}")

    print("\n" + "="*60)
    print("✅ activity_status 列添加完成！")
    print("="*60)

    print("\n验证更新是否成功...")
    run("""
        SELECT table_name, column_name, data_type, column_default
        FROM information_schema.columns
        WHERE column_name = 'activity_status'
        AND table_schema = 'public'
        ORDER BY table_name;
    """)

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
        ["chery-tiggo-7", "Chery Tiggo 7", "Chery", "SUV", "Hybrid", "2024", "18000",

# ==============================================
# 主函数 - 运行迁移
# ==============================================

if __name__ == "__main__":
    import sys

    print("="*60)
    print("数据库工具")
    print("="*60)

    # 显示可用的函数
    functions = [
        f"  {i+1}. {name}" for i, (name, obj) in enumerate(globals().items())
        if callable(obj) and (
            name.startswith('add_') or
            name.startswith('init_') or
            name.startswith('show_') or
            name.startswith('create_') or
            name.startswith('desc') or
            name.startswith('select') or
            name.startswith('update') or
            name.startswith('delete')
        )
    ]

    print("\n可用命令:")
    print("\n".join(functions))
    print("\n  show_tables - 查看所有表")
    print("  desc - 查看表结构")
    print("  select - 查询数据")
    print("\n" + "="*60)

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd in globals() and callable(globals()[cmd]):
            func = globals()[cmd]
            if len(sys.argv) > 2:
                func(*sys.argv[2:])
            else:
                func()
        else:
            print(f"\n未知命令: {cmd}")
    else:
        # 默认执行迁移
        print("\n默认执行: add_activity_status_columns")
        add_activity_status_columns()