import mongoose, { Schema } from "mongoose";
import { IPushSubscription } from "@/interfaces/IPushSubscription";

const PushSubscriptionSchema = new Schema<IPushSubscription>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    device: { type: String },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const PushSubscription = mongoose.models.PushSubscription || mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
