import type { Meta, StoryObj } from '@storybook/react';
import SliderMonthSelector from '@/components/ui/molecules/SliderMonth';
import { fn } from '@storybook/test';

const meta = {
    title: 'Molecules/SliderMonth',
    component: SliderMonthSelector,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        onSelectMonth: fn(),
    }
} satisfies Meta<typeof SliderMonthSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
