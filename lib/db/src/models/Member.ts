import mongoose, { Schema, type Document } from "mongoose";

export interface IMember extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId | null;
  role: "Owner" | "Admin" | "Manager" | "Member" | "Viewer";
  joinedAt: Date;
}

const MemberSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null, index: true },
  role: {
    type: String,
    enum: ["Owner", "Admin", "Manager", "Member", "Viewer"],
    default: "Member",
  },
  joinedAt: { type: Date, default: Date.now },
});

export const Member =
  mongoose.models.Member ||
  mongoose.model<IMember>("Member", MemberSchema);
