import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  // 太平洋汽车网图片列表 - m127230是凯美瑞
  const seriesUrl = 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html'
  console.log('=== 太平洋汽车网图片列表 ===\n')
  
  try {
    const res = await fetch(seriesUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      }
    })
    
    console.log(`Status: ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    console.log(`Page size: ${text.length}`)
    
    // 1. 查找所有script标签
    const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
    console.log(`\nScript标签数量: ${scriptBlocks.length}`)
    
    // 2. 查找包含图片数据的script
    for (let i = 0; i < scriptBlocks.length; i++) {
      const content = scriptBlocks[i]
      if (content.includes('picList') || content.includes('imageList') || content.includes('imgList')) {
        console.log(`\nScript ${i} 包含图片列表数据:`)
        console.log(content.substring(0, 2000))
      }
    }
    
    // 3. 查找JSON数据
    const jsonData = text.match(/var\s+\w+\s*=\s*(\{[\s\S]*?\});/g) || []
    console.log(`\nJSON变量数量: ${jsonData.length}`)
    for (const json of jsonData.slice(0, 5)) {
      console.log(json.substring(0, 300))
      console.log('---')
    }
    
    // 4. 查找图片URL（懒加载格式）
    const lazyImgUrls = text.match(/src="([^"]*pconline[^"]*)"/gi) || []
    console.log(`\n懒加载图片URL: ${lazyImgUrls.length}`)
    for (const url of lazyImgUrls.slice(0, 5)) {
      console.log(`  ${url}`)
    }
    
    // 5. 查找真实图片URL（#src格式）
    const realImgUrls = text.match(/#src="([^"]+)"/gi) || []
    console.log(`\n真实图片URL: ${realImgUrls.length}`)
    for (const url of realImgUrls.slice(0, 5)) {
      console.log(`  ${url}`)
    }
    
    // 6. 查找车型ID
    const modelIds = text.match(/m\d+/g) || []
    console.log(`\n车型ID: ${[...new Set(modelIds)].join(', ')}`)
    
    // 7. 查找分页链接
    const pageLinks = text.match(/href="([^"]*-\d+\.html[^"]*)"/gi) || []
    console.log(`\n分页链接: ${[...new Set(pageLinks)].slice(0, 10).join('\n')}`)
    
    // 8. 查找分类标签
    const categories = text.match(/href="[^"]*">(外观|内饰|细节|座椅|官图|评测|车展)/gi) || []
    console.log(`\n分类标签: ${[...new Set(categories)].join(', ')}`)
    
    // 9. 查找VR链接
    const vrLinks = text.match(/href="([^"]*vr[^"]*)"/gi) || []
    console.log(`\nVR链接: ${[...new Set(vrLinks)].slice(0, 5).join('\n')}`)
    
    // 10. 查看页面结构
    const pageStructure = text.match(/class="[^"]*(?:pic|img|photo|list|category)[^"]*"/gi) || []
    console.log(`\n页面结构类名: ${[...new Set(pageStructure)].slice(0, 10).join(', ')}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试不同类型的图片URL
  console.log('\n\n=== 测试不同分类的图片页面 ===\n')
  
  const categoryUrls = [
    { name: '外观', url: 'https://price.pcauto.com.cn/cars/imglist/m127230-1-o1.html' },
    { name: '内饰', url: 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html' },
    { name: '空间', url: 'https://price.pcauto.com.cn/cars/imglist/m127230-3-o1.html' },
    { name: '细节', url: 'https://price.pcauto.com.cn/cars/imglist/m127230-4-o1.html' },
  ]
  
  for (const cat of categoryUrls) {
    try {
      const res = await fetch(cat.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      })
      const buf = Buffer.from(await res.arrayBuffer())
      const text = iconv.decode(buf, 'gbk')
      
      // 提取图片URL
      const imgUrls = text.match(/#src="([^"]+)"/gi) || []
      const srcUrls = text.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png))"/gi) || []
      
      console.log(`${cat.name}: Status=${res.status}, 懒加载图片=${imgUrls.length}, src图片=${srcUrls.length}`)
      
      // 显示一个示例图片URL
      if (imgUrls.length > 0) {
        const firstImg = imgUrls[0].match(/#src="([^"]+)"/)?.[1]
        if (firstImg) {
          console.log(`  示例: ${firstImg}`)
        }
      }
    } catch (e) {
      console.log(`${cat.name}: Error - ${e.message}`)
    }
  }
  
  // 测试VR看车页面
  console.log('\n\n=== 测试VR看车页面 ===\n')
  const vrUrl = 'https://price.pcauto.com.cn/cars/vr/m127230.html'
  try {
    const res = await fetch(vrUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    console.log(`VR页面 Status: ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const text = iconv.decode(buf, 'gbk')
    console.log(`VR页面 Size: ${text.length}`)
    
    // 查找VR相关内容
    const vrData = text.match(/vr|360|全景|panorama/gi) || []
    console.log(`VR关键词: ${[...new Set(vrData)].join(', ')}`)
    
  } catch (e) {
    console.log(`VR页面 Error: ${e.message}`)
  }
}

test().catch(console.error)
