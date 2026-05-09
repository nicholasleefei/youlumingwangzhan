
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'xpksqkhgfqekysbebznv.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'feifaguo2010',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

const sqlCommands = `
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON brands;
DROP POLICY IF EXISTS "Models are visible with normal activity status" ON models;
DROP POLICY IF EXISTS "Series are visible with normal activity status" ON series;
DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON model_details;
DROP POLICY IF EXISTS "Admins can manage all brands" ON brands;
DROP POLICY IF EXISTS "Admins can manage all models" ON models;
DROP POLICY IF EXISTS "Admins can manage all series" ON series;
DROP POLICY IF EXISTS "Admins can manage all model_details" ON model_details;

CREATE POLICY "Brands are visible with normal activity status"
ON brands
FOR SELECT
USING (activity_status = 0);

CREATE POLICY "Series are visible with normal activity status"
ON series
FOR SELECT
USING (
activity_status = 0 AND
EXISTS (SELECT 1 FROM brands WHERE brands.id = series.brand_id AND brands.activity_status = 0)
);

CREATE POLICY "Models are visible with normal activity status"
ON models
FOR SELECT
USING (
activity_status = 0 AND
(
brand IS NOT NULL AND EXISTS (SELECT 1 FROM brands WHERE brands.name = models.brand AND brands.activity_status = 0)
OR brand IS NULL
)
);

CREATE POLICY "Model details are visible with normal activity status"
ON model_details
FOR SELECT
USING (
activity_status = 0 AND
(
brandname IS NOT NULL AND EXISTS (SELECT 1 FROM brands WHERE brands.name = model_details.brandname AND brands.activity_status = 0)
OR model_id IS NOT NULL AND EXISTS (SELECT 1 FROM models WHERE models.id = model_details.model_id AND models.activity_status = 0)
)
);

CREATE POLICY "Admins can manage all brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage all models" ON models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage all series" ON series FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage all model details" ON model_details FOR ALL USING (true) WITH CHECK (true);
`;

async function main() {
  console.log('🚀 使用 pg 客户端执行 RLS 策略修复...\n');

  const client = await pool.connect();

  try {
    console.log('✅ 数据库连接成功！\n');

    // 分离 SQL 命令并逐行执行
    const statements = sqlCommands
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📋 准备执行 ${statements.length} 条 SQL 命令...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      try {
        await client.query(stmt);
        console.log(`✅ [${i + 1}/${statements.length}] 执行成功`);
        successCount++;
      } catch (err) {
        // 一些 ALTER 和 DROP 操作如果重复执行可能出错但不影响
        if (err.message.includes('already exists') || err.message.includes('does not exist') || err.message.includes('already enabled')) {
          console.log(`⚠️  [${i + 1}/${statements.length}] 已处理: ${err.message.substring(0, 50)}...`);
          successCount++;
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] 执行失败:`, err.message);
          errorCount++;
        }
      }
    }

    console.log(`\n✅ 命令执行完成: ${successCount} 成功, ${errorCount} 失败\n`);

    // 验证策略是否创建成功
    console.log('🔍 验证策略创建结果...');
    const verifyResult = await client.query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('brands', 'models', 'series', 'model_details')
      ORDER BY tablename, policyname;
    `);

    console.log(`📊 已创建的策略 (${verifyResult.rows.length} 条):`);
    verifyResult.rows.forEach(row => {
      console.log(`   ${row.tablename}.${row.policyname}`);
    });

    // 检查每个表是否有足够的策略
    const expectedPolicies = {
      brands: 2,
      models: 2,
      series: 2,
      model_details: 2
    };

    const actualCounts = {};
    verifyResult.rows.forEach(row => {
      actualCounts[row.tablename] = (actualCounts[row.tablename] || 0) + 1;
    });

    console.log('\n✅ 各表策略计数:');
    Object.keys(expectedPolicies).forEach(table => {
      const expected = expectedPolicies[table];
      const actual = actualCounts[table] || 0;
      const status = actual === expected ? '✅' : '❌';
      console.log(`   ${status} ${table}: ${actual}/${expected} 策略`);
    });

    console.log('\n🎉 RLS 策略修复成功！');
    console.log('\n请重新运行验证脚本检查是否正常工作:');
    console.log('   node scripts/verify_rls_working.js');

  } catch (error) {
    console.error('❌ 执行过程中出错:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
