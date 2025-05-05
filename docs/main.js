// main.js

// 1. 현재 사용자 정보 (실제 인증 시스템으로 대체 가능)
const currentUser = {
  username: 'User1',            // 로그인한 유저명으로 대체 (닉네임)
  isAdmin: false,               // 관리자 여부를 실제 인증에서 가져오기
  avatar: 'default-avatar.png'  // 프로필 이미지 URL로 대체
};

// 2. WebSocket 연결 (배포 시에는 wss://도메인:포트로 변경)
const socket = new WebSocket('ws:https://glorious-zebra-5g54qgv6wxqr34wj5-8080.app.github.dev/');

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

// 6. 서버로 로그 전송 함수
function sendLogToServer(message) {
  socket.send(JSON.stringify({ type: 'log', data: message }));
}

// 7. 화면에 메시지 표시
function displayMessage(msg, prepend = false) {
  sendLogToServer('Displaying message: ' + JSON.stringify(msg)); // 서버로 디버깅 로그 전송
  const container = document.getElementById('chat-messages');
  if (!container) {
    sendLogToServer('Error: #chat-messages 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
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
    container.scrollTop = container.scrollHeight; // 최신 메시지로 스크롤 이동
  }
}

// 8. 메시지 전송
function sendMessage() {
  const input = document.getElementById('message-input');
  if (!input) {
    sendLogToServer('Error: #message-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  let text = input.value.trim();
  if (!text) return; // 빈 메시지 전송 방지
  text = sanitizeInput(filterBadWords(text));

  const message = {
    username: currentUser.username,
    avatar: currentUser.avatar,
    text,
    timestamp: new Date().toISOString(),
    pinned: false
  };

  sendLogToServer('Sending message: ' + JSON.stringify(message)); // 서버로 전송 로그 전송
  socket.send(JSON.stringify({ type: 'message', data: message }));
  input.value = ''; // 입력창 초기화
}

// 9. 메시지 삭제 (관리자)
function deleteMessage(id) {
  if (!currentUser.isAdmin) return;
  sendLogToServer('Deleting message: ' + id); // 서버로 삭제 로그 전송
  socket.send(JSON.stringify({ type: 'delete', data: { id } }));
}

// 10. 메시지 고정/해제 (관리자)
function pinMessage(id) {
  if (!currentUser.isAdmin) return;
  sendLogToServer('Pinning/Unpinning message: ' + id); // 서버로 고정 로그 전송
  socket.send(JSON.stringify({ type: 'pin', data: { id } }));
}

// 11. WebSocket 이벤트 핸들러
socket.onopen = () => {
  sendLogToServer('WebSocket 연결됨'); // 서버로 연결 성공 로그 전송
};
socket.onmessage = event => {
  sendLogToServer('Received from server: ' + event.data); // 서버로 수신 데이터 로그 전송
  const { type, data } = JSON.parse(event.data);
  switch (type) {
    case 'history': // 채팅 기록 로드
      data.forEach(msg => displayMessage(msg, true));
      break;
    case 'message': // 새 메시지 표시
      displayMessage(data);
      break;
    case 'delete': // 메시지 삭제
      document.querySelector(`.message[data-id="${data.id}"]`)?.remove();
      break;
    case 'pin': // 메시지 고정/해제
      const el = document.querySelector(`.message[data-id="${data.id}"]`);
      if (el) el.classList.toggle('pinned', data.pinned);
      break;
  }
};
socket.onerror = err => {
  sendLogToServer('WebSocket 에러: ' + err.message); // 서버로 에러 로그 전송
};
socket.onclose = () => {
  sendLogToServer('WebSocket 연결 종료'); // 서버로 연결 종료 로그 전송
};

// 12. DOM 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => { // DOM이 로드된 후 실행
  const sendButton = document.getElementById('send-button');
  const messageInput = document.getElementById('message-input');

  if (!sendButton) {
    sendLogToServer('Error: #send-button 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  if (!messageInput) {
    sendLogToServer('Error: #message-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
});
