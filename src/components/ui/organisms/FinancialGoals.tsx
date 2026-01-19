import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog";
import { Target, Plus, Trash2, Edit, Trophy, Rocket, Info, TrendingUp, Wallet, Calendar as CalendarIcon, PiggyBank, Tag as TagIcon, MoreHorizontal } from 'lucide-react';
import { Thermometer, ThermometerSnowflake, ThermometerSun } from 'lucide-react';
import { incomeTags, ITransaction } from '@/interfaces/ITransaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select";
import { useGoals } from '@/context/GoalsContext';
import { IGoal } from "@/interfaces/IGoal";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import Swal from "sweetalert2";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Tooltip } from "@/components/ui/atoms/tooltip";
import { Label } from '@/components/ui/atoms/label';
import { Progress } from "@/components/ui/atoms/progress"; // Assuming we have a progress component, or I will use a custom div

interface FinancialGoalsProps {
    transactions: ITransaction[];
}

export function FinancialGoals({ transactions }: FinancialGoalsProps) {
    const { goals, addGoal, editGoal, deleteGoal, showToast } = useGoals();
    const [newGoalName, setNewGoalName] = React.useState('');
    const [newGoalAmount, setNewGoalAmount] = React.useState('');
    const [newGoalDeadline, setNewGoalDeadline] = React.useState('');
    const [newGoalTag, setNewGoalTag] = React.useState(incomeTags[0]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingGoal, setEditingGoal] = React.useState<IGoal | null>(null);

    const dateInputRef = useRef<HTMLInputElement>(null);

    const formatCurrencyDisplay = (value: string) => {
        const number = value.replace(/\D/g, "");
        if (!number) return "";
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewGoalAmount(formatCurrencyDisplay(e.target.value));
    };

    const calculateGoalProgress = (goal: IGoal) => {
        const currentAmount = Array.isArray(transactions) ? transactions.filter(
            (t) => t.tag === goal.tag && t.type === 'income'
        ).reduce((sum, t) => sum + t.amount, 0) : 0;
        return Math.min(currentAmount, goal.targetAmount);
    };

    // Helper for tag colors - Consistent Badge Style
    const getTagStyles = (tag: string) => {
        const styles: Record<string, string> = {
            'Salário': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            'Investimentos': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'Freelance': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            'Presente': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
            'Outros': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        };
        return styles[tag] || styles['Outros'];
    };

    const handleOpenNewGoalDialog = () => {
        setEditingGoal(null);
        setNewGoalName('');
        setNewGoalAmount('');
        setNewGoalTag(incomeTags[0]);
        setNewGoalDeadline('');
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (goal: IGoal) => {
        setEditingGoal(goal);
        setNewGoalName(goal.name);
        setNewGoalAmount(formatCurrencyDisplay(goal.targetAmount.toString()));
        setNewGoalTag(goal.tag);
        setNewGoalDeadline(goal.date ? new Date(goal.date).toISOString().split('T')[0] : '');
        setIsDialogOpen(true);
    };

    const handleAddOrEdit = async () => {
        const rawAmount = parseFloat(newGoalAmount.replace(/\./g, ""));

        if (!newGoalName || !newGoalAmount || isNaN(rawAmount) || !newGoalTag) {
            console.error({ type: 'error', message: 'Preencha todos os campos corretamente.' });
            return;
        }

        const goalData = {
            name: newGoalName,
            targetAmount: rawAmount,
            tag: newGoalTag,
            date: newGoalDeadline,
            currentAmount: editingGoal ? editingGoal.currentAmount : 0,
        };

        if (editingGoal) {
            await editGoal({ ...goalData, _id: editingGoal._id });
        } else {
            await addGoal(goalData);
        }

        setIsDialogOpen(false);
    };

    const handleDeleteGoal = async (goalId: string) => {
        const confirm = await Swal.fire({
            title: 'Excluir Meta?',
            text: "Essa ação não pode ser desfeita.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937',
        });

        if (confirm.isConfirmed) {
            await deleteGoal(goalId);
            showToast('Concluído', 'success');
        }
    };

    // Sub-component for individual goal card
    const GoalCard = ({ goal }: { goal: IGoal }) => {
        const currentAmount = calculateGoalProgress(goal);
        const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100);
        const isCompleted = progress >= 100;

        // Motion Logic
        const x = useMotionValue(0);
        const containerBg = useTransform(x, [-150, -50, 0, 50, 150], [
            "rgba(220, 38, 38, 1)", "rgba(220, 38, 38, 0.5)", "rgba(0,0,0,0)", "rgba(37, 99, 235, 0.5)", "rgba(37, 99, 235, 1)"
        ]);
        const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
        const editOpacity = useTransform(x, [50, 100], [0, 1]);

        const handleDragEnd = (_: any, info: PanInfo) => {
            if (info.offset.x < -100) handleDeleteGoal(goal._id?.toString() as string);
            else if (info.offset.x > 100) handleOpenEditDialog(goal);
        };

        return (
            <div className="relative mb-2 sm:mb-0 rounded-xl overflow-hidden touch-pan-y group/card">
                {/* Swipe Background */}
                <motion.div style={{ backgroundColor: containerBg }} className="absolute inset-0 flex items-center justify-between px-4 z-0 rounded-xl md:hidden">
                    <motion.div style={{ opacity: editOpacity }} className="flex items-center text-white font-bold"><Edit className="mr-2 h-5 w-5" /> Editar</motion.div>
                    <motion.div style={{ opacity: deleteOpacity }} className="flex items-center text-white font-bold">Excluir <Trash2 className="ml-2 h-5 w-5" /></motion.div>
                </motion.div>

                {/* Card Itself */}
                <motion.div
                    layout drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x }} onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02 }} className="relative z-10 bg-white dark:bg-gray-800 h-full flex flex-col justify-between"
                >
                    <Card className={`border-none shadow-sm hover:shadow-lg transition-all dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-700`}>
                        <CardContent className="p-5">
                            {/* Header: Title + Actions */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'} dark:bg-opacity-20`}>
                                        {isCompleted ? <Trophy className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg line-clamp-1">{goal.name}</h3>

                                        {/* Tag as Badge */}
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wide mt-1 ${getTagStyles(goal.tag)}`}>
                                            <TagIcon className="w-3 h-3" />
                                            {goal.tag}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-1" onPointerDownCapture={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-500" onClick={() => handleOpenEditDialog(goal)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDeleteGoal(goal._id?.toString() as string)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Progress Section */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Progresso</span>
                                        <span className={`text-xl font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                            {progress.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block">De R$ {goal.targetAmount.toLocaleString()}</span>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            R$ {currentAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Custom Linear Progress Bar */}
                                <div className="relative h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`absolute top-0 left-0 h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                    />
                                </div>

                                {goal.date && (
                                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>Meta: {new Date(goal.date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    };

    return (
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors overflow-hidden border-none ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Metas</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Planejamento estratégico</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95 rounded-full px-4"
                            onClick={handleOpenNewGoalDialog}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white dark:bg-gray-800 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
                                {editingGoal ? "Editar Meta" : "Nova Meta"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Objetivo</Label>
                                <Input placeholder="Ex: Viagem, Carro..." value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Valor (R$)</Label>
                                    <Input inputMode="numeric" placeholder="0.00" value={newGoalAmount} onChange={handleAmountChange} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Prazo</Label>
                                    <div className="relative">
                                        <Input
                                            ref={dateInputRef}
                                            type="date"
                                            value={newGoalDeadline}
                                            onChange={(e) => setNewGoalDeadline(e.target.value)}
                                            className="sr-only"
                                            tabIndex={-1}
                                        />
                                        <Button
                                            type="button"
                                            variant={"outline"}
                                            onClick={() => dateInputRef.current?.showPicker()}
                                            className={`w-full justify-start text-left font-normal ${!newGoalDeadline && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newGoalDeadline ? new Date(newGoalDeadline).toLocaleDateString() : "Data"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Vincular a Tag (Entrada de Dinheiro)</Label>
                                <Select value={newGoalTag} onValueChange={setNewGoalTag}>
                                    <SelectTrigger>
                                        <div className="flex items-center gap-2">
                                            <TagIcon className="w-4 h-4 text-gray-500" />
                                            <SelectValue placeholder="Selecione..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {incomeTags.map((tag) => (
                                            <SelectItem key={tag} value={tag} className="cursor-pointer bg-white">{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-gray-500 leading-tight">
                                    O app soma automaticamente os valores lançados com essa tag.
                                </p>
                            </div>

                            <Button onClick={handleAddOrEdit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-xl mt-2">
                                {editingGoal ? "Salvar" : "Criar Meta"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <div className="bg-gray-50/50 dark:bg-gray-900/50 min-h-[150px]">
                <AnimatePresence mode='wait'>
                    {goals.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <Target className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">Nenhuma meta definida</p>
                            <Button variant="link" onClick={handleOpenNewGoalDialog} className="text-indigo-600">Criar agora</Button>
                        </motion.div>
                    ) : (
                        <>
                            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                <AnimatePresence>{goals.map((goal) => <GoalCard key={goal._id?.toString()} goal={goal} />)}</AnimatePresence>
                            </div>
                            <div className="md:hidden p-4 pb-8">
                                <Swiper slidesPerView={1.1} spaceBetween={12} pagination={{ clickable: true }} modules={[Pagination]} className="pb-6">
                                    {goals.map((goal) => <SwiperSlide key={goal._id?.toString()}><GoalCard goal={goal} /></SwiperSlide>)}
                                </Swiper>
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}
