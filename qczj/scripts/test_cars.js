/**
 * 10款车测试脚本
 * 逐步测试，每款车测试完分析结果后再测试下一款
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { JobManager } from './api/jobs/jobManager.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')

// 10款测试车型
const TEST_CARS = [
  { name: '问界M6', seriesId: 8529 },
  { name: '凯美瑞', seriesId: 110 },
  { name: '汉兰达', seriesId: 4471 },
  { name: '宝马3系', seriesId: 164 },
  { name: '奔驰C级', seriesId: 2235 },
  { name: '大众途观L', seriesId: 3167 },
  { name: '本田CR-V', seriesId: 4828 },
  { name: 'RAV4荣放', seriesId: 770 },
  { name: '别克GL8', seriesId: 3448 },
  { name: '奥迪A4L', seriesId: 2712 },
]

const jobManager = new JobManager(dataDir)

async function waitForJob(jobId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      jobManager.offUpdate(jobId, listener)
      reject(new Error('Job timeout (30 min)'))
    }, 30 * 60 * 1000)

    const listener = (job) => {
      console.log(`  [${job.status}] stage=${job.stage} progress=${job.progress.done}/${job.progress.total}`)

      if (job.status === 'succeeded') {
        clearTimeout(timeout)
        jobManager.offUpdate(jobId, listener)
        resolve(job)
      } else if (job.status === 'failed') {
        clearTimeout(timeout)
        jobManager.offUpdate(jobId, listener)
        reject(new Error(`Job failed: ${job.errors[job.errors.length - 1]?.message || 'unknown'}`))
      }
    }

    jobManager.onUpdate(jobId, listener)
  })
}

async function testCar(car, index) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`测试 ${index + 1}/10: ${car.name} (seriesId=${car.seriesId})`)
  console.log('='.repeat(60))

  const job = jobManager.create(car.seriesId, { splitBySpec: false })
  console.log(`Job created: ${job.id}`)

  try {
    const result = await waitForJob(job.id)
    console.log(`\n✅ ${car.name} 测试成功`)
    console.log(`   输出目录: ${result.outputDirEffective}`)
    console.log(`   图片统计: 成功=${result.progress.success} 失败=${result.progress.failed}`)

    // 列出生成的文件
    const files = await jobManager.listWorkFiles(job.id)
    const categories = {}
    for (const f of files) {
      const parts = f.relPath.split('/')
      const cat = parts[0] || 'root'
      categories[cat] = (categories[cat] || 0) + 1
    }
    console.log(`   文件分布:`, categories)

    return { success: true, job: result }
  } catch (err) {
    console.error(`\n❌ ${car.name} 测试失败:`, err.message)
    const failedJob = jobManager.get(job.id)
    if (failedJob.errors.length > 0) {
      console.log('   错误详情:')
      for (const e of failedJob.errors.slice(-3)) {
        console.log(`     - [${e.at}] ${e.message}`)
      }
    }
    return { success: false, jobId: job.id, error: err.message }
  }
}

async function main() {
  console.log('开始10款车测试...')
  console.log('每款车测试完成后，分析日志再决定是否继续')

  const results = []

  for (let i = 0; i < TEST_CARS.length; i++) {
    const result = await testCar(TEST_CARS[i], i)
    results.push(result)

    console.log('\n' + '-'.repeat(60))
    console.log(`已完成 ${i + 1}/10 款车测试`)
    console.log('-'.repeat(60))

    // 打印汇总
    const passed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    console.log(`汇总: 通过=${passed} 失败=${failed}`)

    // 如果用户想继续测试下一款，可以在这里暂停
    if (i < TEST_CARS.length - 1) {
      console.log(`\n按Enter继续测试下一款 "${TEST_CARS[i + 1].name}"...`)
      // 如果是自动运行，去掉下面的 readline
      await new Promise(resolve => {
        process.stdout.write('')
        setTimeout(resolve, 100)
      })
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('全部测试完成!')
  console.log('='.repeat(60))

  for (const r of results) {
    const car = TEST_CARS.find((c, idx) => results[idx] === r)
    const carInfo = TEST_CARS[results.indexOf(r)]
    console.log(`  ${r.success ? '✅' : '❌'} ${carInfo.name}: ${r.success ? '通过' : r.error}`)
  }
}

main().catch(console.error)