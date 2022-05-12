import mongoose, { Document, Schema } from "mongoose";

// Grid interface
export interface IGrid extends Document {
  colors: string[][]
};

// Grid mongoose schema
const GridSchema: Schema = new Schema({
  colors: {type: Array, required: true}
});

// Exporting mongoose model made from the interface
export default mongoose.model<IGrid>("Grid", GridSchema);