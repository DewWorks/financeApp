import type { Meta, StoryObj } from '@storybook/react';
import { EmptyStateAction } from '@/components/ui/molecules/EmptyStateAction';

const meta = {
    title: 'Molecules/EmptyStateAction',
    component: EmptyStateAction,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof EmptyStateAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="h-screen w-full relative">
            <EmptyStateAction />
        </div>
    )
};
