// ai_moderate Edge Function template for Supabase Functions
// This is a minimal example. Put your moderation model/API calls here.

export default async function (req, res) {
  try {
    const body = await req.json();
    const content = body.content || '';

    // Example: simple keyword block (replace with real AI call)
    const blockedWords = ['badword', 'illegal', 'spam'];
    const lowered = content.toLowerCase();
    const match = blockedWords.some((w) => lowered.includes(w));

    if (match) {
      return res.json({ verdict: 'block', reason: 'contains_prohibited_keywords' });
    }

    // Otherwise allow (or call external AI and return its result)
    return res.json({ verdict: 'allow' });
  } catch (err) {
    console.error('ai_moderate error', err);
    return res.status(500).json({ error: String(err) });
  }
}
