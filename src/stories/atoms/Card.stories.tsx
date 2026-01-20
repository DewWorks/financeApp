import type { Meta, StoryObj } from '@storybook/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/atoms/card';

const meta = {
    title: 'Atoms/Card',
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Card className="w-[350px]" {...args}>
            <CardHeader>
                <CardTitle>Create project</CardTitle>
                <CardDescription>Deploy your new project in one-click.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Card Content Area</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <button className="text-sm">Cancel</button>
                <button className="text-sm font-bold">Deploy</button>
            </CardFooter>
        </Card>
    ),
};
