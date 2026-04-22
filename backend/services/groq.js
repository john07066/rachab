const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

export async function generateClipCopyWithGroq({ text }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `You generate short-form clip packaging for wealth/mindset content.\nReturn strict JSON with keys: title, hook, caption, emotion, rationale.\nConstraints:\n- title <= 60 chars\n- hook <= 80 chars\n- caption includes 8-10 hashtags\n- emotion one of: shock,inspiration,controversy,revelation,motivation\nText: ${text}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed?.title || !parsed?.hook || !parsed?.caption) return null;
    return parsed;
  } catch {
    return null;
  }
}
