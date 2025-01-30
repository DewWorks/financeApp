import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog";
import { Target, Plus, DollarSign, Trash2, Edit } from 'lucide-react';
import { Thermometer, ThermometerSnowflake, ThermometerSun } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { incomeTags } from '@/interfaces/ITransaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select";
import { useGoals } from '@/hooks/useGoals';
import {IGoal} from "@/interfaces/IGoal";
import {useTransactions} from "@/hooks/useTransactions";
import Swal from "sweetalert2";

export function FinancialGoals() {
    const { goals, addGoal, editGoal, deleteGoal, showToast } = useGoals();
    const { transactions } = useTransactions();
    const [newGoalName, setNewGoalName] = React.useState('');
    const [newGoalAmount, setNewGoalAmount] = React.useState('');
    const [newGoalDeadline, setNewGoalDeadline] = React.useState('');
    const [newGoalTag, setNewGoalTag] = React.useState(incomeTags[0]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingGoal, setEditingGoal] = React.useState<IGoal | null>(null);

    const calculateGoalProgress = (goal: IGoal) => {
        const currentAmount = transactions.filter(
            (t) => t.tag === goal.tag && t.type === 'income'
        ).reduce((sum, t) => sum + t.amount, 0);
        return Math.min(currentAmount, goal.targetAmount);
    };

    const getThermometerStatus = (goal: IGoal) => {
        if (!goal.date) return { color: 'gray', icon: <Thermometer className="h-5 w-5 text-gray-500" />, label: 'Sem prazo' };

        const deadlineDate = new Date(goal.date);
        const today = new Date();
        const timeDiff = deadlineDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Converte ms para dias
        const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;

        // Lógica para definir a cor e o ícone com base no tempo e progresso
        if (daysLeft <= 7 && progressPercentage < 50) {
            return { color: 'red', icon: <Thermometer className="h-5 w-5 text-red-500" />, label: 'Muito quente' };
        } else if (daysLeft <= 14 && progressPercentage < 70) {
            return { color: 'orange', icon: <ThermometerSun className="h-5 w-5 text-orange-500" />, label: 'Quente' };
        } else if (daysLeft > 30 && progressPercentage < 30) {
            return { color: 'blue', icon: <ThermometerSnowflake className="h-5 w-5 text-blue-500" />, label: 'Frio' };
        } else if (daysLeft > 30 && progressPercentage > 70) {
            return { color: 'green', icon: <Thermometer className="h-5 w-5 text-green-500" />, label: 'Equilibrado' };
        } else {
            return { color: 'gray', icon: <Thermometer className="h-5 w-5 text-gray-500" />, label: 'Neutro' };
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
        setNewGoalAmount(goal.targetAmount.toString());
        setNewGoalTag(goal.tag);
        setNewGoalDeadline(goal.date ? goal.date.toString() : '');
        setIsDialogOpen(true);
    };

    const handleAddOrEdit = async () => {
        if (!newGoalName || !newGoalAmount || isNaN(Number(newGoalAmount)) || !newGoalTag) {
            console.error({ type: 'error', message: 'Preencha todos os campos corretamente.' });
            return;
        }

        if (editingGoal) {
            await editGoal({
                _id: editingGoal._id,
                name: newGoalName,
                targetAmount: parseFloat(newGoalAmount),
                tag: newGoalTag,
                date: newGoalDeadline,
                currentAmount: editingGoal.currentAmount,
            });
        } else {
            await addGoal({
                name: newGoalName,
                targetAmount: parseFloat(newGoalAmount),
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
            });

            if(confirm) {
                await deleteGoal(goalId);
                showToast('Meta excluída com sucesso!', 'success');
            }else return
        } catch (error) {
            showToast('Error deleting goal:', "error");
            console.error({ type: 'error', message: 'Erro ao excluir a meta. Tente novamente.', error: error });
        }
    };

    return (
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Target className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                    <CardTitle className="text-gray-900 dark:text-gray-100">Metas Financeiras</CardTitle>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            onClick={handleOpenNewGoalDialog}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-gray-100">
                                {editingGoal ? "Editar Meta Financeira" : "Adicionar Nova Meta Financeira"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <Input
                                placeholder="Nome da meta"
                                value={newGoalName}
                                onChange={(e) => setNewGoalName(e.target.value)}
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <Input
                                type="number"
                                placeholder="Valor alvo"
                                value={newGoalAmount}
                                onChange={(e) => setNewGoalAmount(e.target.value)}
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <Input
                                type="date"
                                placeholder="Data final"
                                value={newGoalDeadline}
                                onChange={(e) => setNewGoalDeadline(e.target.value)}
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <Select value={newGoalTag} onValueChange={setNewGoalTag}>
                                <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                    <SelectValue placeholder="Selecione uma tag" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-700">
                                    {incomeTags.map((tag) => (
                                        <SelectItem key={tag} value={tag} className="text-gray-900 dark:text-gray-100">
                                            {tag}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleAddOrEdit}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                {editingGoal ? "Atualizar Meta" : "Adicionar Meta"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {goals.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Defina suas metas financeiras!
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                            Clique em &quot;Nova Meta&quot; para começar a planejar seu futuro financeiro.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {goals.map((goal) => {
                            const currentAmount = calculateGoalProgress(goal)
                            const { color, icon, label } = getThermometerStatus(goal)
                            return (
                                <Card key={goal._id?.toString()} className="bg-gray-50 dark:bg-gray-700">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{goal.name}</h3>
                                            <div className="flex items-center space-x-2">
                                                <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(goal)}>
                                                    <Edit className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteGoal(goal._id?.toString() as string)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-20 h-20">
                                                <CircularProgressbar
                                                    value={(currentAmount / goal.targetAmount) * 100}
                                                    text={`${((currentAmount / goal.targetAmount) * 100).toFixed(0)}%`}
                                                    styles={buildStyles({
                                                        textSize: "22px",
                                                        pathColor: `rgba(62, 152, 199, ${currentAmount / goal.targetAmount})`,
                                                        textColor: "#3e98c7",
                                                        trailColor: "#d6d6d6",
                                                    })}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Progresso</p>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    R$ {currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tag: {goal.tag}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    Data final: {goal.date ? new Date(goal.date).toLocaleDateString() : "Não definida"}
                                                </p>
                                                <div className="flex items-center mt-2 space-x-2">
                                                    {icon}
                                                    <p className={`text-${color}-600 dark:text-${color}-400 font-medium`}>{label}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
