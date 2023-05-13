import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState("No data yet");

  const handleChange = async () => {
    const res = await fetch("/api", {
      body: JSON.stringify({ current: count + 10 }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const text = await res.text();

    setCount((count) => count + 10);
    setData(text);
  };

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={handleChange}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">{data}</p>
    </>
  );
}

export default App;
