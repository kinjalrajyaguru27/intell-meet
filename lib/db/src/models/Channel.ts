import mongoose, { Schema, type Document } from "mongoose";

export interface IChannel extends Document {
  name: string;
  description?: string;
  isPrivate: boolean;
  teamId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ChannelSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  isPrivate: { type: Boolean, default: false },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Channel = mongoose.models.Channel || mongoose.model<IChannel>("Channel", ChannelSchema);
