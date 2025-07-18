import { ObjectId } from "mongodb";

export interface IUser {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    cel?: string[];
    address?: string;
    cpf?: string;
    tutorialGuide?: boolean;
    executeQuery?: boolean;
    verification?: IUserVerification
}

export interface IUserVerification {
    code: string
    type: IUserTypesVerification
    channels: ('email' | 'whatsapp')[]
    expiresAt: Date
    verified: boolean
}

export enum IUserTypesVerification {
    'reset-password',
    'verify-number',
    'mfa-login'
}
