import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "";

export const socket = io(SOCKET_URL || "http://localhost:3001");

socket.on("connect", () => {
  console.log("Socket ansluten, id:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket kunde inte ansluta:", err.message);
});
