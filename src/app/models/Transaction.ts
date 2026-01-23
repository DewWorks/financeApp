import { ITransaction } from "@/interfaces/ITransaction";
import mongoose, { Schema } from "mongoose";

const TransactionSchema = new Schema<ITransaction>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    profileId: { type: Schema.Types.ObjectId, ref: "User", },
    type: { type: String, enum: ["income", "expense"], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    tag: { type: String, required: true },
    // Open Finance Fields
    pluggyTransactionId: { type: String, unique: true, sparse: true }, // sparse allows null/undefined for manual transactions
    provider: { type: String, enum: ['manual', 'pluggy', 'belvo'], default: 'manual' },
    accountId: { type: String },
    category: { type: String },
    status: { type: String, enum: ['PENDING', 'POSTED'] }
}, { timestamps: true });

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
