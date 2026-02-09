import mongoose, { Schema } from "mongoose";
import { IRecommendation } from "@/interfaces/IRecommendation";

const RecommendationSchema = new Schema<IRecommendation>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ['SAVING_OPPORTUNITY', 'SPENDING_ALERT', 'GOAL_ACHIEVEMENT'], required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionableStep: { type: String, required: true },
    impactEstimate: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'VIEWED', 'DISMISSED', 'APPLIED'], default: 'PENDING' },
    generatedAt: { type: Date, default: Date.now },
    pushSent: { type: Boolean, default: false },
    explanation: { type: String }
}, { timestamps: true });

// Check if model exists to prevent overwrite error in hot-reload
export const Recommendation = mongoose.models.Recommendation || mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);
