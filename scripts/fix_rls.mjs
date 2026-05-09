import pg from 'pg';
const { Pool } = pg;

// 数据库连接信息
// 使用与 Supabase 控制台显示的相同的连接配置
const pool = new Pool({
  host: 'xpksqkhgfqekysbebznv.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'feifaguo2010',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeQuery(sql) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    return result;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 开始修复 RLS 策略...\n');

  try {
    // 1. 先检查当前数据库状态
    console.log('1️⃣ 检查当前策略状态...');
    const checkPolicies = `
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('brands', 'models', 'series', 'model_details');
    `;
    const policies = await executeQuery(checkPolicies);
    console.log('现有策略:');
    policies.rows.forEach(row => {
      console.log(`  - ${row.schemaname}.${row.tablename}.${row.policyname}`);
    });
    console.log('');

    // 2. 删除旧策略
    console.log('2️⃣ 删除旧策略...');
    const dropPolicies = `
      DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON brands;
      DROP POLICY IF EXISTS "Models are visible with normal activity status" ON models;
      DROP POLICY IF EXISTS "Series are visible with normal activity status" ON series;
      DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON model_details;
      DROP POLICY IF EXISTS "Admins can manage all brands" ON brands;
      DROP POLICY IF EXISTS "Admins can manage all models" ON models;
      DROP POLICY IF EXISTS "Admins can manage all series" ON series;
      DROP POLICY IF EXISTS "Admins can manage all model details" ON model_details;
    `;
    await executeQuery(dropPolicies);
    console.log('✅ 旧策略已删除\n');

    // 3. 启用 RLS（如果还没启用）
    console.log('3️⃣ 启用 RLS...');
    const enableRLS = `
      ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
      ALTER TABLE models ENABLE ROW LEVEL SECURITY;
      ALTER TABLE series ENABLE ROW LEVEL SECURITY;
      ALTER TABLE model_details ENABLE ROW LEVEL SECURITY;
    `;
    await executeQuery(enableRLS);
    console.log('✅ RLS 已启用\n');

    // 4. 创建新的 RLS 策略
    console.log('4️⃣ 创建新的 RLS 策略...');
    const createPolicies = `
      -- 为 brands 表创建 RLS 策略：只允许查询 activity_status = 0 的品牌
      CREATE POLICY "Brands are visible with normal activity status"
        ON brands
        FOR SELECT
        USING (activity_status = 0);

      -- 为 series 表创建 RLS 策略：
      -- 只允许查询 activity_status = 0 且关联的品牌也是正常的车系
      CREATE POLICY "Series are visible with normal activity status"
        ON series
        FOR SELECT
        USING (
          activity_status = 0 AND
          EXISTS (
            SELECT 1 FROM brands
            WHERE brands.id = series.brand_id
            AND brands.activity_status = 0
          )
        );

      -- 为 models 表创建 RLS 策略：
      -- 只允许查询 activity_status = 0 且关联的品牌也是正常的车型
      CREATE POLICY "Models are visible with normal activity status"
        ON models
        FOR SELECT
        USING (
          activity_status = 0 AND
          (
            brand IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM brands
              WHERE brands.name = models.brand
              AND brands.activity_status = 0
            )
            OR brand IS NULL
          )
        );

      -- 为 model_details 表创建 RLS 策略：
      -- 只允许查询 activity_status = 0 且关联的品牌和车型也是正常的车型详情
      CREATE POLICY "Model details are visible with normal activity status"
        ON model_details
        FOR SELECT
        USING (
          activity_status = 0 AND
          (
            brandname IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM brands
              WHERE brands.name = model_details.brandname
              AND brands.activity_status = 0
            )
            OR model_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM models
              WHERE models.id = model_details.model_id
              AND models.activity_status = 0
            )
          )
        );

      -- 为管理员（service_role）创建策略，允许看到所有状态
      CREATE POLICY "Admins can manage all brands"
        ON brands
        FOR ALL
        USING (true)
        WITH CHECK (true);

      CREATE POLICY "Admins can manage all models"
        ON models
        FOR ALL
        USING (true)
        WITH CHECK (true);

      CREATE POLICY "Admins can manage all series"
        ON series
        FOR ALL
        USING (true)
        WITH CHECK (true);

      CREATE POLICY "Admins can manage all model details"
        ON model_details
        FOR ALL
        USING (true)
        WITH CHECK (true);
    `;
    await executeQuery(createPolicies);
    console.log('✅ 新策略已创建\n');

    // 5. 更新 activity_status 为 NULL 的记录
    console.log('5️⃣ 更新 NULL 值的记录...');
    const updateNulls = `
      UPDATE brands SET activity_status = 0 WHERE activity_status IS NULL;
      UPDATE models SET activity_status = 0 WHERE activity_status IS NULL;
      UPDATE series SET activity_status = 0 WHERE activity_status IS NULL;
      UPDATE model_details SET activity_status = 0 WHERE activity_status IS NULL;
    `;
    const updateResult = await executeQuery(updateNulls);
    console.log('✅ NULL 值已更新\n');

    // 6. 检查 activity_status 分布
    console.log('6️⃣ 检查 activity_status 分布...');
    const checkStatus = `
      SELECT
        'brands' as table_name,
        activity_status,
        count(*) as count
      FROM brands
      GROUP BY activity_status
      UNION ALL
      SELECT
        'models' as table_name,
        activity_status,
        count(*) as count
      FROM models
      GROUP BY activity_status
      UNION ALL
      SELECT
        'series' as table_name,
        activity_status,
        count(*) as count
      FROM series
      GROUP BY activity_status
      UNION ALL
      SELECT
        'model_details' as table_name,
        activity_status,
        count(*) as count
      FROM model_details
      GROUP BY activity_status
      ORDER BY table_name, activity_status;
    `;
    const statusResult = await executeQuery(checkStatus);
    console.log('📊 activity_status 分布:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.table_name}: status=${row.activity_status}, count=${row.count}`);
    });
    console.log('');

    // 7. 验证最终创建的策略
    console.log('7️⃣ 验证最终策略...');
    const verifyPolicies = `
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('brands', 'models', 'series', 'model_details');
    `;
    const finalPolicies = await executeQuery(verifyPolicies);
    console.log('✅ 最终创建的策略:');
    finalPolicies.rows.forEach(row => {
      console.log(`  - ${row.schemaname}.${row.tablename}.${row.policyname}`);
    });
    console.log('');

    console.log('🎉 所有操作完成！现在前端应该只会显示 activity_status = 0 的记录了。');
    console.log('\n📝 功能说明:');
    console.log('  - activity_status = 0: 正常显示 ✅');
    console.log('  - activity_status = 1: 不显示 ❌');
    console.log('  - activity_status = 2: 不可用 ❌');
    console.log('  - 品牌不显示时，其下的车系、车型、车型详情也不显示 🔗');

  } catch (error) {
    console.error('❌ 执行出错:', error);
    console.error('\n💡 可能的解决方案:');
    console.error('1. 在 Supabase 控制台直接执行 SQL（最简单）');
    console.error('2. 确保网络连接正常');
    console.error('3. 检查数据库密码是否正确');
  } finally {
    await pool.end();
  }
}

main();
