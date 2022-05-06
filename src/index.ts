import express from "express";
import { Application, Request, Response } from "express";
import { Server } from "socket.io";


const app: Application = express();

app.get("/", (_: Request, res: Response) => {
  res.send("The server is running!");
})

const PORT: number = 5000;

let server = app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));


let grid: string[][] = [];

for (let x = 0; x < 40; x++) {
  let gridCol: string[] = [];
  for (let y = 0; y < 30; y++) {
    gridCol.push("#ffffff");
  }
  grid.push(gridCol);
}


const io = new Server(server,  {
  cors: {
    origin: ["http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

io.on("connection", socket => {
  console.log(`User connected with id: ${socket.id}`);
  io.to(socket.id).emit("init", grid);

  socket.on("place-pixel", (pos, color) => {
    console.log(`Pixel (${pos.x}, ${pos.y}) has been set to: ${color}`);
    grid[pos.x][pos.y] = color;

    socket.broadcast.emit("pixel-placed-by-user", pos, color);
  })
});