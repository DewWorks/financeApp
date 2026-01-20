import type { Meta, StoryObj } from '@storybook/react';
import { FinancialGoals } from '@/components/ui/organisms/FinancialGoals';
import { GoalsContext } from '@/context/GoalsContext';
import { ITransaction } from '@/interfaces/ITransaction';
import { IGoal } from '@/interfaces/IGoal';
import { fn } from '@storybook/test';

const meta = {
    title: 'Organisms/FinancialGoals',
    component: FinancialGoals,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof FinancialGoals>;

export default meta;
type Story = StoryObj<typeof meta>;

// Dummy Data
const transactions: ITransaction[] = [
    {
        _id: "1" as unknown as any,
        description: "Freelance Work",
        amount: 2500,
        type: "income",
        tag: "Freelance",
        date: new Date().toISOString(),
        userId: 'u1' as unknown as any,
        createdAt: new Date(),
    }
];

const goals: IGoal[] = [
    {
        _id: "g1" as unknown as any,
        name: "New Laptop",
        targetAmount: 5000,
        currentAmount: 0, // calculated from transactions usually, but here just metadata
        tag: "Freelance",
        userId: "u1" as unknown as any,
        date: "2024-12-31",
        createdAt: new Date(),
    },
    {
        _id: "g2" as unknown as any,
        name: "Vacation",
        targetAmount: 10000,
        currentAmount: 0,
        tag: "Investimentos",
        userId: "u1" as unknown as any,
        createdAt: new Date(),
    }
];

// Mock Provider
const MockGoalsProvider = ({ children, goalsList }: { children: React.ReactNode, goalsList: IGoal[] }) => (
    <GoalsContext.Provider value={{
        goals: goalsList,
        addGoal: fn(),
        editGoal: fn(),
        deleteGoal: fn(),
        getGoal: fn(),
        toast: null,
        showToast: fn()
    }}>
        {children}
    </GoalsContext.Provider>
);

export const Default: Story = {
    args: {
        transactions: transactions
    },
    render: () => (
        <MockGoalsProvider goalsList={goals}>
            <FinancialGoals transactions={transactions} />
        </MockGoalsProvider>
    )
};

export const Empty: Story = {
    args: {
        transactions: transactions
    },
    render: () => (
        <MockGoalsProvider goalsList={[]}>
            <FinancialGoals transactions={transactions} />
        </MockGoalsProvider>
    )
};
