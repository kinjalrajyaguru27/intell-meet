import mongoose, { Schema, type Document } from "mongoose";

export interface IInvitation extends Document {
  email: string;
  team: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  role: "Admin" | "Manager" | "Member";
  status: "Pending" | "Accepted" | "Rejected";
  token: string;
  createdAt: Date;
}

const InvitationSchema: Schema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  token: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: "7d" }, // automatically cleanup after 7 days
});

export const Invitation = mongoose.models.Invitation || mongoose.model<IInvitation>("Invitation", InvitationSchema);
