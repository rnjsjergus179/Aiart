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

// WebSocket 연결 처리
wss.on('connection', (ws) => {
  console.log('클라이언트 연결됨');

  // 기존 메시지를 클라이언트에 전송 (선택 사항)
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

  ws.on('message', (message) => {
    console.log('수신된 메시지:', message);
    const msg = JSON.parse(message);

    // 메시지를 messages.txt 파일에 저장
    fs.appendFile(MESSAGE_FILE, JSON.stringify(msg) + '\n', (err) => {
      if (err) {
        console.error('메시지 저장 오류:', err);
      }
    });

    // 모든 클라이언트에게 메시지 브로드캐스트
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('클라이언트 연결 종료');
  });
});

// HTTP 및 WebSocket 서버 실행
server.listen(PORT, () => {
  console.log(`HTTP 및 WebSocket 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
