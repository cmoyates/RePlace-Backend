import express from "express";
import { Application, Request, Response } from "express";
import { Server } from "socket.io";
import "./db";
import Grid, {IGrid} from "./grid";
import mongoose from "mongoose";
import db from "./db";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const WIDTH: number = 64;
const HEIGHT: number = 36;

let localGrid: IGrid;

Grid.findOne({}, function (err: any, foundGrid: IGrid) {
  if (foundGrid === null) {
    let colorArray: string[][] = [];
    for (let x = 0; x < WIDTH; x++) {
      let colorCol: string[] = [];
      for (let y = 0; y < HEIGHT; y++) {
        colorCol.push("#ffffff");
      }
      colorArray.push(colorCol);
    }

    const newGrid = new Grid({
      _id: new mongoose.Types.ObjectId(),
      colors: colorArray
    });
    newGrid.save();
    localGrid = newGrid;
    console.log("Generated New Grid");
  }
  else {
    localGrid = foundGrid;
    console.log("Loaded Grid");
  }
});


const app: Application = express();

app.get("/", (_: Request, res: Response) => {
  res.send("The server is running!");
})

let server = app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));



const io = new Server(server,  {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

io.on("connection", socket => {
  console.log(`User connected with id: ${socket.id}`);
  io.to(socket.id).emit("init", localGrid.colors);

  socket.on("place-pixel", async (pos, color) => {
    console.log(`Pixel (${pos.x}, ${pos.y}) has been set to: ${color}`);
    localGrid.colors[pos.x][pos.y] = color;
    localGrid.markModified('colors');
    socket.broadcast.emit("pixel-placed-by-user", pos, color);
  })
});

process.on('SIGINT', () => {
  localGrid.save().then(() => {
    console.log("Grid saved");
    db.close();
    server.close();
  });
});