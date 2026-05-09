import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  // 测试PC端图片页面
  console.log('=== 测试PC端图片页面 ===\n')
  
  // 凯美瑞 PC端图片列表
  const pcUrl = 'https://www.pcauto.com.cn/series/m127230/pic/'
  try {
    const res = await fetch(pcUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      }
    })
    
    console.log(`Status: ${res.status}`)
    console.log(`Content-Type: ${res.headers.get('content-type')}`)
    
    const buf = Buffer.from(await res.arrayBuffer())
    // 检测编码
    const latin1 = buf.toString('latin1')
    const charsetMatch = latin1.match(/charset\s*=\s*([A-Za-z0-9_-]+)/i)
    const charset = charsetMatch?.[1] || 'gbk'
    console.log(`Detected charset: ${charset}`)
    
    const text = iconv.decode(buf, charset)
    console.log(`Page size: ${text.length}`)
    
    // 查找图片URL
    const imgUrls = text.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png)(?:\?[^"'\s<>]*)?/gi) || []
    const uniqueUrls = [...new Set(imgUrls)]
    console.log(`\n图片URL数量: ${uniqueUrls.length}`)
    if (uniqueUrls.length > 0) {
      console.log('示例图片URL:')
      for (const url of uniqueUrls.slice(0, 10)) {
        console.log(`  ${url}`)
      }
    }
    
    // 查找VR相关链接
    const vrUrls = text.match(/https?:\/\/[^"'\s<>]*vr[^"'\s<>]*/gi) || []
    console.log(`\nVR相关URL: ${[...new Set(vrUrls)].slice(0, 5).join(', ')}`)
    
    // 查找API接口
    const apiUrls = text.match(/https?:\/\/[^"'\s<>]*api[^"'\s<>]*/gi) || []
    console.log(`API URL: ${[...new Set(apiUrls)].slice(0, 5).join(', ')}`)
    
    // 查找图片分类
    const categories = text.match(/外观|内饰|细节|座椅|车展|官图|评测/gi) || []
    console.log(`\n图片分类: ${[...new Set(categories)].join(', ')}`)
    
    // 查找分页链接
    const pageLinks = text.match(/\/pic\/[^"'<>\s]+/gi) || []
    console.log(`\n分页链接: ${[...new Set(pageLinks)].slice(0, 10).join('\n')}`)
    
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
  
  // 测试 price.pcauto.com.cn 的API
  console.log('\n\n=== 测试price.pcauto.com.cn API ===\n')
  
  // 尝试图片列表API
  const apiUrl = 'https://price.pcauto.com.cn/api/pic/list?seriesId=m127230&type=1&page=1&pageSize=20'
  try {
    const res = await fetch(apiUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://price.pcauto.com.cn/',
      }
    })
    console.log(`API Status: ${res.status}`)
    const data = await res.json()
    console.log('API Response:', JSON.stringify(data, null, 2).substring(0, 1000))
  } catch (e) {
    console.log(`API Error: ${e.message}`)
  }
  
  // 测试另一个图片列表URL格式
  console.log('\n\n=== 测试图片列表页面变体 ===\n')
  
  const picUrls = [
    'https://price.pcauto.com.cn/cars/imglist/m127230-2-o1.html',
    'https://price.pcauto.com.cn/series/m127230/pic/',
    'https://www.pcauto.com.cn/series/127230/pic/',
  ]
  
  for (const url of picUrls) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      })
      console.log(`${url}`)
      console.log(`  Status: ${res.status}, Size: ${res.headers.get('content-length') || 'unknown'}`)
    } catch (e) {
      console.log(`${url}: ${e.message}`)
    }
  }
}

test().catch(console.error)
