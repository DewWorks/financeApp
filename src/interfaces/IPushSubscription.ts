import { ObjectId } from "mongodb";

export interface IPushSubscription {
    _id?: ObjectId;
    userId: ObjectId | string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    device?: string;
    createdAt: Date;
}
