import { ObjectId } from "mongodb";

export interface IRecommendation {
    _id?: ObjectId;
    userId: ObjectId;
    type: 'SAVING_OPPORTUNITY' | 'SPENDING_ALERT' | 'GOAL_ACHIEVEMENT';
    category: string;
    title: string;
    message: string;
    actionableStep: string;
    impactEstimate: number;
    status: 'PENDING' | 'VIEWED' | 'DISMISSED' | 'APPLIED';
    generatedAt: Date;
    pushSent: boolean;
    explanation?: string; // TCC: "Entenda por quê"
}
