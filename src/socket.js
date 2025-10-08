import { io } from "socket.io-client";

export const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Socket ansluten, id:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket kunde inte ansluta:", err.message);
});
