// main.js

// 1. 현재 사용자 정보 (실제 인증 시스템으로 대체 가능)
const currentUser = {
  username: 'User1',            // 로그인한 유저명으로 대체
  isAdmin: false,               // 관리자 여부를 실제 인증에서 가져오기
  avatar: 'default-avatar.png'  // 프로필 이미지 URL로 대체
};

// 2. WebSocket 연결 (배포 시에는 wss://도메인:포트 로 변경)
const socket = new WebSocket('ws://localhost:8080');

// 3. 금지어 목록 (필요에 따라 확장)
const badWords = ['badword1', 'badword2', 'badword3'];

// 4. 입력값 XSS 방지
function sanitizeInput(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 5. 금지어 필터링
function filterBadWords(text) {
  let filtered = text;
  badWords.forEach(word => {
    const re = new RegExp(word, 'gi');
    filtered = filtered.replace(re, '***');
  });
  return filtered;
}

// 6. 화면에 메시지 표시
function displayMessage(msg, prepend = false) {
  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'message' + (msg.pinned ? ' pinned' : '');
  el.dataset.id = msg.id;
  el.innerHTML = `
    <img src="${msg.avatar}" width="30" height="30" />
    <div class="message-content">
      <span class="message-username">${msg.username}</span>
      <span class="message-timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
      <div class="message-text">${msg.text}</div>
    </div>
    ${currentUser.isAdmin ? `
      <div class="message-actions">
        <button onclick="deleteMessage('${msg.id}')">삭제</button>
        <button onclick="pinMessage('${msg.id}')">${msg.pinned ? '고정해제' : '고정'}</button>
      </div>` : ''}
  `;
  if (prepend) container.prepend(el);
  else {
    container.append(el);
    container.scrollTop = container.scrollHeight;
  }
}

// 7. 메시지 전송
function sendMessage() {
  const input = document.getElementById('message-input');
  let text = input.value.trim();
  if (!text) return;
  text = sanitizeInput(filterBadWords(text));

  const message = {
    username: currentUser.username,
    avatar: currentUser.avatar,
    text,
    timestamp: new Date().toISOString(),
    pinned: false
  };

  socket.send(JSON.stringify({ type: 'message', data: message }));
  input.value = '';
}

// 8. 메시지 삭제 (관리자)
function deleteMessage(id) {
  if (!currentUser.isAdmin) return;
  socket.send(JSON.stringify({ type: 'delete', data: { id } }));
}

// 9. 메시지 고정/해제 (관리자)
function pinMessage(id) {
  if (!currentUser.isAdmin) return;
  socket.send(JSON.stringify({ type: 'pin', data: { id } }));
}

// 10. WebSocket 이벤트 핸들러
socket.onopen = () => console.log('WebSocket 연결됨');
socket.onmessage = event => {
  const { type, data } = JSON.parse(event.data);
  switch (type) {
    case 'history':
      data.forEach(msg => displayMessage(msg, true));
      break;
    case 'message':
      displayMessage(data);
      break;
    case 'delete':
      document.querySelector(`.message[data-id="${data.id}"]`)?.remove();
      break;
    case 'pin':
      const el = document.querySelector(`.message[data-id="${data.id}"]`);
      if (el) el.classList.toggle('pinned', data.pinned);
      break;
  }
};
socket.onerror = err => console.error('WebSocket 에러:', err);
socket.onclose = () => console.log('WebSocket 연결 종료');

// 11. DOM 이벤트 리스너
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});
