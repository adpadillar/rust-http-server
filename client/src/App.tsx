import { useEffect, useRef, useState } from "react";

const FPS = 24;

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lastFrame, setLastFrame] = useState("");
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState("1234");
  const [role, setRole] = useState<"send" | "receive">("send");
  const videoRef = useRef<HTMLVideoElement>(null);

  // returns a frame encoded in base64

  const getFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    const data = canvas.toDataURL("image/png");
    return data;
  };

  // Initialize video stream
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 426, height: 240 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
  }, []);

  const connectToWs = () => {
    if (role == "send") {
      const newWs = new WebSocket("ws://localhost:3000/ws/send");
      newWs.onopen = () => {
        setConnected(true);
        setInterval(() => {
          newWs.send(JSON.stringify({ id: room, frame: getFrame() }));
        }, 1000 / FPS);
      };
      newWs.onclose = () => setConnected(false);

      setWs(newWs);

      return newWs;
    } else {
      const newWs = new WebSocket("ws://localhost:3000/ws/receive");
      newWs.onopen = () => {
        setConnected(true);
        setInterval(() => {
          newWs.send(JSON.stringify({ id: room, frame: "" }));
        }, 1000 / FPS);
      };
      newWs.onclose = () => setConnected(false);

      newWs.onmessage = (e) => {
        setLastFrame(e.data);
      };

      setWs(newWs);

      return newWs;
    }
  };

  // Handle disconnection if when we reconnect
  useEffect(() => {
    return () => {
      ws?.close();
    };
  }, [ws]);

  return (
    <>
      <h1>Simple Websocket Connection</h1>

      <p>
        This is a simple websocket connection between a client and a server.
      </p>

      <div>
        <span>Status: {connected ? "connected" : "disconnected"}</span>
        <br />
        {connected ? (
          <button onClick={() => ws?.close()}>Disconnect</button>
        ) : (
          <button onClick={() => connectToWs()}>Connect</button>
        )}
      </div>

      <br />

      <div>
        <span>Chose your role: </span>
        <br />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "send" | "receive")}
        >
          <option value="send">Sender</option>
          <option value="receive">Receiver</option>
        </select>
      </div>

      <p>Room: {room}</p>

      <input value={room} onChange={(e) => setRoom(e.target.value)} />

      <br />

      {role == "receive" ? (
        <div>
          <h2>Server Video Feed</h2>
          <p>This feed is being streamed from room: {room}</p>

          {lastFrame && <img src={lastFrame} alt="last frame" />}
        </div>
      ) : (
        <div>
          <h2>Local Video Feed</h2>
          <p>This feed is being streamed to a server</p>

          <video autoPlay ref={videoRef} />
        </div>
      )}
    </>
  );
}

export default App;
