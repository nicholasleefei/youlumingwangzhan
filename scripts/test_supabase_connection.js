
import { createClient } from '@supabase/supabase-js';

// 填入你提供的 URL 和 key
const supabaseUrl = "https://xpksqkhgfqekysbebznv.supabase.co";
const supabaseKey = "sb_publishable_892LcV3CEiGKcwXw0q-jqw_KqdHobH8";
const supabase = createClient(supabaseUrl, supabaseKey);

// 测试：查询一张表
async function getdata() {
  console.log('🚀 开始测试 Supabase 连接...');

  try {
    // 测试 admin_users 表
    console.log('\n🔍 查询 admin_users 表...');
    const { data: users, error: usersErr } = await supabase
      .from('admin_users')
      .select('*');

    if (usersErr) {
      console.error('❌ 查询 admin_users 表失败:', usersErr.message);
    } else {
      console.log(`✅ admin_users: ${users?.length || 0} 条记录`);
    }

    // 测试 brands 表
    console.log('\n🔍 查询 brands 表...');
    const { data: brands, error: brandsErr } = await supabase
      .from('brands')
      .select('id, name, activity_status')
      .limit(10);

    if (brandsErr) {
      console.error('❌ 查询 brands 表失败:', brandsErr.message);
    } else {
      console.log(`✅ brands: ${brands?.length || 0} 条记录（显示前 10 条）`);
      brands?.slice(0, 5).forEach(brand => {
        const status = brand.activity_status === 0 ? '正常' :
                       brand.activity_status === 1 ? '不显示' : '不可用';
        console.log(`  - ${brand.name} (ID: ${brand.id}, 状态: ${status})`);
      });
    }

    // 测试 models 表
    console.log('\n🔍 查询 models 表...');
    const { data: models, error: modelsErr } = await supabase
      .from('models')
      .select('id, name, activity_status')
      .limit(10);

    if (modelsErr) {
      console.error('❌ 查询 models 表失败:', modelsErr.message);
    } else {
      console.log(`✅ models: ${models?.length || 0} 条记录（显示前 10 条）`);
      models?.slice(0, 5).forEach(model => {
        const status = model.activity_status === 0 ? '正常' :
                       model.activity_status === 1 ? '不显示' : '不可用';
        console.log(`  - ${model.name} (ID: ${model.id}, 状态: ${status})`);
      });
    }

    // 检查 RLS 策略是否正常工作
    console.log('\n🔍 检查 RLS 策略...');
    const { data: policies, error: policiesErr } = await supabase
      .rpc('get_policies_for_tables', {
        p_tablenames: ['brands', 'models', 'series', 'model_details']
      });

    if (policiesErr) {
      console.error('❌ 获取策略信息失败:', policiesErr.message);
    } else {
      console.log(`✅ 已创建策略数量: ${policies?.length || 0}`);
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
    console.error('\n💡 可能的解决方案:');
    console.error('1. 检查网络连接是否正常');
    console.error('2. 验证 Supabase URL 和 key 是否正确');
    console.error('3. 确认表名是否存在');
    console.error('4. 检查 RLS 策略是否已正确应用');
  }
}

getdata();
