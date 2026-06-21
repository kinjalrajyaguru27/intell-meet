import mongoose, { Schema, type Document } from "mongoose";

export interface IParticipant extends Document {
  meeting: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId | null;
  displayName: string;
  role: "host" | "co-host" | "participant";
  status: "waiting" | "admitted" | "rejected" | "left";
  isMuted: boolean;
  isCameraOff: boolean;
  isRaisedHand: boolean;
  joinedAt: Date;
  leftAt?: Date | null;
}

const ParticipantSchema = new Schema({
  meeting: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", default: null },
  displayName: { type: String, required: true },
  role: { type: String, enum: ["host", "co-host", "participant"], default: "participant" },
  status: { type: String, enum: ["waiting", "admitted", "rejected", "left"], default: "waiting" },
  isMuted: { type: Boolean, default: false },
  isCameraOff: { type: Boolean, default: false },
  isRaisedHand: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null },
});

export const Participant = mongoose.models.Participant || mongoose.model<IParticipant>("Participant", ParticipantSchema);
