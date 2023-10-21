import { Schema, models, model, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  desvription: string;
  questions: Schema.Types.ObjectId[];
  followers: Schema.Types.ObjectId[];
  createdOn: Date;
}

const TagSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  questions: [{ type: Schema.Types.ObjectId, ref: "Question" }], // Assuming it references "Question" schema
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }], // Assuming it references "User" schema
  createdOn: { type: Date, default: Date.now },
});

const Tag = models.Tag || model("Tag", TagSchema);

export default Tag;
