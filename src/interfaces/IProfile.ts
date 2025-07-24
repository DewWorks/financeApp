import * as mongoose from "mongoose";

export interface IProfile {
    name: string;
    type: "SHARED";
    members: {
        userId: mongoose.Types.ObjectId;
        permission: "ADMIN" | "COLABORATOR" | "VIEWER";
    }[];
    createdAt: Date;
    updatedAt: Date;
}
