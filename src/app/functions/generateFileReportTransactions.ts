import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ITransaction } from "@/interfaces/ITransaction";
import {calculateTotals, filterTransactionsByFrequency, getCategoryTotals } from "./report";

export const generateMonthlyReportPDF = async (transactions: ITransaction[]) => {
    const doc = new jsPDF();

    // Filtrar transações do mês
    const monthlyTransactions = filterTransactionsByFrequency(transactions, "monthly");
    const monthlyTotals = calculateTotals(monthlyTransactions);
    const monthlyCategoryTotals = getCategoryTotals(monthlyTransactions);

    // Cabeçalho do PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Relatório Financeiro Mensal", 15, 20);

    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Saldo Total: R$ ${(monthlyTotals.totalIncome - monthlyTotals.totalExpenses).toFixed(2)}`, 15, 40);
    doc.setTextColor(0, 150, 0);
    doc.text(`Total de Receitas: R$ ${monthlyTotals.totalIncome.toFixed(2)}`, 15, 50);
    doc.setTextColor(200, 0, 0);
    doc.text(`Total de Despesas: R$ ${monthlyTotals.totalExpenses.toFixed(2)}`, 15, 60);

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Categoria:", 15, 75);

    let yPosition = 85;
    Object.entries(monthlyCategoryTotals).forEach(([category, total]) => {
        doc.setFont("helvetica", "normal");
        doc.text(`${category}: R$ ${total.toFixed(2)}`, 15, yPosition);
        yPosition += 10;
    });

    // Criar gráfico de pizza com HTML + Canvas
    const chartContainer = document.createElement("div");
    chartContainer.style.width = "300px";
    chartContainer.style.height = "300px";
    chartContainer.style.background = "#f3f3f3";
    chartContainer.style.borderRadius = "10px";
    chartContainer.style.padding = "10px";
    chartContainer.innerHTML = `
      <canvas id="reportChart" width="300" height="300"></canvas>
    `;
    document.body.appendChild(chartContainer);

    const canvas = await html2canvas(chartContainer);
    const chartData = canvas.toDataURL("image/png");

    doc.addImage(chartData, "PNG", 120, 85, 80, 80);
    document.body.removeChild(chartContainer);

    // Salvar PDF
    doc.save("Relatorio_Mensal.pdf");
};
