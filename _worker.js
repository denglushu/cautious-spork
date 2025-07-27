addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const inputPassword = url.searchParams.get('password') || '';
  const correctPassword = "888";

  if (inputPassword !== correctPassword) {
    return new Response("密码错误", {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 从 KV 获取数据（如果没有，返回默认值）
  let fruits = await FRUIT_DATA.get("fruits");
  if (!fruits) {
    fruits = JSON.stringify(["1636983341", "573776258", "mar4pis"]); // 默认数据
    await FRUIT_DATA.put("fruits", fruits); // 存储到 KV
  }

  return new Response(fruits, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}