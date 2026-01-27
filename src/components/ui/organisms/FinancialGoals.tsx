import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog";
import { Target, Plus, Trash2, Edit, Trophy, Rocket, Info, TrendingUp, Wallet, Calendar as CalendarIcon, PiggyBank, Tag as TagIcon, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Thermometer, ThermometerSnowflake, ThermometerSun } from 'lucide-react';
import { incomeTags, expenseTags, ITransaction } from '@/interfaces/ITransaction';
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
import { Progress } from "@/components/ui/atoms/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/atoms/tabs";
import { FinancialProjections } from "./FinancialProjections";

interface FinancialGoalsProps {
    transactions: ITransaction[];
}

export function FinancialGoals({ transactions }: FinancialGoalsProps) {
    const { goals, addGoal, editGoal, deleteGoal, showToast } = useGoals();
    const [activeTab, setActiveTab] = React.useState<'savings' | 'spending'>('savings');

    // Form States
    const [newGoalName, setNewGoalName] = React.useState('');
    const [newGoalAmount, setNewGoalAmount] = React.useState('');
    const [newGoalDeadline, setNewGoalDeadline] = React.useState('');
    const [newGoalTag, setNewGoalTag] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingGoal, setEditingGoal] = React.useState<IGoal | null>(null);

    const dateInputRef = useRef<HTMLInputElement>(null);

    // Filter Goals based on Active Tab
    const filteredGoals = goals.filter(g => {
        // Legacy support: if no type, assume savings
        const goalType = g.type || 'savings';
        return goalType === activeTab;
    });

    const formatCurrencyDisplay = (value: string) => {
        const number = value.replace(/\D/g, "");
        if (!number) return "";
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewGoalAmount(formatCurrencyDisplay(e.target.value));
    };

    const calculateGoalProgress = (goal: IGoal) => {
        const goalType = goal.type || 'savings';
        const typeToCheck = goalType === 'spending' ? 'expense' : 'income';

        const currentAmount = Array.isArray(transactions) ? transactions.filter(
            (t) => t.tag === goal.tag && t.type === typeToCheck
        ).reduce((sum, t) => sum + t.amount, 0) : 0;

        return currentAmount;
    };

    // Consolidated Tag Styles
    const getTagStyles = (tag: string, type: 'savings' | 'spending') => {
        if (type === 'spending') {
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
        }
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
        // Default tag based on active tab
        setNewGoalTag(activeTab === 'savings' ? incomeTags[0] : expenseTags[0]);
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
            showToast('Preencha os campos obrigatórios', 'warning');
            return;
        }

        const goalData = {
            name: newGoalName,
            targetAmount: rawAmount,
            tag: newGoalTag,
            date: newGoalDeadline,
            type: activeTab, // Important: Save the type!
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
            title: 'Excluir Item?',
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
        const goalType = goal.type || 'savings';
        const isSavings = goalType === 'savings';

        let percentage = 0;
        if (goal.targetAmount > 0) {
            percentage = (currentAmount / goal.targetAmount) * 100;
        }

        // Display Logic
        let statusColor = 'bg-blue-500';
        let statusText = 'Em andamento';
        let barColor = 'bg-blue-500';

        if (isSavings) {
            const displayPercentage = Math.min(percentage, 100);
            if (displayPercentage >= 100) {
                statusColor = 'text-green-600';
                barColor = 'bg-green-500';
                statusText = 'Concluída!';
            } else {
                statusColor = 'text-blue-600';
                barColor = 'bg-blue-500';
                statusText = `${displayPercentage.toFixed(0)}% Concluído`;
            }
        } else {
            // Spending Logic
            if (percentage > 100) {
                statusColor = 'text-red-600';
                barColor = 'bg-red-500';
                statusText = 'Limite Estourado!';
            } else if (percentage > 75) {
                statusColor = 'text-yellow-600';
                barColor = 'bg-yellow-500';
                statusText = 'Quase no limite';
            } else {
                statusColor = 'text-green-600';
                barColor = 'bg-green-500';
                statusText = 'Dentro do limite';
            }
        }

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
            <div className="relative mb-2 sm:mb-0 rounded-xl overflow-hidden touch-pan-y group/card h-full">
                <motion.div style={{ backgroundColor: containerBg }} className="absolute inset-0 flex items-center justify-between px-4 z-0 rounded-xl md:hidden">
                    <motion.div style={{ opacity: editOpacity }} className="flex items-center text-white font-bold"><Edit className="mr-2 h-5 w-5" /> Editar</motion.div>
                    <motion.div style={{ opacity: deleteOpacity }} className="flex items-center text-white font-bold">Excluir <Trash2 className="ml-2 h-5 w-5" /></motion.div>
                </motion.div>

                <motion.div
                    layout drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x }} onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02 }} className="relative z-10 bg-white dark:bg-gray-800 h-full flex flex-col justify-between"
                >
                    <Card className={`border-none shadow-sm hover:shadow-lg transition-all dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-700 h-full`}>
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg dark:bg-opacity-20 ${isSavings ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {isSavings ? <Trophy className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg line-clamp-1">{goal.name}</h3>
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wide mt-1 ${getTagStyles(goal.tag, goalType as 'savings' | 'spending')}`}>
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

                            <div className="space-y-3 mt-auto">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
                                        <span className={`text-xl font-bold text-foreground`}>
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block">{isSavings ? 'Meta' : 'Limite'} R$ {goal.targetAmount.toLocaleString()}</span>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            R$ {currentAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`absolute top-0 left-0 h-full rounded-full ${barColor}`}
                                    />
                                </div>

                                {goal.date && (
                                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>{isSavings ? 'Alvo' : 'Renova'}: {new Date(goal.date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    };

    // Summary Calculation
    const totalTarget = filteredGoals.reduce((acc, goal) => acc + goal.targetAmount, 0);
    const totalCurrent = filteredGoals.reduce((acc, goal) => calculateGoalProgress(goal) + acc, 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    return (
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors overflow-hidden border-none ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="border-b dark:border-gray-700 pb-0 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 self-start sm:self-center">
                        <div className={`p-2 rounded-xl ${activeTab === 'savings' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                            {activeTab === 'savings' ? <PiggyBank className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {activeTab === 'savings' ? 'Planejamento de Metas' : 'Controle de Orçamento'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                {activeTab === 'savings'
                                    ? 'Defina objetivos e acompanhe suas economias'
                                    : 'Estabeleça limites para não gastar demais'}
                            </p>
                        </div>
                    </div>

                    <div className="w-full sm:w-auto">
                        <Tabs defaultValue="savings" className="w-full sm:w-[400px]" onValueChange={(val) => setActiveTab(val as 'savings' | 'spending')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="savings" className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Metas
                                </TabsTrigger>
                                <TabsTrigger value="spending" className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Limites
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Summary Section - Intuitiveness Booster */}
                <div className={`rounded-xl p-4 flex items-center justify-between ${activeTab === 'savings'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800'
                        : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-100 dark:border-red-800'
                    }`}>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {activeTab === 'savings' ? 'Total Acumulado' : 'Total Gasto Este Mês'}
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            R$ {totalCurrent.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                            de R$ {totalTarget.toLocaleString()} {activeTab === 'savings' ? 'objetivados' : 'permitidos'}
                        </span>
                    </div>
                    {filteredGoals.length > 0 && (
                        <div className="w-24 h-24 hidden sm:block">
                            {/* Simple Circular Progress or Icon could go here, simplified for text */}
                            <div className="text-right">
                                <span className={`text-2xl font-bold ${activeTab === 'savings' ? 'text-green-600' : (overallProgress > 100 ? 'text-red-600' : 'text-orange-600')}`}>
                                    {overallProgress.toFixed(0)}%
                                </span>
                                <p className="text-xs text-muted-foreground">{activeTab === 'savings' ? 'concluído' : 'do limite usado'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end py-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                                className={`font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 rounded-full px-4 ${activeTab === 'savings' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                onClick={handleOpenNewGoalDialog}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {activeTab === 'savings' ? 'Nova Meta' : 'Novo Limite'}
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-white dark:bg-gray-800 sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
                                    <div className={`p-2 rounded-full ${activeTab === 'savings' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {activeTab === 'savings' ? <Target className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    {editingGoal ? "Editar" : "Criar"} {activeTab === 'savings' ? 'Meta' : 'Limite de Gasto'}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome do Objetivo</Label>
                                    <Input placeholder={activeTab === 'savings' ? "Ex: Viagem para Praia, Carro Novo..." : "Ex: Mercado, Lazer, Ifood..."} value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Valor {activeTab === 'savings' ? 'Alvo' : 'Limite'} (R$)</Label>
                                        <Input inputMode="numeric" placeholder="0.00" value={newGoalAmount} onChange={handleAmountChange} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{activeTab === 'savings' ? 'Data Alvo' : 'Renova em'}</Label>
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
                                    <Label>
                                        {activeTab === 'savings'
                                            ? 'Qual Tag soma saldo nesta meta?'
                                            : 'Qual Tag consome este limite?'}
                                    </Label>
                                    <Select value={newGoalTag} onValueChange={setNewGoalTag}>
                                        <SelectTrigger>
                                            <div className="flex items-center gap-2">
                                                <TagIcon className="w-4 h-4 text-gray-500" />
                                                <SelectValue placeholder="Selecione..." />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-950 border border-border z-[100]">
                                            {(activeTab === 'savings' ? incomeTags : expenseTags).map((tag) => (
                                                <SelectItem key={tag} value={tag} className="cursor-pointer hover:bg-accent focus:bg-accent text-foreground block w-full">
                                                    {tag}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-gray-500 leading-tight">
                                        {activeTab === 'savings'
                                            ? "Exemplo: Se escolher 'Investimentos', toda entrada com essa tag aumenta o progresso."
                                            : "Exemplo: Se escolher 'Alimentação', toda saída com essa tag consome o limite."}
                                    </p>
                                </div>

                                <Button onClick={handleAddOrEdit} className={`w-full font-bold text-white py-6 rounded-xl mt-2 ${activeTab === 'savings' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                    {editingGoal ? "Salvar Alterações" : activeTab === 'savings' ? "Criar Meta de Economia" : "Definir Limite"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <div className="bg-gray-50/50 dark:bg-gray-900/50 min-h-[150px]">
                <AnimatePresence mode='wait'>
                    {filteredGoals.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-10 px-4 text-center"
                        >
                            {activeTab === 'savings' ? <PiggyBank className="w-16 h-16 text-green-200 mb-4" /> : <Wallet className="w-16 h-16 text-red-200 mb-4" />}
                            <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg mb-1">
                                {activeTab === 'savings' ? "Comece a economizar!" : "Controle seus gastos!"}
                            </p>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
                                {activeTab === 'savings'
                                    ? "Crie uma meta para aquela viagem ou compra especial."
                                    : "Defina um teto de gastos para categorias como Lazer ou Mercado."}
                            </p>
                            <Button variant="outline" onClick={handleOpenNewGoalDialog} className="border-dashed border-2 hover:bg-accent hover:text-accent-foreground">
                                {activeTab === 'savings' ? "+ Nova Meta" : "+ Novo Limite"}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                <AnimatePresence>{filteredGoals.map((goal) => <GoalCard key={goal._id?.toString()} goal={goal} />)}</AnimatePresence>
                            </div>
                            <div className="md:hidden p-4 pb-8">
                                <Swiper slidesPerView={1.1} spaceBetween={12} pagination={{ clickable: true }} modules={[Pagination]} className="pb-6">
                                    {filteredGoals.map((goal) => <SwiperSlide key={goal._id?.toString()}><GoalCard goal={goal} /></SwiperSlide>)}
                                </Swiper>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Smart Goals v2 - Projections Section */}
                {filteredGoals.length > 0 && (
                    <div className="p-6 border-t dark:border-gray-800">
                        <FinancialProjections
                            goals={goals}
                            transactions={transactions}
                            type={activeTab}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}
