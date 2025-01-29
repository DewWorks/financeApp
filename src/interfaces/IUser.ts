import { ObjectId } from "mongodb";

export interface IUser {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    cel?: string;
    address?: string;
    cpf?: string;
    tutorialGuide?: boolean;
    executeQuery?: boolean;
}