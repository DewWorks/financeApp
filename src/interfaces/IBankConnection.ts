import { ObjectId } from "mongodb";

export interface IBankConnection {
    _id?: ObjectId;
    userId: ObjectId;
    provider: 'pluggy' | 'belvo';
    itemId: string; // ID da conexão na Pluggy
    status: 'LOGIN_REQUIRED' | 'UPDATING' | 'UPDATED' | 'OUTDATED';
    accounts: IBankAccount[];
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBankAccount {
    accountId: string; // ID da conta dentro do banco (Pluggy ID)
    name: string; // "Conta Corrente", "Nubank"
    number: string;
    balance: number;
    currency: string;
    type: string; // 'CHECKING_ACCOUNT', 'CREDIT_CARD', etc.
    subtype?: string;
}
