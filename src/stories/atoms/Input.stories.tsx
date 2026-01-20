import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/atoms/input';

const meta = {
    title: 'Atoms/Input',
    component: Input,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'date'],
        },
        disabled: {
            control: 'boolean',
        },
        placeholder: {
            control: 'text',
        }
    },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        type: 'text',
        placeholder: 'Type here...',
    },
};

export const Disabled: Story = {
    args: {
        type: 'text',
        placeholder: 'Disabled input',
        disabled: true,
    },
};

export const File: Story = {
    args: {
        type: 'file',
    },
};
