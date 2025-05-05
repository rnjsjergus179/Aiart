// main.js

// 1. 현재 사용자 정보
let currentUser = {
  username: 'User1' // 초기 닉네임 (사용자가 변경 가능)
};

// 2. 채팅 메시지 표시 (프로필 이미지 제거)
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

// 3. 메시지 전송
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

  // 서버로 메시지 전송 (WebSocket 또는 HTTP 요청으로 대체 가능)
  console.log('Sending message:', message); // 임시 콘솔 출력 (서버 전송 로직 필요)
  displayMessage(message); // 로컬에서 메시지 표시 (임시)

  input.value = ''; // 입력창 초기화
}

// 4. 닉네임 변경 기능
function changeNickname() {
  const nicknameInput = document.getElementById('nickname-input');
  if (!nicknameInput) {
    console.error('Error: #nickname-input 요소를 찾을 수 없습니다. HTML에 추가해주세요.');
    return;
  }
  const newNickname = nicknameInput.value.trim();
  if (newNickname) {
    currentUser.username = newNickname; // 닉네임 업데이트 (임시 저장)
    console.log('Nickname changed to:', newNickname);
  } else {
    console.error('Error: 닉네임을 입력해주세요.');
  }
}

// 5. DOM 이벤트 리스너
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
