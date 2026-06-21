import mongoose, { Schema, type Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Organization =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
