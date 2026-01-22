import { ObjectId } from "mongodb";

export interface IGoal {
    _id?: ObjectId
    userId: ObjectId
    name: string;
    targetAmount: number;
    currentAmount: number;
    tag: string;
    type?: 'savings' | 'spending';
    period?: 'monthly' | 'yearly' | 'once';
    date?: string | Date | null;
    createdAt: string | Date;
}