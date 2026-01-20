import type { Meta, StoryObj } from '@storybook/react';
import { SummaryCard } from '@/components/ui/molecules/SummaryCard';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const meta = {
    title: 'Molecules/SummaryCard',
    component: SummaryCard,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'success', 'danger', 'info']
        }
    }
} satisfies Meta<typeof SummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Total Balance',
        value: 12500.50,
        icon: Wallet,
        description: 'Current combined balance',
    },
};

export const Success: Story = {
    args: {
        title: 'Income',
        value: 5000.00,
        icon: TrendingUp,
        description: '+12% from last month',
        variant: 'success',
    },
};

export const Danger: Story = {
    args: {
        title: 'Expenses',
        value: 2300.00,
        icon: TrendingDown,
        description: '-5% from last month',
        variant: 'danger',
    },
};
