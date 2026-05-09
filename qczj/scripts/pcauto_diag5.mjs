import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  // 获取完整的JavaScript代码来分析图片加载逻辑
  const seriesUrl = 'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html'
  console.log('=== 分析懒加载图片URL ===\n')
  
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
    
    // 2. 查找包含图片加载逻辑的script
    for (let i = 0; i < scriptBlocks.length; i++) {
      const content = scriptBlocks[i]
      if (content.includes('Lazy') || content.includes('lazy') || content.includes('imgList') || content.includes('getAttribute')) {
        console.log(`\n=== Script ${i} 包含懒加载逻辑 ===`)
        console.log(content.substring(0, 3000))
        break
      }
    }
    
    // 3. 查找JSON数据
    const jsonVars = text.match(/var\s+\w+\s*=\s*(\{[\s\S]*?\});/gs) || []
    console.log(`\n\nJSON变量: ${jsonVars.length}`)
    for (const json of jsonVars) {
      if (json.includes('img') || json.includes('pic') || json.includes('src')) {
        console.log(json.substring(0, 500))
        console.log('---')
      }
    }
    
    // 4. 查找所有图片相关的src属性
    const srcAttrs = text.match(/\ssrc="([^"]*)"/gi) || []
    console.log(`\n所有src属性: ${srcAttrs.length}`)
    for (const src of srcAttrs.slice(0, 10)) {
      console.log(`  ${src}`)
    }
    
    // 5. 查找data-src或trueSrc属性
    const dataSrcs = text.match(/(?:data-)?src="([^"]*)"/gi) || []
    console.log(`\ndata-src或src: ${dataSrcs.length}`)
    
    // 6. 查找图片列表容器
    const picContainers = text.match(/id="[^"]*(?:pic|img|list)[^"]*"/gi) || []
    console.log(`\n图片容器ID: ${picContainers.join(', ')}`)
    
    // 7. 查找Ajax/API调用
    const ajaxCalls = text.match(/\$\.ajax|fetch\(|XMLHttpRequest|\/api\//gi) || []
    console.log(`\nAjax/API调用: ${ajaxCalls.length > 0 ? '找到' : '未找到'}`)
    
    // 8. 查找JSONP调用
    const jsonpCalls = text.match(/callback|jQuery\d+|jsonp/gi) || []
    console.log(`JSONP调用: ${jsonpCalls.length > 0 ? '找到' : '未找到'}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试API端点
  console.log('\n\n=== 测试太平洋汽车网API ===\n')
  
  const apiUrls = [
    'https://price.pcauto.com.cn/cars/imglist/m127230-2-1.html',
    'https://price.pcauto.com.cn/ajax/picList?seriesId=m127230&type=2&page=1',
    'https://price.pcauto.com.cn/ajax/getPicList?id=m127230&type=2&page=1&pageSize=20',
    'https://price.pcauto.com.cn/json/piclist/m127230-2.json',
  ]
  
  for (const url of apiUrls) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://price.pcauto.com.cn/',
        }
      })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}`)
      const text = await res.text()
      console.log(`  Size: ${text.length}`)
      console.log(`  Preview: ${text.substring(0, 200)}`)
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 测试不同的图片URL格式
  console.log('\n\n=== 测试图片URL格式 ===\n')
  
  // 从之前的搜索结果中找到的图片URL
  const testUrls = [
    'https://img.pconline.com.cn/images/upload/upc/tx/auto5/1404/29/c12/33685436_1398741613379_180x135.jpg',
    'https://www1.pcauto.com.cn/zt/gz20211111/wap/header/img/car_logo.png',
  ]
  
  for (const url of testUrls) {
    try {
      const res = await fetch(url, { timeout: 5000, method: 'HEAD' })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`)
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
  
  // 测试PC端图片页面（使用不同的URL格式）
  console.log('\n\n=== 测试PC端图片页面 ===\n')
  
  const pcUrls = [
    'https://www.pcauto.com.cn/series/127230/pic/',
    'https://www.pcauto.com.cn/series/m127230/pic/',
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
        const imgUrls = text.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png)/gi) || []
        console.log(`  图片URL: ${imgUrls.length}`)
      }
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
}

test().catch(console.error)
