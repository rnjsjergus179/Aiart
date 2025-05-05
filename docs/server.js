const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// 메시지 파일 경로 (같은 폴더 내 messages.txt)
const MESSAGES_FILE = 'messages.txt';

// 메시지 불러오기 함수
function loadMessages() {
  try {
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []; // 파일이 없으면 빈 배열 반환
    }
    throw err;
  }
}

// 메시지 저장 함수
function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// 메시지 초기화 (서버 시작 시 파일에서 불러옴)
let messages = loadMessages();

// WebSocket 서버 생성 (포트 8080에서 실행)
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New client connected');

  // 새 클라이언트에게 기존 메시지 기록 전송
  ws.send(JSON.stringify({ type: 'history', data: messages }));

  ws.on('message', (message) => {
    const { type, data } = JSON.parse(message);

    if (type === 'message') {
      // 새 메시지에 고유 ID 부여
      data.id = uuidv4();
      messages.push(data);
      saveMessages(messages); // 파일에 저장
      // 모든 클라이언트에 메시지 broadcast
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'message', data }));
        }
      });
    } else if (type === 'delete') {
      // 메시지 삭제
      messages = messages.filter((msg) => msg.id !== data.id);
      saveMessages(messages); // 파일에 저장
      // 모든 클라이언트에 삭제 알림
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'delete', data }));
        }
      });
    } else if (type === 'pin') {
      // 메시지 고정/해제
      const msg = messages.find((m) => m.id === data.id);
      if (msg) {
        msg.pinned = !msg.pinned;
        saveMessages(messages); // 파일에 저장
        // 모든 클라이언트에 고정 상태 업데이트
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'pin', data: { id: msg.id, pinned: msg.pinned } }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws:https://glorious-zebra-5g54qgv6wxqr34wj5-8080.app.github.dev/');
