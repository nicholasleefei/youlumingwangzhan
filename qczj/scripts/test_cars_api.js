/**
 * 10款车测试脚本 - 通过API调用 (轮询方式)
 * 使用方法: node scripts/test_cars_api.js [car_index]
 *   - 不带参数: 测试所有10款车
 *   - 带参数: 只测试指定索引的车 (0-9)
 */

const API_BASE = 'http://localhost:22000/api'
const POLL_INTERVAL = 3000 // 3秒轮询一次

// 10款测试车型 (正确的seriesId)
const TEST_CARS = [
  { name: '问界M6', seriesId: 8529 },
  { name: '凯美瑞', seriesId: 110 },
  { name: '宝马3系', seriesId: 66 },
  { name: '奔驰C级', seriesId: 588 },
  { name: '大众途观L', seriesId: 4274 },
  { name: '本田CR-V', seriesId: 314 },
  { name: 'RAV4荣放', seriesId: 770 },
  { name: '别克GL8', seriesId: 166 },
  { name: '奥迪A4L', seriesId: 692 },
]

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, opts)
  const json = await res.json()

  if (!json.success) {
    throw new Error(`API error: ${json.error}`)
  }
  return json.data
}

async function createJob(seriesId) {
  return api('POST', '/jobs', { seriesId })
}

async function getJob(jobId) {
  return api('GET', `/jobs/${jobId}`)
}

async function waitForJob(jobId, onUpdate) {
  return new Promise((resolve, reject) => {
    let lastStage = ''
    let lastProgress = { done: 0, total: 0 }

    const timeout = setTimeout(() => {
      reject(new Error('Job timeout (30 min)'))
    }, 30 * 60 * 1000)

    const poll = async () => {
      try {
        const job = await getJob(jobId)

        // 只在状态变化时打印
        if (job.stage !== lastStage || job.progress.done !== lastProgress.done) {
          lastStage = job.stage
          lastProgress = { ...job.progress }
          onUpdate?.(job)
        }

        if (job.status === 'succeeded') {
          clearTimeout(timeout)
          resolve(job)
        } else if (job.status === 'failed') {
          clearTimeout(timeout)
          reject(new Error(`Job failed: ${job.errors[job.errors.length - 1]?.message || 'unknown'}`))
        } else {
          // 继续轮询
          setTimeout(poll, POLL_INTERVAL)
        }
      } catch (e) {
        clearTimeout(timeout)
        reject(e)
      }
    }

    // 开始轮询
    setTimeout(poll, POLL_INTERVAL)
  })
}

async function testCar(car, index) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`测试 ${index + 1}/10: ${car.name} (seriesId=${car.seriesId})`)
  console.log('='.repeat(60))

  console.log('创建任务...')
  const { jobId } = await createJob(car.seriesId)
  console.log(`Job ID: ${jobId}`)

  const job = await waitForJob(jobId, (j) => {
    const pct = j.progress.total > 0 ? Math.round(j.progress.done / j.progress.total * 100) : 0
    console.log(`  [${j.status}] stage=${j.stage} (${pct}%) done=${j.progress.done}/${j.progress.total}`)
  })

  console.log(`\n✅ ${car.name} 测试成功`)
  console.log(`   输出目录: ${job.outputDirEffective}`)
  console.log(`   图片统计: 成功=${job.progress.success} 失败=${job.progress.failed}`)

  return { success: true, job }
}

async function testCarSafe(car, index) {
  try {
    return await testCar(car, index)
  } catch (err) {
    console.error(`\n❌ ${car.name} 测试失败:`, err.message)
    return { success: false, error: err.message }
  }
}

async function main() {
  const args = process.argv.slice(2)
  let indices = null

  if (args.length > 0) {
    const idx = parseInt(args[0])
    if (isNaN(idx) || idx < 0 || idx >= TEST_CARS.length) {
      console.error(`无效的车索引: ${args[0]}，有效范围: 0-${TEST_CARS.length - 1}`)
      process.exit(1)
    }
    indices = [idx]
  }

  console.log('='.repeat(60))
  console.log('10款车测试脚本')
  console.log('='.repeat(60))
  console.log('API: ' + API_BASE)

  // 先检查服务器是否可用
  try {
    await fetch(`${API_BASE}/health`)
    console.log('✅ 服务器连接正常\n')
  } catch (e) {
    console.error('❌ 无法连接到服务器，请先运行: npm run server:dev')
    console.error('   或双击运行: scripts\\start_server.bat')
    process.exit(1)
  }

  const carsToTest = indices !== null ? [TEST_CARS[indices[0]]] : TEST_CARS
  const startIndex = indices !== null ? indices[0] : 0

  const results = []

  for (let i = 0; i < carsToTest.length; i++) {
    const car = carsToTest[i]
    const globalIndex = startIndex + i
    const result = await testCarSafe(car, globalIndex)
    results.push({ ...result, car })

    console.log('\n' + '-'.repeat(60))
    console.log(`已完成 ${results.length}/${carsToTest.length} 款车测试`)
    console.log('-'.repeat(60))

    const passed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    console.log(`汇总: 通过=${passed} 失败=${failed}`)

    if (results.length < carsToTest.length) {
      console.log(`\n3秒后继续测试下一款...`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('测试完成!')
  console.log('='.repeat(60))

  for (const r of results) {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.car.name}: ${r.success ? '通过' : r.error}`)
  }
}

main().catch(console.error)
