import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

// https://www.youtube.com/watch?v=lNqaQ0wEeAo
const MONGO_OPTIONS = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  socketTimeoutMS: 30000,
  keepAlive: true,
  autoIndex: false,
  retryWrites: false
};

const envPopulated: boolean = process.env.MONGO_USERNAME !== undefined && process.env.MONGO_PASSWORD !== undefined && process.env.MONGO_HOST !== undefined;
const uri = envPopulated 
  ? `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}.mongodb.net/RePlace` 
  : "mongodb://localhost/RePlace";
console.log(uri);
mongoose.connect(uri, MONGO_OPTIONS);
const db = mongoose.connection;

db.on("error", (error: any) => console.log("Error: " + error));
db.once("open", () => console.log("Connected to Database"));

export default db;