import { useEffect, useState } from 'react';

const WS_URL = 'ws://127.0.0.1:8765';

const JarvisStatus = () => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws;
    let tryCount = 0;
    let timer;

    const connect = () => {
      tryCount += 1;
      try {
        ws = new WebSocket(WS_URL);
      } catch (e) {
        setConnected(false);
        scheduleReconnect();
        return;
      }

      const onOpen = () => {
        // успешное подключение — сбрасываем счётчик попыток и очищаем таймер
        setConnected(true);
        tryCount = 0;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
      const onClose = () => {
        setConnected(false);
        scheduleReconnect();
      };
      const onError = () => {
        setConnected(false);
        try {
          if (ws) ws.close();
        } catch (e) {
          /* ignore */
        }
        // при ошибке пробуем переподключиться
        scheduleReconnect();
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('close', onClose);
      ws.addEventListener('error', onError);

      function scheduleReconnect() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          connect();
        }, Math.min(5000 * tryCount, 30000));
      }
    };

    connect();

    return () => {
      try { if (timer) clearTimeout(timer); } catch (e) { /* ignore */ }
      try { if (ws) ws.close(); } catch (e) { /* ignore */ }
    };
  }, []);

  return (
    <div className='ml-3 hidden md:flex items-center text-sm'>
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-600 text-black' : 'bg-red-600 text-white'}`}>
        {connected ? 'Jarvis: connected' : 'Jarvis: offline'}
      </span>
    </div>
  );
};

export default JarvisStatus;
