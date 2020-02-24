const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8010});
const code2ws = new Map();

wss.on('connection', (ws, request) => {
    const code = Math.floor(Math.random() * (999999 - 100000)) + 10000;
    code2ws.set(code, ws);
    ws.sendData = (event, data) => {
      ws.send(JSON.stringify({ event, data }));
    };
    ws.on('message', (message) => {
        console.log('incoming', message);
        let parseMessage = {};
        try {
            parseMessage = JSON.parse(message);
        } catch(e) {
            console.log('parse message error', e);
            return;
        }
        const { event, data } = parseMessage;
        if(event === 'login') {
            ws.sendData('logined', { code });
        }
        if(event === 'control') {
            const remote = +data.remote;
            if(code2ws.has(remote)) {
                ws.sendData('controlled', { remote });
                const remoteWs = code2ws.get(remote);
                ws.sendRemote = remoteWs.sendData;
                remoteWs.sendRemote = ws.sendData;
                ws.sendRemote('be-controlled', { remote: code });
            }
        }
        if(event === 'forward') {
            ws.sendRemote(data.event, data.data);
        }
    });
    ws.on('close', () => {
        code2ws.delete(code);
        clearTimeout(ws._closeTimeout);
    });
    ws._closeTimeout = setTimeout(() => {
        ws.terminate();
    }, 10 * 60 * 1000);
});
