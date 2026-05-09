import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  const seriesUrl = 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html'
  console.log('=== 分析懒加载JavaScript完整代码 ===\n')
  
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
    
    // 1. 提取完整的Script 9内容
    const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
    for (let i = 0; i < scriptBlocks.length; i++) {
      const content = scriptBlocks[i]
      if (content.includes('Lazy') && content.includes('imgList')) {
        console.log(`=== Script ${i} 完整内容 ===`)
        console.log(content)
        break
      }
    }
    
    // 2. 查找初始化懒加载的代码
    const initCodes = text.match(/Lazy\.create\([^)]+\)/gi) || []
    console.log(`\n\nLazy.create调用: ${initCodes.length}`)
    for (const code of initCodes) {
      console.log(code)
    }
    
    // 3. 查找图片容器内容
    const listContent = text.match(/<ul[^>]*id="[^"]*List"[^>]*>([\s\S]*?)<\/ul>/gi) || []
    console.log(`\n\n列表容器内容: ${listContent.length}`)
    if (listContent.length > 0) {
      console.log(listContent[0].substring(0, 2000))
    }
    
    // 4. 查找所有li标签
    const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
    console.log(`\n\nLi标签数量: ${liTags.length}`)
    if (liTags.length > 0) {
      console.log('第一个Li标签:')
      console.log(liTags[0])
    }
    
    // 5. 查找img标签
    const imgTags = text.match(/<img[^>]*>/gi) || []
    console.log(`\n\nImg标签数量: ${imgTags.length}`)
    for (const img of imgTags.slice(0, 5)) {
      console.log(img)
    }
    
    // 6. 查找外部JS文件
    const jsFiles = text.match(/src="([^"]*\.js[^"]*)"/gi) || []
    console.log(`\n\n外部JS文件: ${jsFiles.length}`)
    for (const js of jsFiles) {
      console.log(js)
    }
    
    // 7. 查找Ajax请求
    const ajaxRequests = text.match(/\$\.(?:get|post|ajax|getJSON)\s*\([^)]+\)/gi) || []
    console.log(`\n\nAjax请求: ${ajaxRequests.length}`)
    for (const req of ajaxRequests) {
      console.log(req.substring(0, 200))
    }
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试加载外部JS文件
  console.log('\n\n=== 测试懒加载JS文件 ===\n')
  
  const jsUrls = [
    'https://js.3conline.com/pcautonew1/pc/2017/price/js/pc_nzhd.js',
    'https://js.3conline.com/min/temp/v1/dpl-related_select_v2.js',
  ]
  
  for (const url of jsUrls) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      })
      const text = await res.text()
      console.log(`${url}`)
      console.log(`  Status: ${res.status}, Size: ${text.length}`)
      
      if (text.includes('picList') || text.includes('imgList') || text.includes('pconline')) {
        console.log('  包含图片相关代码!')
        const picCode = text.match(/pic\w*\s*[:=]/gi) || []
        console.log(`  图片相关: ${picCode.slice(0, 3).join(', ')}`)
      }
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 测试不同的页面格式
  console.log('\n\n=== 测试不同页面格式 ===\n')
  
  const pageUrls = [
    'https://price.pcauto.com.cn/cars/imglist/m127230-o1.html',
    'https://price.pcauto.com.cn/cars/imglist/m127230-2.html',
    'https://price.pcauto.com.cn/cars/imglist/m127230.html',
  ]
  
  for (const url of pageUrls) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      })
      const buf = Buffer.from(await res.arrayBuffer())
      const text = iconv.decode(buf, 'gbk')
      
      const imgUrls = text.match(/#src="([^"]+)"/gi) || []
      const lazyImgs = text.match(/trueSrc="([^"]+)"/gi) || []
      
      console.log(`${url}`)
      console.log(`  Status: ${res.status}, 懒加载图片=${imgUrls.length}, trueSrc=${lazyImgs.length}`)
      
      if (imgUrls.length > 0) {
        console.log(`  示例: ${imgUrls[0]}`)
      }
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
}

test().catch(console.error)
