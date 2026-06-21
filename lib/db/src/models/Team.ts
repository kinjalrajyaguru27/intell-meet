import mongoose, { Schema, type Document } from "mongoose";

export interface ITeamMember {
  user: mongoose.Types.ObjectId;
  role: "Admin" | "Manager" | "Member";
}

export interface ITeam extends Document {
  name: string;
  description?: string;
  logo?: string;
  organizationId?: mongoose.Types.ObjectId | null;
  owner?: mongoose.Types.ObjectId | null;
  members: ITeamMember[];
  createdAt: Date;
}

const TeamSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  logo: { type: String, default: "" },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  members: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const Team = mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
