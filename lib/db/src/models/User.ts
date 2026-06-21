import mongoose, { Schema, type Document } from "mongoose";

export interface INotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "Admin" | "Manager" | "Member";
  phoneNumber?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  timezone?: string;
  avatar?: string;
  notificationSettings?: INotificationSettings;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  authProvider: "local" | "google";
  googleId?: string;
  profilePicture?: string;
  profileColor?: string;
  emailVerified: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
  phoneNumber: { type: String, default: "" },
  jobTitle: { type: String, default: "" },
  department: { type: String, default: "" },
  bio: { type: String, default: "" },
  timezone: { type: String, default: "UTC" },
  avatar: { type: String, default: "" },
  profileColor: { type: String, default: "purple" },
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  refreshToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  authProvider: { type: String, enum: ["local", "google"], default: "local", required: true },
  googleId: { type: String, index: true },
  profilePicture: { type: String, default: "" },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

