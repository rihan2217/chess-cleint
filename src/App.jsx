import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Chessboard } from "react-chessboard";

const socket = io("https://your-render-server.onrender.com", {
  transports: ["websocket"], // helps with CORS/timeouts
});

function App() {
  const [gameFen, setGameFen] = useState("start");
  const [turn, setTurn] = useState("w");
  const [myColor, setMyColor] = useState(null); // "white" | "black" | "spectator"
  const [players, setPlayers] = useState({ white: false, black: false });
  const [lastMove, setLastMove] = useState(null);
  const [gameOverInfo, setGameOverInfo] = useState(null);
  const [showStartModal, setShowStartModal] = useState(true);

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
      setGameOverInfo(info);
    });

    return () => {
      socket.emit("leaveRoom", { roomId: "room1" });
      socket.off();
    };
  }, []);

  // Attempt a move
  function onDrop(sourceSquare, targetSquare) {
    if (myColor === "spectator") {
      return false;
    }

    const turnColor = turn === "w" ? "white" : "black";
    if (turnColor !== myColor) {
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
    setGameOverInfo(null);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-center drop-shadow-lg">
        ♟️ Realtime Chess
      </h1>
      <p className="mb-4 text-center">
        You are:{" "}
        <span className="font-bold text-yellow-400">
          {myColor || "connecting..."}
        </span>
      </p>

      {/* Chessboard (responsive) */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        <Chessboard
          position={gameFen}
          onPieceDrop={onDrop}
          boardOrientation={myColor === "black" ? "black" : "white"}
          customBoardStyle={{
            borderRadius: "12px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.6)",
          }}
        />
      </div>

      {/* Info section */}
      <p className="mt-4 text-lg">
        Turn:{" "}
        <span className="font-bold text-green-400">
          {turn === "w" ? "White" : "Black"}
        </span>
      </p>

      {lastMove && (
        <p className="mt-2 text-sm text-gray-300">
          Last Move: {lastMove.san} ({lastMove.from} → {lastMove.to})
        </p>
      )}

      <div className="mt-4 space-x-4">
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md"
        >
          Reset Game
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Players: White {players.white ? "✅" : "❌"} | Black{" "}
        {players.black ? "✅" : "❌"}
      </div>

      {/* Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-2xl text-center shadow-lg w-80">
            <h2 className="text-2xl font-bold mb-4">Welcome to Chess!</h2>
            <p className="mb-4 text-gray-300">
              You are playing as{" "}
              <span className="text-yellow-400">{myColor || "..."}</span>.
            </p>
            <button
              onClick={() => setShowStartModal(false)}
              className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-all"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-2xl text-center shadow-lg w-80">
            <h2 className="text-2xl font-bold mb-4">Game Over</h2>
            <p className="mb-4 text-gray-300">
              {gameOverInfo.checkmate && (
                <>Checkmate! Winner: {gameOverInfo.winner}</>
              )}
              {gameOverInfo.stalemate && <>Stalemate!</>}
              {gameOverInfo.draw && <>Draw!</>}
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
