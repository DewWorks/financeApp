import { IFinancePlan, IDisbursement } from "@/interfaces/IFinancePlan";
import mongoose, { Schema } from "mongoose";

const DisbursementSchema = new Schema<IDisbursement>(
    {
        date: { type: Date, required: true },
        amount: { type: Number, required: true },
        note: { type: String },
    },
    { _id: false }
);

const FinancePlanSchema = new Schema<IFinancePlan>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, required: true, default: 0 },
    desiredDate: { type: Date, required: true },

    spendIntent: { type: String, enum: ["one_time", "staggered"], default: "one_time" },
    disbursements: { type: [DisbursementSchema], default: [] },

    estimatedMonths: { type: Number, required: true },
    monthlySavingTarget: { type: Number, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    suggestions: { type: [String], default: [] },

    createdAt: { type: Date, default: Date.now },
});

export const FinancePlan =
    mongoose.models.FinancePlan ||
    mongoose.model<IFinancePlan>("FinancePlan", FinancePlanSchema);
