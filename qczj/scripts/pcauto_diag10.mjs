import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  console.log('=== 提取太平洋汽车网图片URL ===\n')
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9',
  }
  
  // 测试提取图片URL
  const url = 'https://price.pcauto.com.cn/cars/imglist/sg4550-2-o1.html'  // 内饰
  try {
    const res = await fetch(url, { timeout: 15000, headers })
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    
    // 提取data-src图片URL
    const dataSrcs = text.match(/data-src="(https?:\/\/img\.pcauto\.com\.cn[^"]+)"/gi) || []
    console.log(`data-src图片URL: ${dataSrcs.length}`)
    
    // 提取唯一URL
    const uniqueUrls = [...new Set(dataSrcs.map(s => s.match(/data-src="([^"]+)"/)?.[1]).filter(Boolean))]
    console.log(`唯一图片URL: ${uniqueUrls.length}`)
    
    // 显示示例
    console.log('\n示例图片URL:')
    for (const url of uniqueUrls.slice(0, 10)) {
      console.log(`  ${url}`)
    }
    
    // 提取车型信息
    const specNames = text.match(/title="([^"]+)"/gi) || []
    const uniqueSpecs = [...new Set(specNames.map(s => s.match(/title="([^"]+)"/)?.[1]).filter(Boolean))]
    console.log(`\n车型数量: ${uniqueSpecs.length}`)
    console.log('示例车型:')
    for (const spec of uniqueSpecs.slice(0, 5)) {
      console.log(`  ${spec}`)
    }
    
    // 提取图片链接
    const picLinks = text.match(/href="(\/auto\/pic\/[^"]+)"/gi) || []
    const uniqueLinks = [...new Set(picLinks.map(l => l.match(/href="(\/auto\/pic\/[^"]+)"/)?.[1]).filter(Boolean))]
    console.log(`\n图片详情链接: ${uniqueLinks.length}`)
    for (const link of uniqueLinks.slice(0, 5)) {
      console.log(`  ${link}`)
    }
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试官图分类
  console.log('\n\n=== 测试官图分类 ===\n')
  
  // 官图的分类ID可能是7或其他
  const officialUrls = [
    'https://price.pcauto.com.cn/cars/imglist/sg4550-7-o1.html',  // 官图？
    'https://price.pcauto.com.cn/cars/imglist/sg4550-5-o1.html',  // 座椅？
    'https://price.pcauto.com.cn/cars/imglist/sg4550-6-o1.html',  // 细节？
  ]
  
  for (const url of officialUrls) {
    try {
      const res = await fetch(url, { timeout: 10000, headers })
      const buf = Buffer.from(await res.arrayBuffer())
      const text = iconv.decode(buf, 'gbk')
      
      const dataSrcs = text.match(/data-src="(https?:\/\/img\.pcauto\.com\.cn[^"]+)"/gi) || []
      const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
      
      console.log(`${url}`)
      console.log(`  Li: ${liTags.length}, 图片: ${dataSrcs.length}`)
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 测试VR页面
  console.log('\n\n=== 测试VR页面 ===\n')
  
  const vrUrls = [
    'https://price.pcauto.com.cn/cars/imglist/sg4550-8-o1.html',  // VR？
    'https://price.pcauto.com.cn/cars/vr/sg4550.html',
    'https://price.pcauto.com.cn/cars/vr/m127230.html',
  ]
  
  for (const url of vrUrls) {
    try {
      const res = await fetch(url, { timeout: 10000, headers })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}`)
      if (res.status === 200) {
        const buf = Buffer.from(await res.arrayBuffer())
        const text = iconv.decode(buf, 'gbk')
        
        // 查找VR相关
        const vrUrls = text.match(/pano[^"'\s]*/gi) || []
        const vr360Urls = text.match(/360[^"'\s]*/gi) || []
        
        console.log(`  VR关键词: ${vrUrls.length}, 360: ${vr360Urls.length}`)
        
        // 查找图片
        const dataSrcs = text.match(/data-src="(https?:\/\/img\.pcauto\.com\.cn[^"]+)"/gi) || []
        console.log(`  图片: ${dataSrcs.length}`)
      }
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 分析图片URL格式，看看如何获取大图
  console.log('\n\n=== 分析图片URL格式 ===\n')
  
  const sampleUrls = [
    'https://img.pcauto.com.cn/images/upload/upc/tx/auto5/2508/12/c8/544796911_1754987963675_180x135.jpg',
    'https://img.pcauto.com.cn/images/upload/upc/tx/auto5/2508/12/c8/544796911_1754987963675.jpg',  // 去掉尺寸
  ]
  
  for (const url of sampleUrls) {
    try {
      const res = await fetch(url, { timeout: 5000, method: 'HEAD' })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}, Content-Length: ${res.headers.get('content-length')}`)
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 查找更大的图片尺寸
  console.log('\n\n=== 查找更大尺寸的图片 ===\n')
  
  const testUrl = 'https://price.pcauto.com.cn/cars/imglist/sg4550-1-o1.html'  // 外观
  try {
    const res = await fetch(testUrl, { timeout: 15000, headers })
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    
    // 查找所有图片URL并分析尺寸后缀
    const allImgUrls = text.match(/https?:\/\/img\.pcauto\.com\.cn[^"]+/gi) || []
    const uniqueUrls = [...new Set(allImgUrls)]
    
    console.log(`总图片URL: ${uniqueUrls.length}`)
    
    // 分析尺寸后缀
    const sizePatterns = uniqueUrls.map(u => {
      const match = u.match(/_(\d+)x(\d+)\.jpg$/i)
      return match ? { url: u, width: match[1], height: match[2] } : null
    }).filter(Boolean)
    
    console.log(`\n尺寸分布:`)
    const sizeCounts = {}
    for (const p of sizePatterns) {
      const key = `${p.width}x${p.height}`
      sizeCounts[key] = (sizeCounts[key] || 0) + 1
    }
    for (const [size, count] of Object.entries(sizeCounts)) {
      console.log(`  ${size}: ${count}`)
    }
    
    // 显示最大的图片URL
    console.log(`\n最大尺寸图片示例:`)
    const largest = sizePatterns.filter(p => Number(p.width) >= 800).slice(0, 3)
    for (const p of largest) {
      console.log(`  ${p.width}x${p.height}: ${p.url}`)
    }
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
}

test().catch(console.error)
