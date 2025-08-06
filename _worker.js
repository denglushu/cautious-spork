addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url)

    if (url.searchParams.has('getContent')) {
        return await generateContent()
    }

    if (url.searchParams.has('progress')) {
        return handleProgressRequest()
    }

    return new Response(loadingPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
}

// 存储处理进度
let progress = {
    total: 0,
    processed: 0,
    current: '',
    links: []
}

async function handleProgressRequest() {
    return new Response(JSON.stringify(progress), {
        headers: { 'Content-Type': 'application/json' }
    })
}

function loadingPage() {
    return `<!DOCTYPE html>
<html lang='zh-CN'>
<head>
    <title>正在提取网址链接...</title>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f8f9fa;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            color: #4361ee;
        }

      .loading-container {
            text-align: center;
            padding: 2rem;
            max-width: 500px;
            width: 100%;
        }

      .loader {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #4361ee;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        h1 {
            margin-bottom: 1rem;
            font-weight: 500;
        }

      .progress-container {
            width: 100%;
            background: #e9ecef;
            border-radius: 20px;
            margin: 1rem 0;
            height: 10px;
            overflow: hidden;
        }

      .progress-bar {
            height: 100%;
            background: #4361ee;
            width: 0%;
            transition: width 0.3s ease;
        }

      .progress-text {
            margin-top: 1rem;
            color: #6c757d;
            font-size: 0.9rem;
        }

      .current-task {
            margin-top: 0.5rem;
            font-size: 0.85rem;
            color: #495057;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        }

      .stats {
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-top: 1rem;
            font-size: 0.85rem;
        }

      .stat {
            color: #495057;
        }
    </style>
</head>
<body>
    <div class='loading-container'>
        <div class='loader'></div>
        <h1>正在处理链接...</h1>

        <div class='progress-container'>
            <div class='progress-bar' id='progressBar'></div>
        </div>

        <div class='progress-text'>
            <span id='progressText'>0%</span> 完成
        </div>

        <div class='current-task' id='currentTask'>
            初始化中...
        </div>

        <div class='stats'>
            <div class='stat'>已处理: <span id='processed'>0</span></div>
            <div class='stat'>总计: <span id='total'>0</span></div>
        </div>
    </div>

    <script>
        let progressInterval;

        function updateProgress(data) {
            const progressPercent = data.total > 0? Math.round((data.processed / data.total) * 100) : 0;

            document.getElementById('progressBar').style.width = progressPercent + '%';
            document.getElementById('progressText').textContent = progressPercent + '%';
            document.getElementById('currentTask').textContent = data.current || '处理中...';
            document.getElementById('processed').textContent = data.processed;
            document.getElementById('total').textContent = data.total;

            // 如果处理完成，跳转到结果页面
            if (data.processed >= data.total && data.total > 0) {
                clearInterval(progressInterval);
                setTimeout(() => {
                    fetch(window.location.href + '?getContent=true')
                      .then(response => response.text())
                      .then(html => {
                            document.open();
                            document.write(html);
                            document.close();
                        })
                      .catch(error => {
                            document.querySelector('h1').textContent = '加载失败';
                            document.querySelector('.progress-text').textContent = '错误:'+ error.message;
                        });
                }, 1000);
            }
        }

        function fetchProgress() {
            fetch(window.location.href + '?progress=true')
              .then(response => response.json())
              .then(updateProgress)
              .catch(error => {
                    console.error('获取进度失败:', error);
                });
        }

        document.addEventListener('DOMContentLoaded', function () {
            // 先获取一次进度
            fetchProgress();

            // 然后每1秒获取一次进度
            progressInterval = setInterval(fetchProgress, 1000);

            // 同时开始获取内容
            fetch(window.location.href + '?getContent=true')
              .catch(error => {
                    console.error('初始化请求失败:', error);
                });
        });
    </script>
</body>
</html>`
}

async function generateContent() {
    try {
        // 初始化进度
        progress = {
            total: 0,
            processed: 0,
            current: '正在获取目标网页...',
            links: []
        };

        const targetUrl = 'https://site.ip138.com/';
        const response = await fetch(targetUrl, {
            headers: {
                'User - Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        // 获取响应内容长度
        const contentLength = parseInt(response.headers.get('content - length'));
        progress.total = contentLength;

        const readableStream = response.body;
        const decoder = new TextDecoder('utf - 8');
        let receivedLength = 0;

        const controller = new AbortController();
        const signal = controller.signal;

        const reader = readableStream.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
            receivedLength += value.length;
            progress.processed = receivedLength;
            progress.current = `正在接收数据: ${(receivedLength / contentLength * 100).toFixed(2)}%`;
        }

        const html = decoder.decode(new Uint8Array([].concat(...chunks)));
        const links = extractLinks(html);
        const uniqueLinks = [...new Set(links)]; // 去重

        // 限制处理数量
        const linksToProcess = uniqueLinks.slice(0, 20);
        progress.total = linksToProcess.length;
        progress.links = linksToProcess;

        // 验证链接
        const verifiedLinks = await verifyLinks(linksToProcess);

        return new Response(buildFinalHtml(verifiedLinks), {
            headers: { 'Content - Type': 'text/html; charset=utf - 8' }
        });
    } catch (error) {
        return new Response(`<h1>处理错误</h1><p>${error.message}</p>`, {
            status: 500,
            headers: { 'Content - Type': 'text/html; charset=utf - 8' }
        });
    }
}

function extractLinks(html) {
    const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA - Z0 - 9 -]+\.[a-zA - Z]{2,})(?:\/|$)/g;
    const matches = [];
    let match;

    while ((match = domainRegex.exec(html))!== null) {
        matches.push(match[1]);
    }

    return matches.filter(domain => {
        const invalidParts = ['javascript:', 'mailto:', 'tel:', '#', 'data:', 'about:'];
        return!invalidParts.some(part => domain.startsWith(part)) &&
            domain.includes('.') &&
            domain.length > 3;
    });
}

async function verifyLinks(links) {
    const verifiedLinks = [];

    const batchSize = 3; // 减少批量大小以获得更平滑的进度更新
    for (let i = 0; i < links.length; i += batchSize) {
        const batch = links.slice(i, i + batchSize);

        // 更新进度
        progress.processed = i;
        progress.current = `正在验证: ${batch[0]}...`;

        const batchResults = await Promise.all(batch.map(verifySingleLink));
        verifiedLinks.push(...batchResults.filter(link => link!== null));

        // 更新进度
        progress.processed = Math.min(i + batchSize, links.length);
    }

    // 处理完成
    progress.processed = links.length;
    progress.current = '正在生成最终结果...';

    return verifiedLinks;
}

async function verifySingleLink(domain) {
    try {
        progress.current = `正在验证: ${domain}`;

        const url = `https://${domain}`;
        const response = await fetch(url, {
            redirect: 'follow',
            timeout: 3000,
            headers: {
                'User - Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return {
                domain,
                url,
                valid: false,
                error: `HTTP状态: ${response.status}`,
                title: '无法访问'
            };
        }

        const html = await response.text();
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch? titleMatch[1].trim() : '无标题';

        return {
            domain,
            url,
            valid: true,
            title: title.length > 50? `${title.substring(0, 50)}...` : title,
            error: null
        };
    } catch (error) {
        return {
            domain,
            url: `https://${domain}`,
            valid: false,
            title: '验证失败',
            error: error.message
        };
    }
}

function buildFinalHtml(links) {
    const validLinks = links.filter(link => link.valid);
    const dateStr = new Date().toLocaleString('zh - CN');

    return `<!DOCTYPE html>
<html lang='zh - CN'>
<head>
    <title>提取的有效网址链接及标题</title>
    <meta charset='UTF - 8'>
    <meta name='viewport' content='width=device - width, initial - scale=1.0'>
    <link href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' rel='stylesheet'>
    <style>
        :root {
            --primary - color: #4361ee;
            --primary - hover: #3a56d4;
            --text - color: #2b2d42;
            --text - secondary: #6c757d;
            --light - bg: #f8f9fa;
            --card - bg: #ffffff;
            --border - color: #e9ecef;
            --success - color: #4cc9f0;
            --error - color: #f72585;
            --shadow: 0 4px 6px - 1px rgba(0, 0, 0, 0.1), 0 2px 4px - 1px rgba(0, 0, 0, 0.06);
            --radius: 0.5rem;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border - box;
        }

        body {
            font-family: 'Inter', - apple - system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans - serif;
            line - height: 1.6;
            color: var(--text - color);
            background - color: var(--light - bg);
            padding: 2rem;
        }

      .container {
            max - width: 1200px;
            margin: 0 auto;
        }

        header {
            text - align: center;
            margin - bottom: 2.5rem;
        }

        h1 {
            font - size: 2rem;
            font - weight: 700;
            color: var(--primary - color);
            margin - bottom: 0.5rem;
        }

      .subtitle {
            color: var(--text - secondary);
            font - size: 1rem;
        }

      .stats {
            display: flex;
            justify - content: center;
            gap: 1rem;
            margin - bottom: 2rem;
        }

      .stat - card {
            background: var(--card - bg);
            padding: 1rem 1.5rem;
            border - radius: var(--radius);
            box - shadow: var(--shadow);
            text - align: center;
            min - width: 120px;
        }

      .stat - value {
            font - size: 1.5rem;
            font - weight: 600;
            color: var(--primary - color);
        }

      .stat - label {
            font - size: 0.875rem;
            color: var(--text - secondary);
        }

      .links - container {
            display: grid;
            grid - template - columns: repeat(auto - fill, minmax(350px, 1fr));
            gap: 1.5rem;
        }

      .link - card {
            background: var(--card - bg);
            border - radius: var(--radius);
            box - shadow: var(--shadow);
            overflow: hidden;
            transition: transform 0.2s ease, box - shadow 0.2s ease;
        }

      .link - card:hover {
            transform: translateY(-4px);
            box - shadow: 0 10px 15px - 3px rgba(0, 0, 0, 0.1), 0 4px 6px - 2px rgba(0, 0, 0, 0.05);
        }

      .link - header {
            padding: 1rem 1.5rem;
            background: var(--primary - color);
            color: white;
        }

      .link - title {
            font - weight: 600;
            font - size: 1.1rem;
            margin - bottom: 0.25rem;
            white - space: nowrap;
            overflow: hidden;
            text - overflow: ellipsis;
        }

      .link - url {
            font - size: 0.8rem;
            opacity: 0.9;
            white - space: nowrap;
            overflow: hidden;
            text - overflow: ellipsis;
        }

      .link - body {
            padding: 1.25rem 1.5rem;
}

.link - text {
display: inline - block;
color: var(--primary - color);
font - weight: 500;
text - decoration: none;
margin - bottom: 0.75rem;
transition: color 0.2s ease;
}

.link - text:hover {
color: var(--primary - hover);
text - decoration: underline;
}

.link - description {
color: var(--text - secondary);
font - size: 0.875rem;
line - height: 1.5;
}

.screenshot - container {
margin - top: 1rem;
border: 1px solid var(--border - color);
border - radius: 0.25rem;
overflow: hidden;
position: relative;
height: 200px;
}

.screenshot - iframe {
width: 100%;
height: 100%;
border: none;
background: #f1f3f5;
}

.screenshot - placeholder {
background: #f1f3f5;
height: 100%;
display: flex;
align - items: center;
justify - content: center;
color: var(--text - secondary);
}

.footer {
text - align: center;
margin - top: 3rem;
color: var(--text - secondary);
font - size: 0.875rem;
}

@media (max - width: 768px) {
body {
padding: 1rem;
}

.links - container {
grid - template - columns: 1fr;
}

.stats {
flex - direction: column;
align - items: center;
}
}

</head>
<body>
    <div class='container'>
        <header>
            <h1>提取的有效网址链接</h1>
            <p class='subtitle'>从页面中提取并验证的可用链接</p>
        </header>

<div class='stats'>
            <div class='stat - card'>
                <div class='stat - value'>${validLinks.length}</div>
                <div class='stat - label'>有效链接</div>
            </div>
            <div class='stat - card'>
                <div class='stat - value'>${links.length - validLinks.length}</div>
                <div class='stat - label'>无效链接</div>
            </div>
            <div class='stat - card'>
                <div class='stat - value'>${links.length}</div>
                <div class='stat - label'>总计</div>
            </div>
        </div>

<div class='links - container'>
            ${validLinks.map(link => `
                <div class='link - card'>
                    <div class='link - header'>
                        <div class='link - title'>${escapeHtml(link.title)}</div>
                        <div class='link - url'>${escapeHtml(link.url)}</div>
                    </div>
                    <div class='link - body'>
                        <a href='${escapeHtml(link.url)}' target='_blank' class='link - text'>${escapeHtml(link.domain)}</a>
                        ${link.error? `<p class='link - description'>错误: ${escapeHtml(link.error)}</p>` : ''}

<div class='screenshot - container'>
                            ${link.valid? `
                                <iframe 
                                    src='${escapeHtml(link.url)}' 
                                    class='screenshot - iframe' 
                                    sandbox='allow - same - origin allow - scripts allow - popups allow - forms'
                                    loading='lazy'
                                ></iframe>
                            ` : `
                                <div class='screenshot - placeholder'>无法加载预览</div>
                            `}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

<div class='footer'>
            <p>生成于 ${dateStr} | 处理耗时: ${calculateProcessingTime()}秒</p>
        </div>
    </div>
</body>
</html>`;
}

function calculateProcessingTime() {
const startTime = progress.startTime || Date.now();
return ((Date.now() - startTime) / 1000).toFixed(2);
}

function escapeHtml(unsafe) {
if (!unsafe) return '';
return unsafe.toString()
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}