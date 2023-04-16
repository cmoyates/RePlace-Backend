import express from "express";
import { Application, Request, Response } from "express";
import { Server } from "socket.io";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const WIDTH: number = 64;
const HEIGHT: number = 36;

let localGrid: string[][];

// // Try to get the grid from the databse
// Grid.findOne({}).then(function (foundGrid: (IGrid & { _id: any; }) | null) {
//   // If nothing is found
//   if (foundGrid === null) {
//     // Create an new grid that is all white
//     let colorArray: string[][] = [];
//     for (let x = 0; x < WIDTH; x++) {
//       let colorCol: string[] = [];
//       for (let y = 0; y < HEIGHT; y++) {
//         colorCol.push("#ffffff");
//       }
//       colorArray.push(colorCol);
//     }
//     // Add it to the database
//     const newGrid = new Grid({
//       _id: new mongoose.Types.ObjectId(),
//       colors: colorArray
//     });
//     newGrid.save();
//     // Set the local variable
//     localGrid = newGrid;
//     console.log("Generated New Grid");
//   }
//   else {
//     // Otherwise just set the local variable to the value from the database
//     localGrid = foundGrid;
//     console.log("Loaded Grid");
//   }
// }).then(() => {

// });

const redis = new Redis(process.env.REDIS_URL ?? "");

redis
  .lrange("pixel-grid", 0, -1)
  .then(async (gridFromRedis: string[]) => {
    if (!gridFromRedis) {
      console.log("No valid grid found in redis");
      localGrid = Array.from({ length: WIDTH }, () =>
        Array.from({ length: HEIGHT }, () => "#ffffff")
      );
      // Push a flattened version to Redis
      await redis.lpush("pixel-grid", ...localGrid.flat());
    } else {
      console.log("Valid grid found, loading...");
      // Coonvert the 1D grid representation from Redis to a 2D grid
      localGrid = new Array(WIDTH);
      for (let i = 0; i < WIDTH; i++) {
        localGrid[i] = new Array(HEIGHT);
        for (let j = 0; j < HEIGHT; j++) {
          localGrid[i][j] = gridFromRedis[i * HEIGHT + j];
        }
      }
    }
  })
  .then(() => {
    // Once that's done, start an express server listening on the specified port
    const app: Application = express();

    app.get("/", (_: Request, res: Response) => {
      res.send("The server is running!");
    });

    let server = app.listen(PORT, () =>
      console.log(`Listening on port ${PORT}...`)
    );

    // Start a web socket connection from that server
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Whenever someone connects to that websocket
    io.on("connection", (socket) => {
      console.log(`User connected with id: ${socket.id}`);
      // Send them the current color grid
      socket.emit("init", localGrid);
      // Whenever anyone places a pixel
      socket.on(
        "place-pixel",
        async (pos: { x: number; y: number }, color: string) => {
          // Error checking
          if (pos.x >= WIDTH || pos.x < 0 || pos.y >= HEIGHT || pos.y < 0)
            return;
          // Update the local color grid
          localGrid[pos.x][pos.y] = color;
          // Let the other users know that it was placed
          socket.broadcast.emit("pixel-placed", pos, color);
          // Save the current color grid to the database
          await redis.lset("pixel-grid", pos.x * HEIGHT + pos.y, color);
          // Log it to the console
          console.log(`Pixel (${pos.x}, ${pos.y}) has been set to: ${color}`);
        }
      );
    });
  });
