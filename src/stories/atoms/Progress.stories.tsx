import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@/components/ui/atoms/progress';

const meta = {
    title: 'Atoms/Progress',
    component: Progress,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        value: {
            control: { type: 'range', min: 0, max: 100 },
        },
    },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        value: 60,
    },
};

export const CustomColor: Story = {
    args: {
        value: 80,
        color: 'bg-green-500',
        backgroundColor: 'bg-green-100',
    },
};
