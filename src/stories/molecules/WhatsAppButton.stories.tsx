import type { Meta, StoryObj } from '@storybook/react';
import { WhatsAppButton } from '@/components/ui/molecules/whatsapp-button';

const meta = {
    title: 'Molecules/WhatsAppButton',
    component: WhatsAppButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof WhatsAppButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
