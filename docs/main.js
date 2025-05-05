// Simulated user data (replace with your auth system)
const currentUser = {
  username: 'User1', // Replace with actual username from auth
  isAdmin: false,    // Replace with actual isAdmin flag from auth
  avatar: 'default-avatar.png' // Replace with actual avatar URL
};

// WebSocket connection (replace URL with your server endpoint)
const socket = new WebSocket('wss://your-websocket-server-url');

// Bad-word blacklist (expand as needed)
const badWords = ['badword1', 'badword2', 'badword3'];

// Sanitize input to prevent XSS
function sanitizeInput(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Filter bad words
function filterBadWords(text) {
  let filteredText = text;
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '***');
  });
  return filteredText;
}

// Display a message
function displayMessage(message, prepend = false) {
  const chatMessages = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message' + (message.pinned ? ' pinned' : '');
  messageElement.dataset.id = message.id;

  const timestamp = new Date(message.timestamp).toLocaleTimeString();
  messageElement.innerHTML = `
    <img src="${message.avatar}" alt="${message.username}'s avatar">
    <div class="message-content">
      <span class="message-username">${message.username}</span>
      <span class="message-timestamp">${timestamp}</span>
      <div class="message-text">${message.text}</div>
    </div>
    ${currentUser.isAdmin ? `
      <div class="message-actions">
        <button onclick="deleteMessage('${message.id}')">Delete</button>
        <button onclick="pinMessage('${message.id}')">${message.pinned ? 'Unpin' : 'Pin'}</button>
      </div>` : ''}
  `;

  if (prepend) {
    chatMessages.insertBefore(messageElement, chatMessages.firstChild);
  } else {
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Load chat history (simulated; fetch from backend in practice)
function loadChatHistory() {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.forEach(message => displayMessage(message, true));
}

// Send a message
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  let text = messageInput.value.trim();
  if (!text) return;

  text = sanitizeInput(text);
  text = filterBadWords(text);

  const message = {
    id: Date.now().toString(), // Unique ID (replace with server-generated ID)
    username: currentUser.username,
    avatar: currentUser.avatar,
    text: text,
    timestamp: new Date().toISOString(),
    pinned: false
  };

  socket.send(JSON.stringify({ type: 'message', data: message }));
  messageInput.value = '';
}

// Delete a message (admin only)
function deleteMessage(id) {
  if (!currentUser.isAdmin) return;
  socket.send(JSON.stringify({ type: 'delete', id: id }));
}

// Pin/unpin a message (admin only)
function pinMessage(id) {
  if (!currentUser.isAdmin) return;
  socket.send(JSON.stringify({ type: 'pin', id: id }));
}

// WebSocket event handlers
socket.onopen = () => {
  console.log('Connected to WebSocket server');
  loadChatHistory();
};

socket.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'message') {
    displayMessage(data);
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history.push(data);
    localStorage.setItem('chatHistory', JSON.stringify(history));
  } else if (type === 'delete') {
    const messageElement = document.querySelector(`.message[data-id="${data.id}"]`);
    if (messageElement) messageElement.remove();
    let history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history = history.filter(msg => msg.id !== data.id);
    localStorage.setItem('chatHistory', JSON.stringify(history));
  } else if (type === 'pin') {
    const messageElement = document.querySelector(`.message[data-id="${data.id}"]`);
    if (messageElement) {
      messageElement.classList.toggle('pinned');
      const pinButton = messageElement.querySelector('.message-actions button:nth-child(2)');
      pinButton.textContent = data.pinned ? 'Unpin' : 'Pin';
    }
    let history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history = history.map(msg => msg.id === data.id ? { ...msg, pinned: data.pinned } : msg);
    localStorage.setItem('chatHistory', JSON.stringify(history));
  }
};

socket.onerror = (error) => console.error('WebSocket error:', error);
socket.onclose = () => console.log('WebSocket closed');

// Event listeners
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
