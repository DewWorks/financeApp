'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import * as brain from 'brain.js';
import { ITransaction } from '@/interfaces/ITransaction';

interface ExpensePredictionProps {
    transactions: ITransaction[];
}

export function ExpensePrediction({ transactions }: ExpensePredictionProps) {
    const [prediction, setPrediction] = useState<number | null>(null);

    const trainAndPredict = useCallback(() => {
        const trainingData = transactions
            .filter(t => t.type === 'expense')
            .map(t => ({
                input: [new Date(t.date).getMonth()],
                output: [t.amount / 1000]
            }));

        const net = new brain.NeuralNetwork();
        net.train(trainingData);

        const nextMonth = (new Date().getMonth() + 1) % 12;
        const rawPrediction = (net.run([nextMonth]) as number[])[0];
        const predictedExpense = rawPrediction * 1000;

        setPrediction(predictedExpense);
    }, [transactions]);

    useEffect(() => {
        if (transactions.length > 0) {
            trainAndPredict();
        }
    }, [transactions, trainAndPredict]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Previsão de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
                {prediction !== null ? (
                    <p>Gasto previsto para o próximo mês: R$ {prediction.toFixed(2)}</p>
                ) : (
                    <p>Carregando previsão...</p>
                )}
                <Button onClick={trainAndPredict} className="mt-4 bg-blue-600 text-white">Atualizar Previsão</Button>
            </CardContent>
        </Card>
    );
}
