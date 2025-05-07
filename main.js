// 1. 현재 사용자 정보
let currentUser = {
  username: localStorage.getItem('nickname') || `User${Math.floor(Math.random() * 1000)}` // 닉네임 로컬 스토리지에서 가져오거나 랜덤 생성
};

// 2. WebSocket 연결 설정
const wsProtocol = 'wss:'; // Render는 HTTPS를 사용하므로 wss: 사용
const wsUrl = `${wsProtocol}//aiart-z1dy.onrender.com`; // Render의 정적 배포 서버 URL
console.log('Attempting to connect to WebSocket at:', wsUrl); // 디버깅용 로그 추가
const socket = new WebSocket(wsUrl);

// WebSocket 이벤트 핸들러
socket.onopen = () => {
  console.log('WebSocket 연결 성공');
  socket.send(JSON.stringify({ type: 'join', username: currentUser.username }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'message') {
    displayMessage(data); // 메시지 표시
  } else if (data.type === 'userList') {
    updateUserList(data.users); // 온라인 사용자 목록 업데이트
  } else if (data.type === 'typing') {
    showTypingIndicator(data.username); // 입력 중 표시
  } else if (data.type === 'stopTyping') {
    hideTypingIndicator(data.username); // 입력 중 숨김
  } else if (data.type === 'join') {
    displayJoinMessage(data); // 사용자 접속 메시지 표시
  } else if (data.type === 'leave') {
    displayLeaveMessage(data); // 사용자 퇴장 메시지 표시
  }
};

socket.onclose = () => {
  console.log('WebSocket 연결 종료');
};

socket.onerror = (error) => {
  console.error('WebSocket 오류:', error);
};

// 3. 채팅 메시지 표시 (번역 버튼 포함)
function displayMessage(msg) {
  const container = document.getElementById('chat-messages');
  if (!container) {
    console.error('Error: #chat-messages 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  const el = document.createElement('div');
  el.className = 'message';
  el.innerHTML = `
    <div class="message-content">
      <span class="message-username">${msg.username}</span>
      <span class="message-timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
      <div class="message-text">${msg.text}</div>
      <button class="translate-toggle" data-action="translate-toggle">✔️ 번역 보기</button>
    </div>
  `;
  container.append(el);
  container.scrollTop = container.scrollHeight; // 최신 메시지로 스크롤 이동
}

// 4. 사용자 접속 메시지 표시
function displayJoinMessage(data) {
  const container = document.getElementById('chat-messages');
  if (!container) {
    console.error('Error: #chat-messages 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  const el = document.createElement('div');
  el.className = 'message';
  el.innerHTML = `
    <div class="message-content">
      <span class="message-username">${data.username} has joined the chat</span>
      <span class="message-timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    </div>
  `;
  container.append(el);
  container.scrollTop = container.scrollHeight;
}

// 5. 사용자 퇴장 메시지 표시
function displayLeaveMessage(data) {
  const container = document.getElementById('chat-messages');
  if (!container) {
    console.error('Error: #chat-messages 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  const el = document.createElement('div');
  el.className = 'message';
  el.innerHTML = `
    <div class="message-content">
      <span class="message-username">${data.username} has left the chat</span>
      <span class="message-timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    </div>
  `;
  container.append(el);
  container.scrollTop = container.scrollHeight;
}

// 6. 온라인 사용자 목록 업데이트
function updateUserList(users) {
  const userListContainer = document.getElementById('user-list');
  if (!userListContainer) {
    console.error('Error: #user-list 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  userListContainer.innerHTML = ''; // 기존 목록 초기화
  users.forEach((user) => {
    const userEl = document.createElement('div');
    userEl.textContent = user;
    userListContainer.appendChild(userEl);
  });
}

// 7. 입력 중 표시
let typingUsers = new Set();
function showTypingIndicator(username) {
  typingUsers.add(username);
  updateTypingIndicator();
}

function hideTypingIndicator(username) {
  typingUsers.delete(username);
  updateTypingIndicator();
}

function updateTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (!typingIndicator) {
    console.error('Error: #typing-indicator 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  if (typingUsers.size > 0) {
    typingIndicator.textContent = `${Array.from(typingUsers).join(', ')}님이 입력 중...`;
  } else {
    typingIndicator.textContent = '';
  }
}

// 8. 메시지 전송
function sendMessage() {
  const input = document.getElementById('message-input');
  if (!input) {
    console.error('Error: #message-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  let text = input.value.trim();
  if (!text) return; // 빈 메시지 전송 방지

  const message = {
    type: 'message',
    username: currentUser.username,
    text,
    timestamp: new Date().toISOString()
  };

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket이 연결되지 않았습니다.');
  }

  input.value = ''; // 입력창 초기화
}

// 9. 닉네임 변경 기능
function changeNickname() {
  const nicknameInput = document.getElementById('nickname-input');
  if (!nicknameInput) {
    console.error('Error: #nickname-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  const newNickname = nicknameInput.value.trim();
  if (newNickname && newNickname !== currentUser.username) {
    const oldNickname = currentUser.username;
    socket.send(JSON.stringify({ type: 'leave', username: oldNickname }));
    socket.send(JSON.stringify({ type: 'join', username: newNickname }));
    currentUser.username = newNickname;
    localStorage.setItem('nickname', newNickname);
    console.log('Nickname changed to:', newNickname);
  } else {
    console.error('Error: 닉네임을 입력해주세요.');
  }
}

// 10. 타이핑 이벤트 처리
let typingTimeout;
function handleTyping() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'typing', username: currentUser.username }));
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'stopTyping', username: currentUser.username }));
    }, 3000); // 3초 후 입력 중지
  }
}

// 11. DOM 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-button');
  const messageInput = document.getElementById('message-input');
  const changeNicknameButton = document.getElementById('change-nickname-button');
  const nicknameInput = document.getElementById('nickname-input');

  if (!sendButton || !messageInput || !changeNicknameButton || !nicknameInput) {
    console.error('Error: 필요한 DOM 요소를 찾을 수 없습니다. HTML을 확인해주세요.');
    return;
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  changeNicknameButton.addEventListener('click', changeNickname);
  nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') changeNickname();
  });

  messageInput.addEventListener('input', handleTyping);
});

// 12. 번역 토글 기능
document.addEventListener('click', (e) => {
  if (e.target.dataset.action === 'translate-toggle') {
    const msgEl = e.target.closest('.message');
    const isShown = msgEl.querySelector('.translation');
    if (isShown) {
      // 번역 숨기기
      msgEl.removeChild(isShown);
      e.target.textContent = '✔️ 번역 보기';
    } else {
      // 번역 요청
      const originalText = msgEl.querySelector('.message-text').textContent;
      const targetLang = navigator.language || 'en'; // 사용자 로컬 언어 또는 기본값 'en'
      fetch('/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, targetLang })
      })
      .then(res => res.json())
      .then(data => {
        const div = document.createElement('div');
        div.className = 'translation';
        div.textContent = data.translatedText;
        msgEl.append(div);
        e.target.textContent = '숨기기';
      })
      .catch(error => console.error('번역 오류:', error));
    }
  }
});
