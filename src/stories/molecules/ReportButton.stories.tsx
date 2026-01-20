import type { Meta, StoryObj } from '@storybook/react';
import { ReportButton } from '@/components/ui/molecules/ReportButton';
import { ITransaction } from '@/interfaces/ITransaction';
import { IGoal } from '@/interfaces/IGoal';
import { IUser } from '@/interfaces/IUser';

const meta = {
    title: 'Molecules/ReportButton',
    component: ReportButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ReportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const dummyUser: IUser = {
    _id: "user1" as unknown as any,
    name: "John Doe",
    email: "john@example.com",
    password: "",
    createdAt: new Date(),
}

const dummyTransactions: ITransaction[] = [
    {
        _id: "1" as unknown as any,
        description: "Salary",
        amount: 5000,
        type: "income",
        date: new Date().toISOString(),
        userId: "user1" as unknown as any,
        tag: "Monthly",
        createdAt: new Date(),
    }
];

const dummyGoals: IGoal[] = [];

export const Default: Story = {
    args: {
        user: dummyUser,
        transactions: dummyTransactions,
        goals: dummyGoals,
    },
};
