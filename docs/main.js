// main.js

// 1. 현재 사용자 정보
let currentUser = {
  username: localStorage.getItem('nickname') || `User${Math.floor(Math.random() * 1000)}` // 닉네임 로컬 스토리지에서 가져오거나 랜덤 생성
};

// 2. WebSocket 연결 설정
const socket = new WebSocket('ws://localhost:8080'); // 서버의 WebSocket 주소 (포트 8080 사용)

// WebSocket 이벤트 핸들러
socket.onopen = () => {
  console.log('WebSocket 연결 성공');
};

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  displayMessage(msg); // 수신된 메시지 표시
};

socket.onclose = () => {
  console.log('WebSocket 연결 종료');
};

socket.onerror = (error) => {
  console.error('WebSocket 오류:', error);
};

// 3. 채팅 메시지 표시
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
    </div>
  `;
  container.append(el);
  container.scrollTop = container.scrollHeight; // 최신 메시지로 스크롤 이동
}

// 4. 메시지 전송
function sendMessage() {
  const input = document.getElementById('message-input');
  if (!input) {
    console.error('Error: #message-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  let text = input.value.trim();
  if (!text) return; // 빈 메시지 전송 방지

  const message = {
    username: currentUser.username,
    text,
    timestamp: new Date().toISOString()
  };

  // WebSocket을 통해 서버로 메시지 전송
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket이 연결되지 않았습니다.');
  }

  input.value = ''; // 입력창 초기화
}

// 5. 닉네임 변경 기능
function changeNickname() {
  const nicknameInput = document.getElementById('nickname-input');
  if (!nicknameInput) {
    console.error('Error: #nickname-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  const newNickname = nicknameInput.value.trim();
  if (newNickname) {
    currentUser.username = newNickname; // 닉네임 업데이트
    localStorage.setItem('nickname', newNickname); // 닉네임 로컬 스토리지에 저장
    console.log('Nickname changed to:', newNickname);
  } else {
    console.error('Error: 닉네임을 입력해주세요.');
  }
}

// 6. DOM 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-button');
  const messageInput = document.getElementById('message-input');
  const changeNicknameButton = document.getElementById('change-nickname-button');
  const nicknameInput = document.getElementById('nickname-input');

  // 요소가 존재하는지 확인
  if (!sendButton) {
    console.error('Error: #send-button 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  if (!messageInput) {
    console.error('Error: #message-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  if (!changeNicknameButton) {
    console.error('Error: #change-nickname-button 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  if (!nicknameInput) {
    console.error('Error: #nickname-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }

  // 메시지 전송 이벤트
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // 닉네임 변경 이벤트
  changeNicknameButton.addEventListener('click', changeNickname);
  nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') changeNickname();
  });
});
