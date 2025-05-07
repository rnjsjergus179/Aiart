const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

// Render에서 제공하는 PORT 환경 변수 사용 (기본값 8080)
const PORT = process.env.PORT || 8080;

// Express 앱 생성
const app = express();

// 루트 디렉토리의 정적 파일 서빙 (HTML, CSS, JS 등)
app.use(express.static(path.join(__dirname, '.')));

// HTTP 서버 생성
const server = http.createServer(app);

// WebSocket 서버 생성 (HTTP 서버와 통합)
const wss = new WebSocket.Server({ server });

// 메시지를 저장할 파일 경로 (루트 디렉토리 내 messages.txt)
const MESSAGE_FILE = path.join(__dirname, 'messages.txt');

// messages.txt 파일이 없으면 생성
if (!fs.existsSync(MESSAGE_FILE)) {
  fs.writeFileSync(MESSAGE_FILE, '');
}

// 온라인 사용자 목록 (Set으로 중복 방지)
const onlineUsers = new Set();

// 타이핑 중인 사용자 목록 (Set으로 중복 방지)
const typingUsers = new Set();

// 공통 브로드캐스트 헬퍼
const broadcast = (obj) => {
  const str = JSON.stringify(obj);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  });
};

// WebSocket 연결 처리
wss.on('connection', (ws) => {
  console.log('클라이언트 연결됨');

  // 초기 메시지 로드
  fs.readFile(MESSAGE_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('메시지 파일 읽기 오류:', err);
      return;
    }
    const messages = data.split('\n').filter(Boolean).map(JSON.parse);
    messages.forEach((msg) => {
      ws.send(JSON.stringify(msg));
    });
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    const timestamp = new Date().toISOString();

    switch (msg.type) {
      case 'join':
        ws.username = msg.username; // WebSocket 인스턴스에 username 저장
        onlineUsers.add(msg.username);
        broadcast({ type: 'join', username: msg.username, timestamp });
        broadcast({ type: 'userList', users: Array.from(onlineUsers) });
        break;
      case 'message':
        const messageObj = { type: 'message', username: msg.username, text: msg.text, timestamp };
        fs.appendFile(MESSAGE_FILE, JSON.stringify(messageObj) + '\n', (err) => {
          if (err) {
            console.error('메시지 저장 오류:', err);
          }
        });
        broadcast(messageObj);
        break;
      case 'typing':
        typingUsers.add(msg.username);
        broadcast({ type: 'typing', username: msg.username });
        break;
      case 'stopTyping':
        typingUsers.delete(msg.username);
        broadcast({ type: 'stopTyping', username: msg.username });
        break;
      case 'leave':
        onlineUsers.delete(msg.username);
        broadcast({ type: 'leave', username: msg.username, timestamp });
        broadcast({ type: 'userList', users: Array.from(onlineUsers) });
        break;
    }
  });

  ws.on('close', () => {
    console.log('클라이언트 연결 종료');
    if (ws.username) {
      onlineUsers.delete(ws.username);
      const timestamp = new Date().toISOString();
      broadcast({ type: 'leave', username: ws.username, timestamp });
      broadcast({ type: 'userList', users: Array.from(onlineUsers) });
    }
  });
});

server.listen(PORT, () => {
  console.log(`HTTP 및 WebSocket 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
