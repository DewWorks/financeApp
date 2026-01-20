import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/atoms/button';
import { fn } from '@storybook/test';

const meta = {
    title: 'Atoms/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        },
        size: {
            control: 'select',
            options: ['default', 'sm', 'lg', 'icon'],
        }
    },
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        variant: 'default',
        children: 'Button',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary',
    },
};

export const Outline: Story = {
    args: {
        variant: 'outline',
        children: 'Outline',
    },
};

export const Destructive: Story = {
    args: {
        variant: 'destructive',
        children: 'Delete',
    },
};
