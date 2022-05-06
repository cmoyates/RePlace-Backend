import express from "express";
import { Application, Request, Response } from "express";
import { Server } from "socket.io";


const app: Application = express();

app.get("/", (_: Request, res: Response) => {
  res.send("The server is running!");
})

const PORT: number = 5000;

let server = app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));


const io = new Server(server,  {
  cors: {
    origin: ["http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

io.on("connection", socket => {
  console.log(socket.id);

  socket.on("test-event", () => {
    console.log("test");
  })
});