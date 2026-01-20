import type { Meta, StoryObj } from '@storybook/react';
import { Title, TitleBlue, TitleGreen, TitleWhite } from '@/components/ui/molecules/Title';

const meta = {
    title: 'Molecules/Title',
    component: Title,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl']
        },
        iconColor: { control: 'color' },
        textColor: { control: 'color' },
    }
} satisfies Meta<typeof Title>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        size: 'md',
    },
};

export const Large: Story = {
    args: {
        size: 'lg',
    },
};

export const BlueVariant: Story = {
    render: () => <TitleBlue />,
};

export const GreenVariant: Story = {
    render: () => <TitleGreen />,
};

export const WhiteVariant: Story = {
    render: () => <div className="bg-black p-4"><TitleWhite /></div>,
};
