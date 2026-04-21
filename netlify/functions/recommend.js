export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { prompt } = await req.json();

  const gatewayUrl = Netlify.env.get('NETLIFY_AI_GATEWAY_BASE_URL');
  const gatewayKey = Netlify.env.get('NETLIFY_AI_GATEWAY_KEY');

  if (!gatewayUrl || !gatewayKey) {
    return new Response(JSON.stringify({
      error: {
        message: 'Netlify AI Gateway is not active. Ensure AI features are enabled for this project and at least one production deploy has completed.'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const upstream = await fetch(`${gatewayUrl}/anthropic/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gatewayKey}`,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const bodyText = await upstream.text();

  if (!upstream.ok) {
    return new Response(JSON.stringify({
      error: {
        message: `AI Gateway responded with ${upstream.status}: ${bodyText}`
      }
    }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(bodyText, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const config = {
  path: '/.netlify/functions/recommend'
};
