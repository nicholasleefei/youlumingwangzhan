
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpksqkhgfqekysbebznv.supabase.co";
const supabaseKey = "sb_publishable_892LcV3CEiGKcwXw0q-jqw_KqdHobH8";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingPolicies() {
  console.log('🔍 检查现有策略...');

  try {
    // 通过查询各表的数据来间接验证 RLS 是否生效
    const tables = ['brands', 'models', 'series', 'model_details'];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`❌ ${table} 表查询失败:`, error.message);
        } else {
          console.log(`✅ ${table}: ${count} 条记录`);
        }
      } catch (err) {
        console.error(`❌ ${table} 表查询异常:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ 检查策略过程中出错:', error);
  }
}

async function updateActivityStatusValues() {
  console.log('\n🔄 更新 NULL 值的记录...');

  const tables = ['brands', 'models', 'series', 'model_details'];
  let successCount = 0;

  for (const table of tables) {
    try {
      // 先检查有多少 NULL 值
      const { data: nullData, error: nullError } = await supabase
        .from(table)
        .select('id')
        .is('activity_status', null);

      if (nullError) {
        console.error(`❌ ${table} 查询 NULL 值失败:`, nullError.message);
        continue;
      }

      const nullCount = nullData?.length || 0;

      if (nullCount > 0) {
        console.log(`⚠️  ${table}: ${nullCount} 条记录的 activity_status 为 NULL`);

        // 更新这些记录
        const { error: updateError } = await supabase
          .from(table)
          .update({ activity_status: 0 })
          .is('activity_status', null);

        if (updateError) {
          console.error(`❌ ${table} 更新失败:`, updateError.message);
        } else {
          console.log(`✅ ${table}: 更新了 ${nullCount} 条 NULL 记录`);
          successCount++;
        }
      } else {
        console.log(`✅ ${table}: 没有 NULL 值记录`);
        successCount++;
      }

    } catch (err) {
      console.error(`❌ ${table} 更新过程中出错:`, err.message);
    }
  }

  console.log(`\n✅ NULL 值更新完成 (${successCount}/${tables.length} 个表)`);
}

async function testActivityStatusFiltering() {
  console.log('\n🧪 测试 activity_status 筛选...');

  const tables = ['brands', 'models', 'series', 'model_details'];

  for (const table of tables) {
    try {
      // 查询所有状态的记录
      const { data: allData, error: allError } = await supabase
        .from(table)
        .select('id, activity_status')
        .limit(20);

      if (allError) {
        console.error(`❌ ${table} 查询失败:`, allError.message);
        continue;
      }

      // 统计各状态的数量
      const statusCounts = {};
      allData?.forEach(item => {
        const status = item.activity_status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log(`📊 ${table} 各状态数量:`, statusCounts);

      // 测试筛选 activity_status = 0
      const { count: activeCount, error: activeError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('activity_status', 0);

      if (!activeError) {
        console.log(`   正常状态记录: ${activeCount} 条`);
      }

    } catch (err) {
      console.error(`❌ ${table} 测试筛选出错:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 开始验证和配置数据库...');

  // 1. 检查现有策略（通过查询数据）
  await checkExistingPolicies();

  // 2. 更新 NULL 值
  await updateActivityStatusValues();

  // 3. 测试 activity_status 筛选
  await testActivityStatusFiltering();

  console.log('\n🎉 验证完成！');

  console.log('\n📝 下一步操作:');
  console.log('1. 请直接在 Supabase SQL 编辑器中执行 RLS 策略');
  console.log('   文件位置: migrations/apply_rls_policies.sql');
  console.log('   访问地址: https://supabase.com/dashboard/project/xpksqkhgfqekysbebznv/sql');
  console.log('\n2. 策略应用后，重新运行此脚本验证是否生效');
}

main();
