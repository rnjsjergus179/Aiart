const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const express = require('express');
const https = require('http');

// 1. 환경 변수 기반 포트 설정: 기본값을 10000으로 설정
const PORT = process.env.PORT || 10000;

// Express 앱 생성
const app = express();

// 2. 정적 파일 서빙: 루트 디렉토리에서 HTML/CSS/JS 제공
app.use(express.static(path.join(__dirname, '.')));

// HTTP 서버 생성
const server = http.createServer(app);

// 3. WebSocket 서버: HTTP 서버와 통합
const wss = new WebSocket.Server({ server });

// 메시지 저장 파일 경로
const MESSAGE_FILE = path.join(__dirname, 'messages.txt');

// messages.txt 파일이 없으면 생성
if (!fs.existsSync(MESSAGE_FILE)) {
  fs.writeFileSync(MESSAGE_FILE, '');
}

// 온라인 및 타이핑 사용자 목록
const onlineUsers = new Set();
const typingUsers = new Set();

// 브로드캐스트 헬퍼 함수
const broadcast = (obj) => {
  const str = JSON.stringify(obj);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  });
};

// WebSocket 연결 처리
wss.on('connection', (ws, req) => {
  // 3. 연결 로그 추가
  console.log('🟢 WS 연결됨:', req.socket.remoteAddress);

  // 초기 메시지 로드
  fs.readFile(MESSAGE_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('메시지 파일 읽기 오류:', err);
      return;
    }
    const messages = data.split('\n').filter(Boolean).map(JSON.parse);
    messages.forEach((msg) => ws.send(JSON.stringify(msg)));
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    const timestamp = new Date().toISOString();

    switch (msg.type) {
      case 'join':
        ws.username = msg.username;
        onlineUsers.add(msg.username);
        broadcast({ type: 'join', username: msg.username, timestamp });
        broadcast({ type: 'userList', users: Array.from(onlineUsers) });
        break;
      case 'message':
        const messageObj = { type: 'message', username: msg.username, text: msg.text, timestamp };
        fs.appendFile(MESSAGE_FILE, JSON.stringify(messageObj) + '\n', (err) => {
          if (err) console.error('메시지 저장 오류:', err);
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

// 4. 포트 리스닝 확인
server.listen(PORT, () => {
  console.log(`HTTP 및 WebSocket 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log('ENV PORT:', process.env.PORT); // 디버깅용 환경 변수 확인
});
