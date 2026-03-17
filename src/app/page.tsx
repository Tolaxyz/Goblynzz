"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("../../component/GameCanvas"), {
  ssr: false,
});

export default function GamePage() {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#6a0dad,#ffffff)",
        width: "100vw",
        height: "100vh",
      }}
    >
      <GameCanvas />
    </div>
  );
}
