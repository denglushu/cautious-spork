// 极速链接提取器 - 无KV存储版本
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const startTime = Date.now()
    
    // 并行获取目标页面和预验证常用域名
    const [targetResponse, preVerifiedLinks] = await Promise.all([
      fetch('https://site.ip138.com/', {
        cf: { cacheTtl: 300 }, // 使用Cloudflare边缘缓存
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      quickVerifyLinks(getTopDomains()) // 预验证顶级域名
    ])

    if (!targetResponse.ok) {
      throw new Error(`目标页面加载失败: ${targetResponse.status}`)
    }

    // 使用流式处理HTML
    const html = await targetResponse.text()
    const extractedLinks = fastLinkExtraction(html)
    
    // 合并并去重
    const allLinks = [...new Set([...extractedLinks, ...preVerifiedLinks.map(l => l.domain)])]
    
    // 快速验证（限制数量）
    const verifiedLinks = await quickVerifyLinks(allLinks.slice(0, 30))
    
    // 构建响应
    const finalHtml = buildLightweightHtml(verifiedLinks, Date.now() - startTime)
    
    return new Response(finalHtml, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'max-age=60' // 短时间缓存
      }
    })
  } catch (error) {
    return new Response(`<h1>处理错误</h1><pre>${error.stack}</pre>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// 优化的链接提取函数
function fastLinkExtraction(html) {
  const links = []
  const seen = new Set()
  const tokenRegex = /<a\s[^>]*?href=(["'])((?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/|#|\?|$))[^>]*>/gi
  
  let match
  while ((match = tokenRegex.exec(html)) !== null) {
    const domain = match[3].toLowerCase()
    if (!seen.has(domain) && domain.length > 3 && !domain.includes('.')) {
      seen.add(domain)
      links.push(domain)
    }
  }
  
  return links
}

// 顶级域名列表
function getTopDomains() {
  return [
    'google.com', 'youtube.com', 'baidu.com', 'qq.com', 
    'taobao.com', 'tmall.com', 'facebook.com', 'sohu.com',
    'jd.com', 'amazon.com', 'wikipedia.org', 'weibo.com',
    'sina.com.cn', 'zoom.us', 'live.com', 'netflix.com',
    'microsoft.com', 'office.com', 'mi.com', 'bing.com'
  ]
}

// 极速验证 - 只检查连接性和状态码
async function quickVerifyLinks(domains) {
  const BATCH_SIZE = 15 // 高并发
  const result = []
  
  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE)
    const batchRequests = batch.map(domain => 
      fetch(`https://${domain}`, {
        method: 'HEAD', // 只获取头部
        redirect: 'follow',
        timeout: 2000, // 2秒超时
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      .then(res => ({
        domain,
        valid: res.ok,
        status: res.status
      }))
      .catch(() => ({
        domain,
        valid: false,
        status: 0
      }))
    )
    
    const batchResults = await Promise.all(batchRequests)
    result.push(...batchResults)
  }
  
  return result
}

// 轻量级HTML生成
function buildLightweightHtml(links, processingTime) {
  const validLinks = links.filter(l => l.valid)
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>快速链接提取结果</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:-apple-system,sans-serif;margin:20px}
    h1{color:#2563eb}
    .link{display:block;margin:8px 0;padding:8px;border-left:3px solid #2563eb}
    .stats{background:#f3f4f6;padding:12px;border-radius:6px;margin:20px 0}
    .time{color:#4b5563}
  </style>
</head>
<body>
  <h1>提取结果</h1>
  <div class="stats">
    共找到 ${validLinks.length} 个可用链接 (共检查 ${links.length} 个) •
    <span class="time">处理时间: ${processingTime}ms</span>
  </div>
  ${validLinks.map(l => `
    <a href="https://${l.domain}" target="_blank" class="link">
      ${l.domain} <small>(${l.status})</small>
    </a>
  `).join('')}
</body>
</html>`
}