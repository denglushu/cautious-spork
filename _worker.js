addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const inputPassword = url.searchParams.get('password') || '';

  // 预设密码
  const correctPassword = "888";

  if (inputPassword !== correctPassword) {
    return new Response(JSON.stringify("密码错误"), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 返回水果数据
  const fruits = ["1636983341", "573776258", "mar4pis"];
  return new Response(JSON.stringify(fruits), {
    headers: { 'Content-Type': 'application/json' },
  });
}