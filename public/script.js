const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Track chat history array state for Gemini's context
let conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  const greeting = document.getElementById('dashboard-greeting');
  if (greeting) {
    greeting.remove();
  }

  // 1. Add user message visually & push to our history tracker
  appendMessage('user', userMessage);
  conversationHistory.push({ role: 'user', text: userMessage });
  input.value = '';

  // 2. Add a temporary loading state
  const loadingId = appendMessage('bot', 'Gemini is thinking...');

  try {
    // 3. Make the API request to our backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: conversationHistory })
    });

    const data = await response.json();

    // Remove the placeholder message
    loadingId.remove();

    if (response.ok) {
      // 4. Display the real answer & push it to our history tracker
      appendMessage('bot', data.result);
      conversationHistory.push({ role: 'bot', text: data.result });
    } else {
      appendMessage('bot', `Error: ${data.message}`);
    }
  } catch (error) {
    loadingId.remove();
    console.error(error);
    appendMessage('bot', 'Gagal menghubungi server.');
  }
});

// Adjusted helper to return the element reference so we can easily delete the loading text later
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  if (sender === 'bot') {
    // Use marked.js to render markdown for bot messages
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; 
}