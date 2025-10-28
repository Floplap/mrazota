// ai_assistant Edge Function template
// Simple proxy to an AI model; in production, call OpenAI/Anthropic etc using server API key

export default async function (req, res) {
  try {
    const body = await req.json();
    const prompt = body.prompt || '';

    // Minimal placeholder response
    const generated = `Generated description for: ${prompt.slice(0, 200)}`;
    return res.json({ text: generated });
  } catch (err) {
    console.error('ai_assistant error', err);
    return res.status(500).json({ error: String(err) });
  }
}
