import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@/components/ui/atoms/label';

const meta = {
    title: 'Atoms/Label',
    component: Label,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        children: 'Accept terms and conditions',
    },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
