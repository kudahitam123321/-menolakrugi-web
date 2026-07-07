const BOT_URL = 'http://93.115.101.152:12772';

export async function onRequest(context) {
  const { params } = context;
  const path = (params.path || []).join('/');
  const target = `${BOT_URL}/discord/${path}`;

  try {
    const res = await fetch(target);
    const status = res.status;
    const data = await res.text();
    return new Response(JSON.stringify({ upstream_status: status, upstream_body: data.slice(0, 200) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ fetch_failed: true, error: String(err) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
