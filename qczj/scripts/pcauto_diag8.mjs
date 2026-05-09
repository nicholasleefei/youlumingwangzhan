import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  console.log('=== 深入分析太平洋汽车网图片加载 ===\n')
  
  // 1. 尝试使用完整的浏览器User-Agent
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  }
  
  const seriesUrl = 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html'
  console.log('1. 测试完整浏览器Headers:')
  try {
    const res = await fetch(seriesUrl, { timeout: 15000, headers })
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    
    // 查找图片列表
    const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
    const imgUrls = text.match(/#src="([^"]+)"/gi) || []
    const dataSrcs = text.match(/data-src="([^"]+)"/gi) || []
    
    console.log(`  Status: ${res.status}`)
    console.log(`  Li标签: ${liTags.length}`)
    console.log(`  #src图片: ${imgUrls.length}`)
    console.log(`  data-src图片: ${dataSrcs.length}`)
    
    if (imgUrls.length > 0) {
      console.log(`  示例: ${imgUrls[0]}`)
    }
    
    // 显示页面中是否有JavaScript动态加载的内容
    const jsBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
    for (let i = 0; i < jsBlocks.length; i++) {
      const content = jsBlocks[i]
      if (content.includes('JList') && content.includes('innerHTML')) {
        console.log(`\n  Script ${i} 包含innerHTML:`)
        console.log(content)
      }
    }
    
  } catch (e) {
    console.log(`  Error: ${e.message}`)
  }
  
  // 2. 尝试使用不同的URL格式
  console.log('\n\n2. 测试不同的URL格式:')
  
  const urlFormats = [
    'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html',
    'https://price.pcauto.com.cn/cars/imglist/sg4550-2-o1.html',  // 使用sgId
    'https://price.pcauto.com.cn/cars/imglist/sg4550-o1.html',
    'https://price.pcauto.com.cn/cars/imglist/m127230-o1.html',
  ]
  
  for (const url of urlFormats) {
    try {
      const res = await fetch(url, { timeout: 10000, headers: { 'User-Agent': headers['User-Agent'] } })
      const buf = Buffer.from(await res.arrayBuffer())
      const text = iconv.decode(buf, 'gbk')
      
      const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
      const imgUrls = text.match(/#src="([^"]+)"/gi) || []
      
      console.log(`  ${url}`)
      console.log(`    Status: ${res.status}, Li: ${liTags.length}, #src: ${imgUrls.length}`)
    } catch (e) {
      console.log(`  ${url}: ${e.message}`)
    }
  }
  
  // 3. 测试搜索到的URL - 从之前的搜索结果
  console.log('\n\n3. 测试搜索到的图片URL:')
  
  const testImgUrls = [
    'https://img.pconline.com.cn/images/upload/upc/tx/auto5/1404/29/c12/33685436_1398741613379_180x135.jpg',
    'https://img.pconline.com.cn/images/upload/upc/tx/auto5/1404/29/c12/33685436_1398741613379.jpg',  // 去掉尺寸后缀
    'https://img.pconline.com.cn/images/upload/upc/tx/auto5/1404/29/c12/33685436_1398741613379_800x600.jpg',  // 更大尺寸
  ]
  
  for (const url of testImgUrls) {
    try {
      const res = await fetch(url, { timeout: 5000, method: 'HEAD' })
      console.log(`  ${url}`)
      console.log(`    Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`)
    } catch (e) {
      console.log(`  ${url}: ${e.message}`)
    }
  }
  
  // 4. 检查是否有JSON API
  console.log('\n\n4. 测试JSON API:')
  
  const jsonUrls = [
    'https://price.pcauto.com.cn/cars/imglist/json/m127230-2.json',
    'https://price.pcauto.com.cn/cars/imglist/data/m127230-2.json',
    'https://price.pcauto.com.cn/json/pic/m127230-2.json',
    'https://price.pcauto.com.cn/api/pic/m127230-2',
  ]
  
  for (const url of jsonUrls) {
    try {
      const res = await fetch(url, { timeout: 5000, headers: { 'User-Agent': headers['User-Agent'] } })
      console.log(`  ${url}`)
      console.log(`    Status: ${res.status}`)
      if (res.status === 200) {
        const text = await res.text()
        console.log(`    Size: ${text.length}`)
        console.log(`    Preview: ${text.substring(0, 200)}`)
      }
    } catch (e) {
      console.log(`  ${url}: ${e.message}`)
    }
  }
  
  // 5. 测试PCauto的API
  console.log('\n\n5. 测试PCauto官方API:')
  
  const pcautoApis = [
    'https://www.pcauto.com.cn/ajax/picList?seriesId=127230&type=2',
    'https://www.pcauto.com.cn/api/pic/list?seriesId=127230&type=2',
    'https://www.pcauto.com.cn/v2/pic/list?seriesId=127230&type=2',
  ]
  
  for (const url of pcautoApis) {
    try {
      const res = await fetch(url, { timeout: 5000, headers: { 'User-Agent': headers['User-Agent'], 'Referer': 'https://www.pcauto.com.cn/' } })
      console.log(`  ${url}`)
      console.log(`    Status: ${res.status}`)
      if (res.status === 200) {
        const text = await res.text()
        console.log(`    Size: ${text.length}`)
        console.log(`    Preview: ${text.substring(0, 200)}`)
      }
    } catch (e) {
      console.log(`  ${url}: ${e.message}`)
    }
  }
  
  // 6. 检查移动端页面是否有更多数据
  console.log('\n\n6. 测试移动端页面:')
  
  const mobileUrl = 'https://m.pcauto.com.cn/auto/pic/m127230-2.html'
  try {
    const res = await fetch(mobileUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      }
    })
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    
    console.log(`  Status: ${res.status}`)
    console.log(`  Size: ${text.length}`)
    
    // 查找图片URL
    const imgUrls = text.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png)/gi) || []
    console.log(`  图片URL: ${imgUrls.length}`)
    for (const url of imgUrls.slice(0, 5)) {
      console.log(`    ${url}`)
    }
    
    // 查找API调用
    const apiCalls = text.match(/(?:api|ajax|json)[^"'\s]*\/[^"'\s]+/gi) || []
    console.log(`  API调用: ${apiCalls.slice(0, 5).join(', ')}`)
    
  } catch (e) {
    console.log(`  Error: ${e.message}`)
  }
}

test().catch(console.error)
