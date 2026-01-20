import type { Meta, StoryObj } from '@storybook/react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/atoms/popover';
import { Button } from '@/components/ui/atoms/button';

const meta = {
    title: 'Atoms/Popover',
    component: Popover,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Popover {...args}>
            <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Dimensions</h4>
                        <p className="text-sm text-muted-foreground">
                            Set the dimensions for the layer.
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    ),
};
