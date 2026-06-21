import mongoose, { Schema, type Document } from "mongoose";

export interface IForecast extends Document {
  projectId: mongoose.Types.ObjectId;
  delayPrediction: boolean;
  productivityForecast: number;
  workloadForecast: string;
  confidenceLevel: number;
  details?: string;
  createdAt: Date;
}

const ForecastSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  delayPrediction: { type: Boolean, required: true },
  productivityForecast: { type: Number, required: true },
  workloadForecast: { type: String, required: true },
  confidenceLevel: { type: Number, required: true },
  details: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export const Forecast =
  mongoose.models.Forecast ||
  mongoose.model<IForecast>("Forecast", ForecastSchema);
