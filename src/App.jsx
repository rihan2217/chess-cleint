import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Chessboard } from "react-chessboard";

const socket = io("http://localhost:3001"); // ⚡ change to your Render server URL when deployed

function App() {
  const [gameFen, setGameFen] = useState("start");
  const [turn, setTurn] = useState("w");
  const [myColor, setMyColor] = useState(null); // "white" | "black" | "spectator"
  const [players, setPlayers] = useState({ white: false, black: false });
  const [lastMove, setLastMove] = useState(null);

  useEffect(() => {
    // Join room auto-assign color
    socket.emit("join", { roomId: "room1", color: "auto" });

    // Receive assigned color
    socket.on("colorAssigned", ({ color }) => {
      setMyColor(color);
      console.log("You are assigned:", color);
    });

    // Board/game state updates
    socket.on("state", ({ fen, turn, lastMove, players }) => {
      setGameFen(fen);
      setTurn(turn);
      setLastMove(lastMove);
      if (players) setPlayers(players);
    });

    // Players update
    socket.on("players", (players) => {
      setPlayers(players);
    });

    // Game over
    socket.on("gameOver", (info) => {
      let msg = "Game Over: ";
      if (info.checkmate) msg += `Checkmate! Winner: ${info.winner}`;
      else if (info.stalemate) msg += "Stalemate!";
      else if (info.draw) msg += "Draw!";
      alert(msg);
    });

    return () => {
      socket.emit("leaveRoom", { roomId: "room1" });
      socket.off();
    };
  }, []);

  // Attempt a move
  function onDrop(sourceSquare, targetSquare) {
    if (myColor === "spectator") {
      alert("You are a spectator and cannot move pieces!");
      return false;
    }

    const turnColor = turn === "w" ? "white" : "black";
    if (turnColor !== myColor) {
      alert("Not your turn!");
      return false;
    }

    socket.emit("move", {
      roomId: "room1",
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
    return true;
  }

  // Reset board
  function handleReset() {
    socket.emit("reset", { roomId: "room1" });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-2">♟️ Realtime Chess</h1>
      <p className="mb-4">
        You are: <span className="font-bold">{myColor || "connecting..."}</span>
      </p>

      <Chessboard
        position={gameFen}
        onPieceDrop={onDrop}
        boardOrientation={myColor === "black" ? "black" : "white"}
        customBoardStyle={{
          borderRadius: "12px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
        }}
      />

      <p className="mt-4">
        Turn: <span className="font-bold">{turn === "w" ? "White" : "Black"}</span>
      </p>

      {lastMove && (
        <p className="mt-2 text-sm text-gray-300">
          Last Move: {lastMove.san} ({lastMove.from} → {lastMove.to})
        </p>
      )}

      <div className="mt-4 space-x-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Reset Game
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Players: White {players.white ? "✅" : "❌"} | Black{" "}
        {players.black ? "✅" : "❌"}
      </div>
    </div>
  );
}

export default App;
