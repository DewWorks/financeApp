import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@/components/ui/atoms/skeleton';

const meta = {
    title: 'Atoms/Skeleton',
    component: Skeleton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" {...args} />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" {...args} />
                <Skeleton className="h-4 w-[200px]" {...args} />
            </div>
        </div>
    ),
};
