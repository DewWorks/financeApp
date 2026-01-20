import type { Meta, StoryObj } from '@storybook/react';
import TimelineMonthSelector from '@/components/ui/molecules/TimelineMonth';
import { fn } from '@storybook/test';

const meta = {
    title: 'Molecules/TimelineMonth',
    component: TimelineMonthSelector,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    args: {
        onSelectMonth: fn(),
    }
} satisfies Meta<typeof TimelineMonthSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        selectedMonth: 1,
    }
};

export const JuneSelected: Story = {
    args: {
        selectedMonth: 6,
    }
};
