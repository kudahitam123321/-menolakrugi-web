const BOT_URL = 'https://menolakrugi-bot-production.up.railway.app';

export async function onRequest(context) {
  const { request, params } = context;
  const path = (params.path || []).join('/');
  const search = new URL(request.url).search;
  const target = `${BOT_URL}/discord/${path}${search}`;

  try {
    const body = request.method !== 'GET' ? await request.text() : undefined;
    const res = await fetch(target, {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
