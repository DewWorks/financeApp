import * as mongoose from "mongoose";

export interface IProfile {
    name: string;
    type: "SHARED";
    members: IMember[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IMember {
    userId: mongoose.Types.ObjectId;
    permission: "ADMIN" | "COLABORATOR" | "VIEWER";
}
