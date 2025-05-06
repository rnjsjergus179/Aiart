const WebSocket = require('ws');
const fs = require('fs');
const server = new WebSocket.Server({ port: 8080 });

// 메시지를 저장할 파일 경로 (같은 폴더 내 messages.txt)
const MESSAGE_FILE = './messages.txt';

// 서버 시작 시 messages.txt 파일이 없으면 생성
if (!fs.existsSync(MESSAGE_FILE)) {
  fs.writeFileSync(MESSAGE_FILE, '');
}

server.on('connection', (ws) => {
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
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('클라이언트 연결 종료');
  });
});

console.log('WebSocket 서버가 포트 8080에서 실행 중입니다.');
