export function endpoint(base) {
  const url = new URL(base.trim());
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash) {
    throw new Error('Enter a valid HTTPS API base URL, or a local HTTP endpoint.');
  }
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/chat\/completions$/, '') + '/chat/completions';
  return url;
}

export async function complete(config, history, request = fetch) {
  const response = await request(endpoint(config.base), {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { Authorization: 'Bearer ' + config.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: 'You are Plip, a friendly English conversation partner. Respond briefly in English, offer one useful correction when needed, and ask a natural follow-up question.' + (config.explanation === 'zh' ? ' Explain corrections in Simplified Chinese while keeping the practice dialogue in English.' : '') },
        ...history.slice(-10),
      ],
    }),
  });
  if (!response.ok) throw new Error('API request failed (HTTP ' + response.status + ').');
  const result = (await response.json()).choices?.[0];
  const text = result?.message?.content;
  if (typeof text !== 'string' || !text.trim() || result.finish_reason === 'length') {
    throw new Error('The model returned no complete reply.');
  }
  return text.trim();
}
