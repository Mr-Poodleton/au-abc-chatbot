// ================================================================
// api/chat.js — Vercel Serverless Function
//
// ✅ SAFE TO PUSH TO GITHUB — no API key is written here.
//    The key is stored privately in Vercel's Environment Variables
//    and read at runtime using process.env.GROQ_API_KEY.
//
// How this works:
//   1. chatbot.js (front-end) sends a POST to /api/chat
//   2. Vercel runs THIS file on their server (not in the browser)
//   3. This file reads the API key from Vercel's private settings
//   4. It calls the Groq API with the key
//   5. It sends the AI reply back to the front-end
//
// The user's browser NEVER sees the API key. Ever.
// ================================================================

module.exports = async function handler(req, res) {

  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, systemInstructions } = req.body;

  // Basic validation
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Bad request: messages must be an array.' });
  }

  // Read the API key from Vercel's private Environment Variables
  // You set this in: Vercel Dashboard → Your Project → Settings → Environment Variables
  // Name : GROQ_API_KEY
  // Value: gsk_xxxxxxxxxxxxxxxxxxxxxxxx  (your actual key)
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    // This only shows up in Vercel's server logs — the user never sees the key
    return res.status(500).json({
      error: 'Server not configured. Add GROQ_API_KEY to Vercel Environment Variables.'
    });
  }

  try {
    // Keep only last 20 messages to avoid hitting token limits
    const trimmedMessages = messages.slice(-20);

    // Retry logic — Groq free tier can have transient failures / rate limits
    let groqRes;
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemInstructions },
            ...trimmedMessages
          ],
          temperature: 0.5,
          max_tokens: 1024
        })
      });

      if (groqRes.ok) break;

      // Parse the error
      let errBody;
      try { errBody = await groqRes.json(); } catch { errBody = {}; }
      lastError = errBody;
      console.error(`Groq attempt ${attempt} failed (${groqRes.status}):`, errBody);

      // If rate-limited (429), wait before retrying
      if (groqRes.status === 429 && attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }

      // For other errors, don't retry
      if (groqRes.status !== 429) break;
    }

    // Handle final failure
    if (!groqRes.ok) {
      const errMsg = lastError?.error?.message || `Groq API returned ${groqRes.status}`;
      console.error('Groq final error:', lastError);
      return res.status(502).json({ error: errMsg });
    }

    // Extract the AI's reply
    const groqData = await groqRes.json();
    const reply = groqData.choices[0].message.content;

    // Send the reply back to chatbot.js in the browser
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
