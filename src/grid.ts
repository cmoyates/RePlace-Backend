import mongoose, { Document, Schema } from "mongoose";

export interface IGrid extends Document {
  colors: string[][]
};

const GridSchema: Schema = new Schema({
  colors: {type: Array, required: true}
});

export default mongoose.model<IGrid>("Grid", GridSchema);