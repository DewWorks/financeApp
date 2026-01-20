import type { Meta, StoryObj } from '@storybook/react';
import { AddExpenseDialog } from '@/components/ui/organisms/AddExpenseDialog';
import { fn } from '@storybook/test';
import { Button } from '@/components/ui/atoms/button';
import { PlusIcon } from 'lucide-react';

const meta = {
    title: 'Organisms/AddExpenseDialog',
    component: AddExpenseDialog,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        onAddExpense: fn(),
    }
} satisfies Meta<typeof AddExpenseDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <AddExpenseDialog {...args} />
    )
};

export const CustomTrigger: Story = {
    render: (args) => (
        <AddExpenseDialog
            {...args}
            trigger={<Button variant="destructive">Open Custom Trigger</Button>}
        />
    )
}
