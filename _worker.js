addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 密码验证（需在URL中提供 ?password=888）
  const inputPassword = url.searchParams.get('password');
  const correctPassword = "888"; // 改成你的密码

  if (inputPassword !== correctPassword) {
    return new Response("无权访问", { status: 401 });
  }

  // 路由：/update?data=new1,new2,new3
  if (path === '/update') {
    const newData = url.searchParams.get('data')?.split(',') || [];
    await FRUIT_DATA.put("fruits", JSON.stringify(newData));
    return new Response("数据已更新: " + newData.join(', '));
  }

  // 默认返回当前数据
  const fruits = await FRUIT_DATA.get("fruits") || '["default1", "default2"]';
  return new Response(fruits, {
    headers: { 'Content-Type': 'application/json' },
  });
}