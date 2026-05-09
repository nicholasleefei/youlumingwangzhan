import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  // 获取完整的页面内容，分析数据加载逻辑
  const seriesUrl = 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html'
  console.log('=== 查找图片数据来源 ===\n')
  
  try {
    const res = await fetch(seriesUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      }
    })
    
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    
    // 1. 查找所有script内容
    const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
    console.log(`Script标签数量: ${scriptBlocks.length}`)
    
    // 2. 查找所有包含数据加载的script
    for (let i = 0; i < scriptBlocks.length; i++) {
      const content = scriptBlocks[i]
      if (content.includes('JList') || content.includes('innerHTML') || content.includes('appendChild') || content.includes('html(')) {
        console.log(`\n=== Script ${i} 包含数据加载 ===`)
        console.log(content)
        console.log('---')
      }
    }
    
    // 3. 查找外部JS文件中可能的数据加载
    const jsFiles = text.match(/src="([^"]+\.js[^"]*)"/gi) || []
    console.log(`\n\n外部JS文件:`)
    for (const js of jsFiles) {
      console.log(`  ${js}`)
    }
    
    // 4. 加载主要的JS文件来分析
    const mainJsUrl = 'https://js.3conline.com/pcautonew1/pc/2017/price/js/pc_nzhd.js'
    console.log(`\n\n=== 分析主JS文件 ===`)
    try {
      const jsRes = await fetch(mainJsUrl, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } })
      const jsText = await jsRes.text()
      console.log(`Status: ${jsRes.status}, Size: ${jsText.length}`)
      
      // 查找数据加载相关代码
      if (jsText.includes('JList') || jsText.includes('picList')) {
        console.log('包含JList或picList!')
        console.log(jsText)
      }
    } catch (e) {
      console.log(`JS加载失败: ${e.message}`)
    }
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试API端点
  console.log('\n\n=== 测试太平洋汽车网API ===\n')
  
  const apiUrls = [
    // 尝试不同的API格式
    'https://price.pcauto.com.cn/cars/ajax/picList?seriesId=m127230&type=2',
    'https://price.pcauto.com.cn/cars/ajax/getPicList?id=m127230&type=2',
    'https://price.pcauto.com.cn/ajax/cars/picList?seriesId=m127230&type=2',
    'https://price.pcauto.com.cn/cars/pic/list?seriesId=m127230&type=2',
    'https://price.pcauto.com.cn/cars/imglist/ajax?seriesId=m127230&type=2',
  ]
  
  for (const url of apiUrls) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://price.pcauto.com.cn/',
          'X-Requested-With': 'XMLHttpRequest',
        }
      })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}`)
      if (res.status === 200) {
        const text = await res.text()
        console.log(`  Size: ${text.length}`)
        console.log(`  Preview: ${text.substring(0, 300)}`)
      }
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 尝试查找PC端的图片页面
  console.log('\n\n=== 测试PC端图片页面 ===\n')
  
  const pcUrls = [
    'https://www.pcauto.com.cn/series/127230/pic/',
    'https://www.pcauto.com.cn/series/m127230/pic/',
    'https://www.pcauto.com.cn/series/127230/',
    'https://www.pcauto.com.cn/127230/pic/',
  ]
  
  for (const url of pcUrls) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}`)
      if (res.status === 200) {
        const buf = Buffer.from(await res.arrayBuffer())
        const text = iconv.decode(buf, 'utf-8')
        console.log(`  Size: ${text.length}`)
        
        // 查找图片URL
        const imgUrls = text.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png)(?:\?[^"'\s<>]*)?/gi) || []
        console.log(`  图片URL: ${imgUrls.length}`)
        if (imgUrls.length > 0) {
          console.log(`  示例: ${imgUrls[0]}`)
        }
      }
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 测试移动端API
  console.log('\n\n=== 测试移动端API ===\n')
  
  const mobileUrls = [
    'https://m.pcauto.com.cn/auto/pic/m127230-2.html',
    'https://m.pcauto.com.cn/auto/pic/list/m127230/2/',
  ]
  
  for (const url of mobileUrls) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        }
      })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}`)
      if (res.status === 200) {
        const buf = Buffer.from(await res.arrayBuffer())
        const text = iconv.decode(buf, 'gbk')
        console.log(`  Size: ${text.length}`)
        
        // 查找图片URL
        const imgUrls = text.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png)/gi) || []
        console.log(`  图片URL: ${imgUrls.length}`)
        if (imgUrls.length > 0) {
          console.log(`  示例: ${imgUrls[0]}`)
        }
      }
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
}

test().catch(console.error)
