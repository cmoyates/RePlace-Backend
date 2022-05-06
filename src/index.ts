import express from "express";
import { Application, Request, Response } from "express";

const app: Application = express();
const PORT: number = 5000;

app.get("/", (req: Request, res: Response) => {
  res.send("Response");
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`))