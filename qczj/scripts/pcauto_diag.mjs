import fetch from 'node-fetch'

async function test() {
  // 测试太平洋汽车网图片列表页面
  // m127230 是凯美瑞的车系ID
  const seriesUrl = 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html'
  console.log('=== 太平洋汽车网图片列表页面 ===\n')
  
  try {
    const res = await fetch(seriesUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      }
    })
    
    console.log(`Status: ${res.status}`)
    console.log(`Content-Type: ${res.headers.get('content-type')}`)
    
    const buf = Buffer.from(await res.arrayBuffer())
    const text = buf.toString('utf-8')
    console.log(`Page size: ${text.length}`)
    
    // 查找图片URL
    const imgUrls = text.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif)(?:\?[^"'\s]*)?/gi) || []
    const uniqueUrls = [...new Set(imgUrls)]
    console.log(`\n图片URL数量: ${uniqueUrls.length}`)
    if (uniqueUrls.length > 0) {
      console.log('示例图片URL:')
      for (const url of uniqueUrls.slice(0, 10)) {
        console.log(`  ${url}`)
      }
    }
    
    // 查找VR相关链接
    const vrUrls = text.match(/https?:\/\/[^"'\s]*vr[^"'\s]*/gi) || []
    console.log(`\nVR相关URL: ${vrUrls.length}`)
    for (const url of [...new Set(vrUrls)].slice(0, 10)) {
      console.log(`  ${url}`)
    }
    
    // 查找车系/车型ID
    const carIds = text.match(/m\d+/g) || []
    console.log(`\n车型ID (m开头的数字): ${[...new Set(carIds)].slice(0, 10).join(', ')}`)
    
    // 查找API接口
    const apiUrls = text.match(/https?:\/\/[^"'\s]*api[^"'\s]*/gi) || []
    console.log(`\nAPI URL: ${[...new Set(apiUrls)].slice(0, 10).join(', ')}`)
    
    // 查找JSON数据
    const jsonMatches = text.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi) || []
    console.log(`\nJSON数据块: ${jsonMatches.length}`)
    
    // 查找所有script标签
    const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
    console.log(`\nScript标签: ${scriptBlocks.length}`)
    
    // 查找包含数据的script
    for (let i = 0; i < scriptBlocks.length; i++) {
      const content = scriptBlocks[i]
      if (content.includes('picList') || content.includes('imageList') || content.includes('imgList') || content.includes('photo')) {
        console.log(`\nScript ${i} 包含图片数据:`)
        console.log(content.substring(0, 500))
        break
      }
    }
    
    // 查找分类导航
    const categoryPatterns = text.match(/图片分类|外观|内饰|细节|VR看车/gi) || []
    console.log(`\n页面包含: ${[...new Set(categoryPatterns)].join(', ')}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试另一个URL格式 - 外观图片
  console.log('\n\n=== 测试外观图片页面 ===\n')
  const exteriorUrl = 'https://price.pcauto.com.cn/auto/pic/sg10590-o1-1-1.html'
  try {
    const res = await fetch(exteriorUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    console.log(`Status: ${res.status}`)
    
    const buf = Buffer.from(await res.arrayBuffer())
    const text = buf.toString('utf-8')
    console.log(`Page size: ${text.length}`)
    
    // 查找图片URL
    const imgUrls = text.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif)(?:\?[^"'\s]*)?/gi) || []
    console.log(`图片URL数量: ${imgUrls.length}`)
    
    // 查找pcauto的图片CDN
    const pcautoImgs = imgUrls.filter(u => u.includes('pcauto') || u.includes('pconline'))
    console.log(`太平洋CDN图片: ${pcautoImgs.length}`)
    for (const url of pcautoImgs.slice(0, 5)) {
      console.log(`  ${url}`)
    }
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试VR页面
  console.log('\n\n=== 测试VR看车页面 ===\n')
  const vrUrl = 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html'
  try {
    const res = await fetch(vrUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    const buf = Buffer.from(await res.arrayBuffer())
    const text = buf.toString('utf-8')
    
    // 查找VR相关
    const vrLinks = text.match(/vr[^"'\s<>]*/gi) || []
    console.log(`VR关键词: ${[...new Set(vrLinks)].slice(0, 10).join(', ')}`)
    
    // 查找360相关
    const links360 = text.match(/360[^"'\s<>]*/gi) || []
    console.log(`360关键词: ${[...new Set(links360)].slice(0, 10).join(', ')}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
}

test().catch(console.error)
