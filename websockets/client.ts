import {
    connectWebSocket,
    isWebSocketCloseEvent,
    isWebSocketPingEvent,
    isWebSocketPongEvent
  } from "https://deno.land/std@v0.31.0/ws/mod.ts";
import { encode } from "https://deno.land/std@v0.31.0/strings/mod.ts";
import { BufReader } from "https://deno.land/std@v0.31.0/io/bufio.ts";
import { TextProtoReader } from "https://deno.land/std@v0.31.0/textproto/mod.ts";
import { blue, green, red, yellow } from "https://deno.land/std@v0.31.0/fmt/colors.ts"

const endpoint = Deno.args[1] || "ws://127.0.0.1:8000";
window.onload = async () => {
    const sock = await connectWebSocket(endpoint);
    console.log(green("ws connected! (type 'close' to quit)"));
    (async function(): Promise<void> {
        for await (const msg of sock.receive()) {
            if (typeof msg === "string") {
                console.log(yellow("< " + msg));
            } else if (isWebSocketPingEvent(msg)) {
                console.log("< ping");
            } else if (isWebSocketPongEvent(msg)) {
                console.log(blue("< pong"));
            } else if (isWebSocketCloseEvent(msg)) {
                console.log(red(`closed: code=${msg.code}, reason=${msg.reason}`));
            }
        }
    })();
    const tpr = new TextProtoReader(new BufReader(Deno.stdin));
    while (true) {
        await Deno.stdout.write(encode("> "));
        const line = await tpr.readLine();
        if (line === "close") {
            break;
        } else {
            await sock.send(line.toString());
        }
        await new Promise((resolve): number => setTimeout(resolve, 0));
    }
    await sock.close(1000);
    Deno.exit(0);
};