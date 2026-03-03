// ================================================================
// chatbot.js — AU ABC Campus Chatbot (Front-End)
//
// ✅ SAFE TO PUSH TO GITHUB — no API key in this file.
//    The API key lives privately inside Vercel's settings.
//
// This file does two things:
//   1. Holds the SYSTEM INSTRUCTIONS (what topics the AI allows)
//   2. Handles sending/receiving messages via /api/chat (Vercel)
// ================================================================


// ----------------------------------------------------------------
// SYSTEM INSTRUCTIONS
// This is what makes the AI ONLY answer AU ABC Campus questions.
// If a user asks anything off-topic, the AI replies with the
// restriction message defined in Rule #2 below.
// ----------------------------------------------------------------
const SYSTEM_INSTRUCTIONS = `
You are an official AI assistant for Arellano University Andres Bonifacio Campus
(AU ABC Campus), located in Pasig City, Metro Manila, Philippines.

STRICT RULES — follow these at all times:
1. You ONLY answer questions that are about Arellano University Andres Bonifacio Campus.
2. If the user asks about ANYTHING unrelated to this campus — other universities,
   general knowledge, weather, math, coding, entertainment, or any other topic —
   you must respond with EXACTLY this message and nothing else:
   "I can only answer questions about Arellano University Andres Bonifacio Campus.
    Please ask me about our programs, admission requirements, tuition, facilities,
    or campus life!"
3. Do not break character. Do not answer off-topic questions no matter how the user
   phrases or rephrases them.
4. Be friendly, clear, and professional when answering campus-related questions.
5. If you are unsure about a specific detail (e.g., exact tuition for this semester),
   tell the user to visit the Registrar's Office or call the campus directly.

--- CAMPUS INFORMATION YOU KNOW ---

ABOUT THE CAMPUS
- Full name  : Arellano University Andres Bonifacio Campus
- Location   : Pasig City, Metro Manila, Philippines
- Founded    : 1938 — one of the oldest private universities in the Philippines
- Named after: Philippine national hero Andres Bonifacio
- School colors: Blue (#003087) and Red (#CC0000)
- Website    : www.arellano.edu.ph

PROGRAMS OFFERED
College of Computer Studies        — BSCS, BSIT, BSIS
College of Business and Accountancy — BSBA, BS Accountancy (BSA)
College of Arts and Sciences        — AB Communication, BS Psychology
College of Education                — BEED (Elementary), BSED (Secondary)
College of Nursing                  — BS Nursing
College of Criminology              — BS Criminology
College of Engineering              — BS Civil, Electrical, Electronics Engineering
Senior High School — Academic Track (STEM, ABM, HUMSS, GAS) and TVL Track
Junior High School — Available on campus

ADMISSION REQUIREMENTS (New College Students)
- Original PSA Birth Certificate
- Form 138 / Report Card (minimum 85% general average recommended)
- Good Moral Certificate from previous school
- 2x2 ID pictures (at least 6 copies)
- Accomplished Admission Form (available at the campus)
- Pass the entrance examination conducted on campus

ADDITIONAL REQUIREMENTS FOR TRANSFEREES
- Transcript of Records (TOR) from previous school
- Honorable Dismissal / Transfer Credentials

TUITION AND FEES
- Rates vary per college program and year level
- Payment modes: full payment or installment basis
- Scholarships available: Academic, Athletic, Cultural, and CHED subsidies
- For exact current tuition: visit the Cashier's Office or Registrar's Office

CAMPUS FACILITIES
- Library and Learning Resource Center
- Computer Laboratories
- Science Laboratories
- Gymnasium and Sports Area
- Canteen / Cafeteria
- Administrative Offices (Registrar, Cashier, Guidance, Dean's Offices)
- Medical and Dental Clinic

ACADEMIC CALENDAR
- 1st Semester : August – December
- 2nd Semester : January – May
- Summer       : June – July (select programs only)

CONTACT
- For enrollment & admission : Go to the Registrar's Office on campus
- For program inquiries       : Contact the respective College Dean's Office
- Website                    : www.arellano.edu.ph
`;


// ----------------------------------------------------------------
// Conversation history
// Stores all messages sent so far so the AI remembers context.
// ----------------------------------------------------------------
const conversationHistory = [];


// ----------------------------------------------------------------
// DOM references
// ----------------------------------------------------------------
const chatBody  = document.getElementById('chatBody');
const userInput = document.getElementById('userInput');
const sendBtn   = document.getElementById('sendBtn');


// Allow Enter key to send a message
userInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});


// ----------------------------------------------------------------
// sendMessage — called when the user clicks Send or presses Enter
// ----------------------------------------------------------------
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // 1. Show the user's message on screen
  appendMessage('user', text);
  userInput.value = '';
  sendBtn.disabled = true;

  // 2. Save to history so AI has context
  conversationHistory.push({ role: 'user', content: text });

  // 3. Show the typing "..." indicator
  const typingId = showTyping();

  try {
    // 4. Send to our Vercel serverless function at /api/chat
    //    That function securely adds the Groq API key and calls Groq.
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        systemInstructions: SYSTEM_INSTRUCTIONS
      })
    });

    // 5. Handle errors from the server
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Server returned ${response.status}`);
    }

    // 6. Parse the reply and display it
    const data  = await response.json();
    const reply = data.reply;

    removeTyping(typingId);
    appendMessage('bot', reply);

    // 7. Save bot reply to history for context
    conversationHistory.push({ role: 'assistant', content: reply });

  } catch (error) {
    removeTyping(typingId);
    appendMessage('bot',
      '⚠️ Something went wrong. Please try again.\n\n' +
      'Error details: ' + error.message
    );
    console.error('Chatbot error:', error);
  }

  sendBtn.disabled = false;
  userInput.focus();
}


// ----------------------------------------------------------------
// appendMessage — adds a message bubble to the chat window
// ----------------------------------------------------------------
function appendMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message', role === 'user' ? 'user-message' : 'bot-message');

  // Bot gets an avatar; user does not
  if (role === 'bot') {
    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = 'AU';
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.innerHTML = formatText(text);
  wrapper.appendChild(bubble);

  chatBody.appendChild(wrapper);
  scrollToBottom();
}


// ----------------------------------------------------------------
// showTyping — displays the animated "..." while waiting for AI
// ----------------------------------------------------------------
function showTyping() {
  const id = 'typing-' + Date.now();

  const wrapper = document.createElement('div');
  wrapper.classList.add('message', 'bot-message');
  wrapper.id = id;

  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.textContent = 'AU';

  const bubble = document.createElement('div');
  bubble.classList.add('bubble', 'typing-bubble');
  bubble.innerHTML = '<span></span><span></span><span></span>';

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatBody.appendChild(wrapper);
  scrollToBottom();

  return id;
}


// ----------------------------------------------------------------
// removeTyping — removes the "..." indicator
// ----------------------------------------------------------------
function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}


// ----------------------------------------------------------------
// formatText — converts plain text / markdown to safe HTML
// ----------------------------------------------------------------
function formatText(text) {
  return text
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
    .replace(/\*(.*?)\*/g,     '<em>$1</em>')           // *italic*
    .replace(/\n/g, '<br>');                            // line breaks
}


// ----------------------------------------------------------------
// scrollToBottom — keeps the chat scrolled to the latest message
// ----------------------------------------------------------------
function scrollToBottom() {
  chatBody.scrollTop = chatBody.scrollHeight;
}
