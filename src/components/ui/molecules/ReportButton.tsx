'use client';

import { useState } from 'react';
import { ReportModal } from '@/components/ui/organisms/ReportModal';
import { Button } from '@/components/ui/atoms/button';
import { motion } from 'framer-motion';
import { ITransaction } from '@/interfaces/ITransaction';

interface ReportButtonProps {
    transactions: ITransaction[];
}

export const ReportButton: React.FC<ReportButtonProps> = ({ transactions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center space-x-2"
        >
            <Button onClick={handleOpenModal} variant="outline" className="flex items-center space-x-2 bg-blue-600 text-white   ">
                <span className="text-lg">📊</span>
                <span>Relatório</span>
            </Button>
            {isModalOpen && <ReportModal onClose={handleCloseModal} transactions={transactions} />}
        </motion.div>
    );
};
