import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog";
import { Target, Plus, Trash2, Edit, Trophy, Rocket, Info, TrendingUp, Wallet, Calendar as CalendarIcon, PiggyBank } from 'lucide-react';
import { Thermometer, ThermometerSnowflake, ThermometerSun } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { incomeTags, ITransaction } from '@/interfaces/ITransaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select";
import { useGoals } from '@/hooks/useGoals';
import { IGoal } from "@/interfaces/IGoal";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import Swal from "sweetalert2";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Tooltip } from "@/components/ui/atoms/tooltip";
import { Label } from '@/components/ui/atoms/label';

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

    // Ref for the native date picker
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Format: 1000 -> 1.000 | 1000000 -> 1.000.000
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

    const getThermometerStatus = (goal: IGoal) => {
        if (!goal.date) return { color: 'gray', icon: <Thermometer className="h-5 w-5 text-gray-500" />, label: 'Indefinido', desc: 'Sem prazo definido.' };

        const deadlineDate = new Date(goal.date);
        const today = new Date();
        const timeDiff = deadlineDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;

        if (daysLeft <= 7 && progressPercentage < 50) {
            return { color: 'red', icon: <Thermometer className="h-5 w-5 text-red-500" />, label: 'Crítico', desc: 'Prazo quase no fim!' };
        } else if (daysLeft <= 14 && progressPercentage < 70) {
            return { color: 'orange', icon: <ThermometerSun className="h-5 w-5 text-orange-500" />, label: 'Atenção', desc: 'Fique de olho.' };
        } else if (daysLeft > 30 && progressPercentage < 30) {
            return { color: 'blue', icon: <ThermometerSnowflake className="h-5 w-5 text-blue-500" />, label: 'Tranquilo', desc: 'Tudo sob controle.' };
        } else if (progressPercentage > 90) {
            return { color: 'green', icon: <Trophy className="h-5 w-5 text-green-500" />, label: 'Conquista!', desc: 'Quase lá!' };
        } else if (daysLeft > 30 && progressPercentage > 70) {
            return { color: 'green', icon: <TrendingUp className="h-5 w-5 text-green-500" />, label: 'Ótimo', desc: 'Ritmo excelente.' };
        } else {
            return { color: 'gray', icon: <Thermometer className="h-5 w-5 text-gray-500" />, label: 'Normal', desc: 'Seguindo o plano.' };
        }
    };

    // Helper to pick color for tags (simple variation based on string length/char)
    const getTagColor = (tag: string) => {
        const colors = [
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
        ];
        const index = tag.length % colors.length;
        return colors[index];
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
        const { color, icon, label, desc } = getThermometerStatus(goal);
        const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100);

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
            <div className="relative mb-2 sm:mb-0 rounded-xl overflow-hidden touch-pan-y">
                {/* Swipe Background */}
                <motion.div style={{ backgroundColor: containerBg }} className="absolute inset-0 flex items-center justify-between px-4 z-0 rounded-xl md:hidden">
                    <motion.div style={{ opacity: editOpacity }} className="flex items-center text-white font-bold"><Edit className="mr-2 h-5 w-5" /> Editar</motion.div>
                    <motion.div style={{ opacity: deleteOpacity }} className="flex items-center text-white font-bold">Excluir <Trash2 className="ml-2 h-5 w-5" /></motion.div>
                </motion.div>

                {/* Card Itself */}
                <motion.div
                    layout drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x }} onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02 }} className="relative z-10 bg-white dark:bg-gray-800"
                >
                    <Card className={`border-l-4 border-${color}-500 shadow-sm hover:shadow-md transition-all dark:bg-gray-800 dark:border-gray-700`}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {/* Icon / Progress Wrapper */}
                                    <div className="w-12 h-12 relative flex-shrink-0">
                                        <CircularProgressbar
                                            value={progress}
                                            text={""} // No text inside to keep clean, or icon inside
                                            styles={buildStyles({
                                                pathColor: progress >= 100 ? '#22c55e' : `var(--${color}-500, #3b82f6)`,
                                                trailColor: "#e5e7eb",
                                            })}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {progress >= 100 ? <Trophy className="w-5 h-5 text-green-500" /> : <Target className={`w-5 h-5 text-${color}-500`} />}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{goal.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium dark:text-gray-400">
                                            Meta: R$ {goal.targetAmount.toLocaleString()}
                                        </p>
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

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Guardado</span>
                                    <span className={`text-lg font-bold text-${color}-600 dark:text-${color}-400`}>
                                        R$ {currentAmount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTagColor(goal.tag)}`}>
                                        {goal.tag}
                                    </span>
                                    {goal.date && (
                                        <span className="text-[10px] text-gray-400 flex items-center">
                                            <CalendarIcon className="w-3 h-3 mr-1" />
                                            {new Date(goal.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    };

    return (
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <PiggyBank className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Metas Financeiras</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Foco nos seus sonhos!</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                            onClick={handleOpenNewGoalDialog}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Meta
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
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Objetivo</Label>
                                <Input placeholder="Ex: Viagem, Carro, Reserva..." value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} className="bg-gray-50 dark:bg-gray-900" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor (R$)</Label>
                                    <Input inputMode="numeric" placeholder="0.00" value={newGoalAmount} onChange={handleAmountChange} className="bg-gray-50 dark:bg-gray-900" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prazo</Label>
                                    <div className="relative">
                                        {/* Hidden Input controlled by ref */}
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
                                            className={`w-full justify-start text-left font-normal bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 ${!newGoalDeadline && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newGoalDeadline ? new Date(newGoalDeadline).toLocaleDateString() : "Data"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vincular Tag (Automático)</Label>
                                <Select value={newGoalTag} onValueChange={setNewGoalTag}>
                                    <SelectTrigger className="bg-gray-50 dark:bg-gray-900">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-gray-500" />
                                            <SelectValue placeholder="Selecione..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800">
                                        {incomeTags.map((tag) => (
                                            <SelectItem key={tag} value={tag} className="cursor-pointer">{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleAddOrEdit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl mt-2">
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
                            <Trophy className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">Nenhuma meta ainda?</p>
                            <Button variant="link" onClick={handleOpenNewGoalDialog} className="text-blue-600">Criar agora</Button>
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
