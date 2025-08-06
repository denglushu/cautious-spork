addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.searchParams.has('getContent')) {
        try {
            // 获取网页内容
            const response = await fetch('https://site.ip138.com/');
            const htmlContent = await response.text();

            // 解析HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const aTags = doc.querySelectorAll('a');

            const extractedTexts = [];
            const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;

            aTags.forEach(aTag => {
                const text = aTag.textContent.trim();
                if (!empty(text) && domainPattern.test(text)) {
                    extractedTexts.push(text);
                }
            });

            const uniqueExtractedTexts = Array.from(new Set(extractedTexts));

            async function getPageTitle(url) {
                try {
                    const response = await fetch(url, {
                        headers: {
                            'User - Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error: ${response.status}`);
                    }
                    const body = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(body, 'text/html');
                    const titleElement = doc.querySelector('title');
                    return {
                        valid: true,
                        title: titleElement? titleElement.textContent.trim() : '无标题'
                    };
                } catch (error) {
                    return {
                        valid: false,
                        error: `获取标题错误: ${error.message}`
                    };
                }
            }

            const linkInfos = [];
            for (const text of uniqueExtractedTexts) {
                const linkUrl = text.startsWith('http://') || text.startsWith('https://')? text : 'http://' + text;
                const pageInfo = await getPageTitle(linkUrl);
                if (pageInfo.valid) {
                    linkInfos.push({
                        text,
                        url: linkUrl,
                        title: pageInfo.title,
                        error: null
                    });
                }
            }

            let finalHtml = `
<!DOCTYPE html>
<html lang='zh - CN'>
<head>
    <title>提取的有效网址链接及标题</title>
    <meta charset='UTF - 8'>
    <meta name='viewport' content='width=device - width, initial - scale = 1.0'>
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
            font - family: 'Inter', - apple - system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans - serif;
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
    </style>
</head>
<body>
    <div class='container'>
        <header>
            <h1>提取的有效网址链接</h1>
            <p class='subtitle'>从页面中提取并验证的可用链接</p>
        </header>

        <div class='stats'>
            <div class='stat - card'>
                <div class='stat - value'>${linkInfos.length}</div>
                <div class='stat - label'>有效链接</div>
            </div>
        </div>

        <div class='links - container'>
`;

            for (const linkInfo of linkInfos) {
                finalHtml += `
                <div class='link - card'>
                    <div class='link - header'>
                        <div class='link - title'>${escapeHtml(linkInfo.title)}</div>
                    </div>
                    <div class='link - body'>
                        <a href='${escapeHtml(linkInfo.url)}' target='_blank' class='link - text'>${escapeHtml(linkInfo.text)}</a>
                        <img src='https://v2.xxapi.cn/api/screenshot?url=${encodeURIComponent(linkInfo.url)}&return=302' alt='截图' style='max - width:100%;height:auto;'>
                    </div>
                </div>
`;
            }

            finalHtml += `
        </div>

        <div class='footer'>
            <p>生成于 ${new Date().toISOString()} | 共处理 ${uniqueExtractedTexts.length} 个链接</p>
        </div>
    </div>
</body>
</html>
`;

            return new Response(finalHtml, {
                headers: {
                    'Content - Type': 'text/html'
                }
            });
        } catch (error) {
            return new Response(`错误: ${error.message}`, { status: 500 });
        }
    } else {
        return new Response(`
<!DOCTYPE html>
<html lang='zh - CN'>
<head>
    <title>正在提取网址链接...</title>
    <meta charset='UTF - 8'>
    <meta name='viewport' content='width=device - width, initial - scale = 1.0'>
    <style>
        * {
            margin: 0;
            padding: 0;
            box - sizing: border - box;
        }

        body {
            font - family: - apple - system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans - serif;
            background: #f8f9fa;
            height: 100vh;
            display: flex;
            justify - content: center;
            align - items: center;
            flex - direction: column;
            color: #4361ee;
        }

       .loading - container {
            text - align: center;
            padding: 2rem;
        }

       .loader {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border - top: 5px solid #4361ee;
            border - radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        h1 {
            margin - bottom: 1rem;
            font - weight: 500;
        }

       .progress - text {
            margin - top: 1rem;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class='loading - container'>
        <div class='loader'></div>
        <h1>正在处理链接...</h1>
        <p class='progress - text'>请稍候，这可能需要一些时间</p>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            fetch(window.location.href + '?getContent=true')
              .then(response => response.text())
              .then(html => {
                    document.open();
                    document.write(html);
                    document.close();
                })
              .catch(error => {
                    document.querySelector('h1').textContent = '加载失败';
                    document.querySelector('.progress - text').textContent = '错误:'+ error.message;
                });
        });
    </script>
</body>
</html>
`, {
            headers: {
                'Content - Type': 'text/html'
            }
        });
    }
}

function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}