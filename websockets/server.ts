import { serve } from "https://deno.land/std@v0.31.0/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket
} from "https://deno.land/std@v0.31.0/ws/mod.ts";

const body = new TextEncoder().encode("Hello, World!\n");
const s = serve(":8000");
window.onload = async () => {
  console.log("http://localhost:8000/");
  for await (const req of s) {
    const { headers, conn } = req;
    
    acceptWebSocket({
        conn,
        headers,
        bufReader: req.r,
        bufWriter: req.w
    })
    .then(
        async (sock: WebSocket): Promise<void> => {
            console.log("socket connected!");
            const it = sock.receive();
            while(true) {
                try {
                    const { done, value } = await it.next();
                    if (done) {
                        break;
                    }
                    if (isWebSocketPingEvent(value)) {
                        const [, body] = value;
                        // ping
                        console.log("ws:Ping", body);
                    } else if (isWebSocketCloseEvent(value)) {
                        const { code, reason } = value;
                        console.log("ws:Close", code, reason);
                    } else {
                        console.log(value);
                    }
                } catch (e) {
                    console.error(`failed to receive frame: ${e}`);
                    await sock.close(1000).catch(console.error);
                }
            }
        }
    ).catch((err: Error): void => {
        console.error(`failed to accept websocket: ${err}`);
    })
  }
};
