import type { Meta, StoryObj } from '@storybook/react';
import { TransactionsTable } from '@/components/ui/molecules/TransactionsTable';
import { ITransaction } from '@/interfaces/ITransaction';

const meta = {
    title: 'Molecules/TransactionsTable',
    component: TransactionsTable,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TransactionsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    },
    {
        _id: "2" as unknown as any,
        description: "Groceries",
        amount: 350.50,
        type: "expense",
        date: new Date().toISOString(),
        userId: "user1" as unknown as any,
        tag: "Essentials",
        createdAt: new Date(),
    },
    {
        _id: "3" as unknown as any,
        description: "Netflix",
        amount: 59.90,
        type: "expense",
        date: new Date().toISOString(),
        userId: "user1" as unknown as any,
        tag: "Subscription",
        isRecurring: true,
        recurrenceCount: 3,
        createdAt: new Date(),
    }
];

export const Default: Story = {
    args: {
        transactions: dummyTransactions,
    },
};

export const Empty: Story = {
    args: {
        transactions: [],
    },
};
