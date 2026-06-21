import mongoose, { Schema, type Document } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId; // populated for 1-to-1 direct messages
  channel?: mongoose.Types.ObjectId;   // populated for team channel messages
  text: string;
  file?: mongoose.Types.ObjectId;      // optional shared file reference
  readBy: mongoose.Types.ObjectId[];  // users who read the message (read receipts)
  delivered: boolean;                  // delivery status
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipient: { type: Schema.Types.ObjectId, ref: "User", index: true },
  channel: { type: Schema.Types.ObjectId, ref: "Channel", index: true },
  text: { type: String, required: true },
  file: { type: Schema.Types.ObjectId, ref: "File" },
  readBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  delivered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
