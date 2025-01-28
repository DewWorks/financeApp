import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog";
import { Target, Plus, DollarSign, Trash2, Edit } from 'lucide-react';
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
    const [newGoalTag, setNewGoalTag] = React.useState(incomeTags[0]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingGoal, setEditingGoal] = React.useState<IGoal | null>(null);

    const calculateGoalProgress = (goal: IGoal) => {
        const currentAmount = transactions.filter(
            (t) => t.tag === goal.tag && t.type === 'income'
        ).reduce((sum, t) => sum + t.amount, 0);
        return Math.min(currentAmount, goal.targetAmount);
    };

    const handleOpenEditDialog = (goal: IGoal) => {
        setEditingGoal(goal);
        setNewGoalName(goal.name);
        setNewGoalAmount(goal.targetAmount.toString());
        setNewGoalTag(goal.tag);
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
                currentAmount: editingGoal.currentAmount,
            });
        } else {
            await addGoal({
                name: newGoalName,
                targetAmount: parseFloat(newGoalAmount),
                tag: newGoalTag,
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
        <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Target className="h-6 w-6 text-blue-500" />
                    <CardTitle>Metas Financeiras</CardTitle>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Meta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle>{editingGoal ? 'Editar Meta Financeira' : 'Adicionar Nova Meta Financeira'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <Input
                                placeholder="Nome da meta"
                                value={newGoalName}
                                onChange={(e) => setNewGoalName(e.target.value)}
                            />
                            <Input
                                type="number"
                                placeholder="Valor alvo"
                                value={newGoalAmount}
                                onChange={(e) => setNewGoalAmount(e.target.value)}
                            />
                            <Select value={newGoalTag} onValueChange={setNewGoalTag}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma tag" />
                                </SelectTrigger>
                                <SelectContent>
                                    {incomeTags.map((tag) => (
                                        <SelectItem className="bg-white" key={tag} value={tag}>
                                            {tag}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAddOrEdit} className="w-full bg-blue-600 text-white">
                                {editingGoal ? 'Atualizar Meta' : 'Adicionar Meta'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {goals.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-lg font-semibold mb-2">Defina suas metas financeiras!</p>
                        <p className="text-gray-600">Clique em &#34;Nova Meta&#34; para começar a planejar seu futuro financeiro.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {goals.map(goal => {
                            const currentAmount = calculateGoalProgress(goal);
                            return (
                                <Card key={goal._id?.toString()} className="bg-gray-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold">{goal.name}</h3>
                                            <div className="flex items-center space-x-2">
                                                <DollarSign className="h-5 w-5 text-green-500" />
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(goal)}>
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal._id?.toString() as string)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-20 h-20">
                                                <CircularProgressbar
                                                    value={(currentAmount / goal.targetAmount) * 100}
                                                    text={`${((currentAmount / goal.targetAmount) * 100).toFixed(0)}%`}
                                                    styles={buildStyles({
                                                        textSize: '22px',
                                                        pathColor: `rgba(62, 152, 199, ${currentAmount / goal.targetAmount})`,
                                                        textColor: '#3e98c7',
                                                        trailColor: '#d6d6d6',
                                                    })}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600 mb-1">Progresso</p>
                                                <p className="font-medium">
                                                    R$ {currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">Tag: {goal.tag}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
