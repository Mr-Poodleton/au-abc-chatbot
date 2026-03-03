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

export default async function handler(req, res) {

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
    // Call the Groq AI API
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`   // ← key used here, server-side only
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',   // Free, fast Groq model
        messages: [
          // System instructions come first — this enforces the AU ABC topic restriction
          { role: 'system', content: systemInstructions },
          // Then the actual conversation history
          ...messages
        ],
        temperature: 0.5,    // Lower = more consistent, focused answers
        max_tokens: 1024
      })
    });

    // Handle Groq API errors
    if (!groqRes.ok) {
      const groqErr = await groqRes.json();
      console.error('Groq API error:', groqErr);
      return res.status(502).json({
        error: 'Could not reach the AI service. Check your GROQ_API_KEY in Vercel settings.'
      });
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
