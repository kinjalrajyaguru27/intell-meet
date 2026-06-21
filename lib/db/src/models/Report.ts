import mongoose, { Schema, type Document } from "mongoose";

export interface IReport extends Document {
  title: string;
  type: "Team" | "User" | "Project" | "Meeting" | "Organization";
  format: "PDF" | "Excel" | "CSV" | "DOCX";
  fileUrl: string;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReportSchema: Schema = new Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["Team", "User", "Project", "Meeting", "Organization"],
    required: true,
  },
  format: {
    type: String,
    enum: ["PDF", "Excel", "CSV", "DOCX"],
    required: true,
  },
  fileUrl: { type: String, required: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Report =
  mongoose.models.Report ||
  mongoose.model<IReport>("Report", ReportSchema);
