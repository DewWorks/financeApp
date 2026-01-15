import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog";
import { Target, Plus, DollarSign, Trash2, Edit, Trophy, Rocket, Info, TrendingUp, Wallet, Calendar as CalendarIcon } from 'lucide-react';
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

    // Format: 1000 -> 1.000 | 1000000 -> 1.000.000
    const formatCurrencyDisplay = (value: string) => {
        // Remove everything that is not a digit
        const number = value.replace(/\D/g, "");
        if (!number) return "";
        // Add dots every 3 digits
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Format the input value immediately
        setNewGoalAmount(formatCurrencyDisplay(value));
    };

    const calculateGoalProgress = (goal: IGoal) => {
        const currentAmount = Array.isArray(transactions) ? transactions.filter(
            (t) => t.tag === goal.tag && t.type === 'income'
        ).reduce((sum, t) => sum + t.amount, 0) : 0;
        return Math.min(currentAmount, goal.targetAmount);
    };

    const getThermometerStatus = (goal: IGoal) => {
        if (!goal.date) return { color: 'gray', icon: <Thermometer className="h-5 w-5 text-gray-500" />, label: 'Sem prazo', desc: 'Defina um prazo para acompanhar o ritmo.' };

        const deadlineDate = new Date(goal.date);
        const today = new Date();
        const timeDiff = deadlineDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;

        if (daysLeft <= 7 && progressPercentage < 50) {
            return { color: 'red', icon: <Thermometer className="h-5 w-5 text-red-500" />, label: 'Crítico', desc: 'Prazo acabando e progresso baixo! Acelere!' };
        } else if (daysLeft <= 14 && progressPercentage < 70) {
            return { color: 'orange', icon: <ThermometerSun className="h-5 w-5 text-orange-500" />, label: 'Atenção', desc: 'Fique atento ao prazo.' };
        } else if (daysLeft > 30 && progressPercentage < 30) {
            return { color: 'blue', icon: <ThermometerSnowflake className="h-5 w-5 text-blue-500" />, label: 'Tranquilo', desc: 'Ainda há tempo, mas não descuide.' };
        } else if (progressPercentage > 90) {
            return { color: 'green', icon: <Trophy className="h-5 w-5 text-green-500" />, label: 'Conquista!', desc: 'Parabéns! Meta quase atingida.' };
        } else if (daysLeft > 30 && progressPercentage > 70) {
            return { color: 'green', icon: <TrendingUp className="h-5 w-5 text-green-500" />, label: 'No Caminho', desc: 'Ótimo ritmo!' };
        } else {
            return { color: 'gray', icon: <Thermometer className="h-5 w-5 text-gray-500" />, label: 'Em Andamento', desc: 'Continue focado.' };
        }
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
        // Remove dots to parse correctly: 1.000 -> 1000
        const rawAmount = parseFloat(newGoalAmount.replace(/\./g, ""));

        if (!newGoalName || !newGoalAmount || isNaN(rawAmount) || !newGoalTag) {
            console.error({ type: 'error', message: 'Preencha todos os campos corretamente.' });
            return;
        }

        if (editingGoal) {
            await editGoal({
                _id: editingGoal._id,
                name: newGoalName,
                targetAmount: rawAmount,
                tag: newGoalTag,
                date: newGoalDeadline,
                currentAmount: editingGoal.currentAmount,
            });
        } else {
            await addGoal({
                name: newGoalName,
                targetAmount: rawAmount,
                tag: newGoalTag,
                date: newGoalDeadline,
                currentAmount: 0,
            });
        }

        setIsDialogOpen(false);
    };

    const handleDeleteGoal = async (goalId: string) => {
        try {
            const confirm = await Swal.fire({
                title: 'Tem certeza?',
                text: "Você não poderá recuperar essa meta excluída.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, excluir!',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#ef4444',
            });

            if (confirm.isConfirmed) {
                await deleteGoal(goalId);
                showToast('Meta excluída com sucesso!', 'success');
            }
        } catch (error) {
            showToast('Error deleting goal:', "error");
            console.error({ type: 'error', message: 'Erro ao excluir a meta. Tente novamente.', error: error });
        }
    };

    // Sub-component for individual goal card with Swipe
    const GoalCard = ({ goal }: { goal: IGoal }) => {
        const currentAmount = calculateGoalProgress(goal);
        const { color, icon, label, desc } = getThermometerStatus(goal);
        const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100);

        // Drag Logic using framer-motion (Same as TransactionCardMobile)
        const x = useMotionValue(0);
        // Background transformation: Left=Red(Delete), Right=Blue(Edit)
        const containerBg = useTransform(
            x,
            [-150, -50, 0, 50, 150],
            [
                "rgba(220, 38, 38, 1)",   // Red
                "rgba(220, 38, 38, 0.5)",
                "rgba(255, 255, 255, 0)", // Transparent at 0
                "rgba(37, 99, 235, 0.5)",
                "rgba(37, 99, 235, 1)"    // Blue
            ]
        );
        const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
        const editOpacity = useTransform(x, [50, 100], [0, 1]);

        const handleDragEnd = (_: any, info: PanInfo) => {
            // Threshold for action
            if (info.offset.x < -100) {
                handleDeleteGoal(goal._id?.toString() as string);
            } else if (info.offset.x > 100) {
                handleOpenEditDialog(goal);
            }
        };

        return (
            <div className="relative mb-2 sm:mb-0 rounded-xl overflow-hidden">
                {/* Swipe Background Action Layer (Mobile) */}
                <motion.div
                    style={{ backgroundColor: containerBg }}
                    className="absolute inset-0 flex items-center justify-between px-4 z-0 rounded-xl md:hidden"
                >
                    {/* Edit (Left) - revealed when dragging Right */}
                    <motion.div style={{ opacity: editOpacity }} className="flex items-center text-white font-bold">
                        <Edit className="mr-2 h-5 w-5" /> Editar
                    </motion.div>

                    {/* Delete (Right) - revealed when dragging Left */}
                    <motion.div style={{ opacity: deleteOpacity }} className="flex items-center text-white font-bold">
                        Excluir <Trash2 className="ml-2 h-5 w-5" />
                    </motion.div>
                </motion.div>

                {/* Card Foreground */}
                <motion.div
                    layout
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    style={{ x }} // Bind motion value
                    onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative z-10 group"
                >
                    <Card className={`border-l-4 border-${color}-500 bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                        {/* Desktop Background Blob (Decorative) */}
                        <div className={`hidden md:block absolute -top-10 -right-10 w-32 h-32 bg-${color}-100 dark:bg-${color}-900/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />

                        <CardContent className="p-5 relative z-10 cursor-grab active:cursor-grabbing">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {goal.name}
                                    </h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium border border-gray-200 dark:border-gray-600">
                                            {goal.tag}
                                        </span>
                                        {goal.date && (
                                            <span className="text-xs text-gray-400">
                                                Vence em {new Date(goal.date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Actions (Visible on Hover) */}
                                <div className="hidden md:flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500" onClick={() => handleOpenEditDialog(goal)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDeleteGoal(goal._id?.toString() as string)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-5">
                                <div className="w-16 h-16 flex-shrink-0 relative">
                                    <CircularProgressbar
                                        value={progress}
                                        text={`${progress.toFixed(0)}%`}
                                        styles={buildStyles({
                                            textSize: "26px",
                                            pathColor: progress >= 100 ? '#22c55e' : `var(--${color}-500, #3b82f6)`,
                                            textColor: progress >= 100 ? '#22c55e' : '#6b7280',
                                            trailColor: "#e5e7eb",
                                            pathTransitionDuration: 0.5,
                                        })}
                                    />
                                    {progress >= 100 && (
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-sm"
                                        >
                                            <Trophy className="w-3 h-3 text-white" />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-end">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Arrecadado</p>
                                        <p className="text-xs font-semibold text-gray-400">Meta: R$ {goal.targetAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-baseline">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            R$ {currentAmount.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center mt-2">
                                        <Tooltip title={desc}>
                                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-md bg-${color}-50 dark:bg-${color}-900/30 cursor-help transition-colors hover:bg-${color}-100`}>
                                                {icon}
                                                <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>
                                                    {label}
                                                </span>
                                                <Info className={`w-3 h-3 text-${color}-400 ml-1`} />
                                            </div>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    };

    return (
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-200 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Metas Financeiras</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Planeje seus sonhos e acompanhe o progresso</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                            onClick={handleOpenNewGoalDialog}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Meta
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white dark:bg-gray-800 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
                                {editingGoal ? <Edit className="w-5 h-5 text-blue-500" /> : <Rocket className="w-5 h-5 text-green-500" />}
                                {editingGoal ? "Editar Meta" : "Nova Meta"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Nome da Meta */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Qual é o seu objetivo?
                                </Label>
                                <Input
                                    placeholder="Ex: Aumentar Renda, Viagem, Carro Novo, Reserva..."
                                    value={newGoalName}
                                    onChange={(e) => setNewGoalName(e.target.value)}
                                    className="bg-gray-50 dark:bg-gray-900"
                                />
                                <p className="text-xs text-gray-500">Dê um nome inspirador para sua meta.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Valor */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Quanto custa? (R$)
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0.00"
                                            value={newGoalAmount}
                                            onChange={handleAmountChange}
                                            className="pl-8 bg-gray-50 dark:bg-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* Data */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Até quando?
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={newGoalDeadline}
                                            onChange={(e) => setNewGoalDeadline(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                            style={{ margin: 0 }}
                                        />
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 ${!newGoalDeadline && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newGoalDeadline ? new Date(newGoalDeadline).toLocaleDateString() : "Selecione a data"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Tag */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Fonte de Renda (Tag)
                                </Label>
                                <Select value={newGoalTag} onValueChange={setNewGoalTag}>
                                    <SelectTrigger className="bg-gray-50 dark:bg-gray-900">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-gray-500" />
                                            <SelectValue placeholder="Selecione..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 z-50 shadow-xl border dark:border-gray-700">
                                        {incomeTags.map((tag) => (
                                            <SelectItem key={tag} value={tag} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                                    <Info className="w-3 h-3 inline mr-1 mb-0.5" />
                                    O app somará todas as <strong>receitas</strong> com esta tag para calcular seu progresso.
                                </div>
                            </div>

                            <Button
                                onClick={handleAddOrEdit}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg mt-2 py-6 rounded-xl transition-transform hover:scale-[1.02]"
                            >
                                {editingGoal ? "Salvar Alterações" : "Criar Meta 🚀"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <div className="bg-gray-50/50 dark:bg-gray-900/50 min-h-[200px]">
                <AnimatePresence mode='wait'>
                    {goals.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center py-16 px-4 text-center"
                        >
                            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-5 rounded-full mb-4 relative ring-4 ring-yellow-50 dark:ring-yellow-900/10">
                                <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-500" />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="absolute -top-2 -right-2 text-2xl"
                                >
                                    ✨
                                </motion.div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Transforme Sonhos em Realidade</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
                                Você ainda não tem metas. Que tal começar? <br />
                                Defina objetivos como <strong>"Viagem ✈️"</strong> ou <strong>"Carro Novo 🚗"</strong> e deixe a gente te ajudar a chegar lá!
                            </p>
                            <Button
                                variant="outline"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30 font-semibold"
                                onClick={handleOpenNewGoalDialog}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Criar minha primeira meta
                            </Button>
                        </motion.div>
                    ) : (
                        <>
                            {/* Desktop Grid */}
                            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                <AnimatePresence>
                                    {goals.map((goal) => (
                                        <GoalCard key={goal._id?.toString()} goal={goal} />
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Mobile Swiper */}
                            <div className="md:hidden p-4 pb-10">
                                <Swiper
                                    slidesPerView={1.1}
                                    spaceBetween={16}
                                    pagination={{ clickable: true }}
                                    modules={[Pagination]}
                                    className="pb-8"
                                >
                                    {goals.map((goal) => (
                                        <SwiperSlide key={goal._id?.toString()}>
                                            <GoalCard goal={goal} />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}
