import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  // 测试太平洋汽车网图片列表页面 - 使用GBK编码
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
    // 太平洋汽车网使用GBK编码
    const text = iconv.decode(buf, 'gbk')
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
    console.log(`\n车型ID: ${[...new Set(carIds)].slice(0, 10).join(', ')}`)
    
    // 查找所有script标签
    const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
    console.log(`\nScript标签数量: ${scriptBlocks.length}`)
    
    // 查找包含图片数据的script
    for (let i = 0; i < scriptBlocks.length; i++) {
      const content = scriptBlocks[i]
      if (content.includes('picList') || content.includes('imageList') || content.includes('imgList') || content.includes('photo')) {
        console.log(`\nScript ${i} 包含图片数据:`)
        console.log(content.substring(0, 800))
        break
      }
    }
    
    // 查找分类导航
    const categoryPatterns = text.match(/图片分类|外观|内饰|细节|VR看车/gi) || []
    console.log(`\n页面包含: ${[...new Set(categoryPatterns)].join(', ')}`)
    
    // 查找分页信息
    const pagination = text.match(/页|共\d+张/g) || []
    console.log(`分页信息: ${[...new Set(pagination)].slice(0, 5).join(', ')}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试外观图片页面
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
    const text = iconv.decode(buf, 'gbk')
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
    
    // 查找数据结构
    const jsonPatterns = text.match(/var\s+\w+\s*=\s*(\{[^;]+\}|\[[\s\S]*?\]);/g) || []
    console.log(`\nJS变量: ${jsonPatterns.slice(0, 3).join('\n')}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
}

test().catch(console.error)
