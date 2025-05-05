// 현재 사용자 정보 (인증 시스템으로 대체 가능)
const currentUser = {
  username: 'User1', // 실제 인증에서 사용자 이름으로 대체
  isAdmin: false,    // 실제 인증에서 관리자 여부로 대체
  avatar: 'default-avatar.png' // 실제 인증에서 아바타 URL로 대체
};

// WebSocket 연결 (로컬 테스트용 URL, 배포 시 실제 서버 URL로 변경)
const socket = new WebSocket('ws://localhost:8080');

// 금지어 목록 (필요에 따라 확장)
const badWords = ['badword1', 'badword2', 'badword3'];

// XSS 방지를 위한 입력 sanitization
function sanitizeInput(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 금지어 필터링
function filterBadWords(text) {
  let filteredText = text;
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '***');
  });
  return filteredText;
}

// 메시지 화면에 표시
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

// 메시지 전송
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  let text = messageInput.value.trim();
  if (!text) return;

  text = sanitizeInput(text);
  text = filterBadWords(text);

  const message = {
    username: currentUser.username,
    avatar: currentUser.avatar,
    text: text,
    timestamp: new Date().toISOString(),
    pinned: false
  };

  socket.send(JSON.stringify({ type: 'message', data: message }));
  messageInput.value = '';
}

// 메시지 삭제 (관리자만 가능)
function deleteMessage(id) {
  if (!currentUser.isAdmin) return;
  socket.send(JSON.stringify({ type: 'delete', data: { id } }));
}

// 메시지 고정/해제 (관리자만 가능)
function pinMessage(id) {
  if (!currentUser.isAdmin) return;
  socket.send(JSON.stringify({ type: 'pin', data: { id } }));
}

// WebSocket 이벤트 핸들러
socket.onopen = () => {
  console.log('Connected to WebSocket server');
};

socket.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'history') {
    // 서버에서 받은 채팅 기록 로드
    data.forEach(message => displayMessage(message, true));
  } else if (type === 'message') {
    // 새 메시지 표시
    displayMessage(data);
  } else if (type === 'delete') {
    // 메시지 삭제 반영
    const messageElement = document.querySelector(`.message[data-id="${data.id}"]`);
    if (messageElement) messageElement.remove();
  } else if (type === 'pin') {
    // 메시지 고정 상태 업데이트
    const messageElement = document.querySelector(`.message[data-id="${data.id}"]`);
    if (messageElement) {
      messageElement.classList.toggle('pinned');
      const pinButton = messageElement.querySelector('.message-actions button:nth-child(2)');
      pinButton.textContent = data.pinned ? 'Unpin' : 'Pin';
    }
  }
};

socket.onerror = (error) => console.error('WebSocket error:', error);
socket.onclose = () => console.log('WebSocket closed');

// 이벤트 리스너 추가
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
