import type { Meta, StoryObj } from '@storybook/react';
import { AddIncomeDialog } from '@/components/ui/organisms/AddIncomeDialog';
import { fn } from '@storybook/test';
import { Button } from '@/components/ui/atoms/button';

const meta = {
    title: 'Organisms/AddIncomeDialog',
    component: AddIncomeDialog,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        onAddIncome: fn(),
    }
} satisfies Meta<typeof AddIncomeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <AddIncomeDialog {...args} />
    )
};
