import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  console.log('=== 分析sg4550页面（车系组级别）===\n')
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9',
  }
  
  // 测试全系图片列表（使用sgId）
  const sgUrl = 'https://price.pcauto.com.cn/cars/imglist/sg4550-o1.html'
  try {
    const res = await fetch(sgUrl, { timeout: 15000, headers })
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    
    console.log(`Status: ${res.status}, Size: ${text.length}`)
    
    // 1. 查找图片URL
    const imgUrls = text.match(/#src="([^"]+)"/gi) || []
    const dataSrcs = text.match(/data-src="([^"]+)"/gi) || []
    const srcs = text.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png))"/gi) || []
    
    console.log(`\n图片URL:`)
    console.log(`  #src: ${imgUrls.length}`)
    console.log(`  data-src: ${dataSrcs.length}`)
    console.log(`  src(绝对路径): ${srcs.length}`)
    
    // 2. 查找li标签
    const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
    console.log(`\nLi标签: ${liTags.length}`)
    
    // 3. 显示第一个Li的内容
    if (liTags.length > 0) {
      console.log('\n第一个Li标签:')
      console.log(liTags[0])
    }
    
    // 4. 查找img标签
    const imgTags = text.match(/<img[^>]*>/gi) || []
    console.log(`\nImg标签: ${imgTags.length}`)
    for (const img of imgTags.slice(0, 5)) {
      console.log(img)
    }
    
    // 5. 查找分页信息
    const pagination = text.match(/共\d+张|页次|\d+\/\d+/g) || []
    console.log(`\n分页信息: ${[...new Set(pagination)].slice(0, 5).join(', ')}`)
    
    // 6. 查找分类
    const categories = text.match(/外观|内饰|细节|座椅|官图|评测|车展/gi) || []
    console.log(`\n分类: ${[...new Set(categories)].join(', ')}`)
    
    // 7. 查找API调用
    const apiCalls = text.match(/api\/[^"'\s]+/gi) || []
    console.log(`\nAPI调用: ${[...new Set(apiCalls)].slice(0, 10).join(', ')}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试分页
  console.log('\n\n=== 测试分页 ===\n')
  
  const pageUrls = [
    'https://price.pcauto.com.cn/cars/imglist/sg4550-o1.html',
    'https://price.pcauto.com.cn/cars/imglist/sg4550-o2.html',  // 第2页
    'https://price.pcauto.com.cn/cars/imglist/sg4550-o3.html',  // 第3页
  ]
  
  for (const url of pageUrls) {
    try {
      const res = await fetch(url, { timeout: 10000, headers })
      const buf = Buffer.from(await res.arrayBuffer())
      const text = iconv.decode(buf, 'gbk')
      
      const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
      const imgUrls = text.match(/#src="([^"]+)"/gi) || []
      
      console.log(`${url}`)
      console.log(`  Status: ${res.status}, Li: ${liTags.length}, #src: ${imgUrls.length}`)
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 测试不同分类
  console.log('\n\n=== 测试不同分类 ===\n')
  
  const categoryUrls = [
    { name: '外观', url: 'https://price.pcauto.com.cn/cars/imglist/sg4550-1-o1.html' },
    { name: '内饰', url: 'https://price.pcauto.com.cn/cars/imglist/sg4550-2-o1.html' },
    { name: '空间', url: 'https://price.pcauto.com.cn/cars/imglist/sg4550-3-o1.html' },
    { name: '细节', url: 'https://price.pcauto.com.cn/cars/imglist/sg4550-4-o1.html' },
    { name: '官图', url: 'https://price.pcauto.com.cn/cars/imglist/sg4550-7-o1.html' },
  ]
  
  for (const cat of categoryUrls) {
    try {
      const res = await fetch(cat.url, { timeout: 10000, headers })
      const buf = Buffer.from(await res.arrayBuffer())
      const text = iconv.decode(buf, 'gbk')
      
      const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
      const imgUrls = text.match(/#src="([^"]+)"/gi) || []
      
      console.log(`${cat.name}: Status=${res.status}, Li=${liTags.length}, #src=${imgUrls.length}`)
      
      if (imgUrls.length > 0) {
        console.log(`  示例: ${imgUrls[0]}`)
      }
    } catch (e) {
      console.log(`${cat.name}: ${e.message}`)
    }
  }
  
  // 分析第一个Li中的图片URL格式
  console.log('\n\n=== 分析图片URL格式 ===\n')
  
  const firstPageUrl = 'https://price.pcauto.com.cn/cars/imglist/sg4550-2-o1.html'
  try {
    const res = await fetch(firstPageUrl, { timeout: 15000, headers })
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    
    const liTags = text.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
    
    if (liTags.length > 0) {
      console.log('第一个Li完整内容:')
      console.log(liTags[0])
    }
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
}

test().catch(console.error)
