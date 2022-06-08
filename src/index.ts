import express from "express";
import { Application, Request, Response } from "express";
import { Server } from "socket.io";
import Grid, {IGrid} from "./grid";
import mongoose from "mongoose";
import "./db";

// Constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const WIDTH: number = 64;
const HEIGHT: number = 36;

// The local variable for the current state of the grid
let localGrid: IGrid;

// Try to get the grid from the databse
Grid.findOne({}).then(function (foundGrid: (IGrid & { _id: any; }) | null) {
  // If nothing is found
  if (foundGrid === null) {
    // Create an new grid that is all white
    let colorArray: string[][] = [];
    for (let x = 0; x < WIDTH; x++) {
      let colorCol: string[] = [];
      for (let y = 0; y < HEIGHT; y++) {
        colorCol.push("#ffffff");
      }
      colorArray.push(colorCol);
    }
    // Add it to the database
    const newGrid = new Grid({
      _id: new mongoose.Types.ObjectId(),
      colors: colorArray
    });
    newGrid.save();
    // Set the local variable
    localGrid = newGrid;
    console.log("Generated New Grid");
  }
  else {
    // Otherwise just set the local variable to the value from the database
    localGrid = foundGrid;
    console.log("Loaded Grid");
  }
}).then(() => {
  // Once that's done, start an express server listening on the specified port
  const app: Application = express();

  app.get("/", (_: Request, res: Response) => {
    res.send("The server is running!");
  })

  let server = app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));


  // Start a web socket connection from that server
  const io = new Server(server,  {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  // Whenever someone connects to that websocket
  io.on("connection", socket => {
    console.log(`User connected with id: ${socket.id}`);
    // Send them the current color grid
    io.to(socket.id).emit("init", localGrid.colors);

    // Whenever anyone places a pixel
    socket.on("place-pixel", async (pos, color) => {
      // Error checking
      if (pos.x >= WIDTH || pos.x < 0 || pos.y >= HEIGHT || pos.y < 0) return;
      console.log(`Pixel (${pos.x}, ${pos.y}) has been set to: ${color}`);
      // Update the local color grid
      localGrid.colors[pos.x][pos.y] = color;
      localGrid.markModified('colors');
      // Save the current color grid to the database
      localGrid.save();
      // Let the other users know that it was placed
      socket.broadcast.emit("pixel-placed-by-user", pos, color);
    })
  });
});