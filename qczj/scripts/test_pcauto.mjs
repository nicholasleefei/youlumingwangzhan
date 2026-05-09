import fetch from 'node-fetch'

async function test() {
  // 测试创建任务
  console.log('测试创建太平洋汽车网任务...\n')
  
  try {
    const res = await fetch('http://localhost:22000/api/pcauto/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sgId: '3836', seriesName: '汉兰达' }),
    })
    
    console.log(`Status: ${res.status}`)
    const json = await res.json()
    console.log('Response:', JSON.stringify(json, null, 2))
    
    if (json.success && json.jobId) {
      console.log(`\n任务创建成功，jobId: ${json.jobId}`)
      
      // 测试获取状态
      console.log('\n测试获取任务状态...')
      await new Promise(r => setTimeout(r, 2000))
      
      const statusRes = await fetch(`http://localhost:22000/api/pcauto/status/${json.jobId}`)
      const statusJson = await statusRes.json()
      console.log('Status:', JSON.stringify(statusJson, null, 2))
    }
  } catch (e) {
    console.error('Error:', e.message)
  }
}

test()
