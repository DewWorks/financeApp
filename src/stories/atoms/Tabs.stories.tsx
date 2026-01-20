import type { Meta, StoryObj } from '@storybook/react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/atoms/tabs';

const meta = {
    title: 'Atoms/Tabs',
    component: Tabs,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Tabs defaultValue="account" className="w-[400px]" {...args}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
                <div className="p-4 border rounded-md">Account settings here.</div>
            </TabsContent>
            <TabsContent value="password">
                <div className="p-4 border rounded-md">Password settings here.</div>
            </TabsContent>
        </Tabs>
    ),
};
