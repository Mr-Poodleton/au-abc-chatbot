# AU ABC Campus Chatbot

Browser-based chatbot for questions about Arellano University - Andres
Bonifacio Campus (AU ABC / AU Pasig).

> TODO: Add a screenshot or demo GIF at `docs/demo.gif`.

## Features

- Restricts the assistant's system instructions to AU ABC campus topics.
- Provides campus information about programs, admissions, contacts, and
  student services.
- Sends chat messages to a serverless `/api/chat` endpoint.
- Keeps the Groq API key on the server by reading `GROQ_API_KEY` from the
  deployment environment.
- Trims the request history and retries transient rate-limit failures.
- Uses the `llama-3.1-8b-instant` model through Groq.

## How it works

The static browser UI in `index.html`, `style.css`, and `chatbot.js` collects
the user's message and sends it to `/api/chat`. The Vercel serverless function
validates the request, combines the configured system instructions with the
last 20 messages, and calls Groq's OpenAI-compatible chat-completions endpoint.
The browser receives only the generated reply; the API key is read from the
server environment and is not embedded in the client code.

## Tech stack

- JavaScript
- HTML and CSS
- Vercel serverless functions
- Groq chat-completions API
- Node.js 18 or newer

## Getting started

### Prerequisites

- Node.js 18 or newer
- A Groq API key
- A Vercel deployment or compatible serverless-function environment

### Configure and run

Set `GROQ_API_KEY` in the deployment environment. Do not commit it to the
repository or place it in browser-side JavaScript.

For local development with the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Open the local URL reported by Vercel. This repository does not define an
`npm start` script.

## Results

TODO: Add a deployed demo URL and measured response or availability results.

## My role

TODO: Confirm whether this is a solo or team project and document the specific
contributions.
