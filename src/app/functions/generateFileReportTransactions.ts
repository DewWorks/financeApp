import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ITransaction } from "@/interfaces/ITransaction";
import { calculateTotals, filterTransactionsByFrequency, getCategoryTotals } from "./report";

export const generateMonthlyReportPDF = async (transactions: ITransaction[]) => {
    const doc = new jsPDF("p", "mm", "a4");
    const logo = "https://raw.githubusercontent.com/DewWorks/financeApp/refs/heads/feat/reportFinances/public/logo.png";

    // Filtrar transações do mês
    const monthlyTransactions = filterTransactionsByFrequency(transactions, "monthly");
    const monthlyTotals = calculateTotals(monthlyTransactions);
    const monthlyCategoryTotals = getCategoryTotals(monthlyTransactions);

    // Cabeçalho do PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Relatório Financeiro Mensal", 15, 20);

    if (logo) {
        const img = new Image();
        img.src = logo;
        doc.addImage(img, "PNG", 150, 10, 40, 20);
    }

    // Totais
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Saldo Total: R$ ${(monthlyTotals.totalIncome - monthlyTotals.totalExpenses).toFixed(2)}`, 15, 40);
    doc.setTextColor(0, 150, 0);
    doc.text(`Total de Receitas: R$ ${monthlyTotals.totalIncome.toFixed(2)}`, 15, 50);
    doc.setTextColor(200, 0, 0);
    doc.text(`Total de Despesas: R$ ${monthlyTotals.totalExpenses.toFixed(2)}`, 15, 60);

    // Título da seção de categorias
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Categoria:", 15, 75);

    // Lista de categorias
    let yPosition = 85;
    Object.entries(monthlyCategoryTotals).forEach(([category, total]) => {
        doc.setFont("helvetica", "normal");
        doc.text(`${category}: R$ ${total.toFixed(2)}`, 15, yPosition);
        yPosition += 10;
    });

    // Adicionando Gráficos

    // Criar gráfico de pizza com HTML + Canvas
    const pieChart = document.createElement("div");
    pieChart.style.width = "300px";
    pieChart.style.height = "300px";
    pieChart.style.background = "#f3f3f3";
    pieChart.style.borderRadius = "10px";
    pieChart.style.padding = "10px";
    pieChart.innerHTML = `<canvas id="pieChartCanvas" width="300" height="300"></canvas>`;
    document.body.appendChild(pieChart);

    const pieCanvas = await html2canvas(pieChart);
    const pieChartData = pieCanvas.toDataURL("image/png");
    doc.addImage(pieChartData, "PNG", 120, 85, 80, 80);
    document.body.removeChild(pieChart);

    // Criar gráfico de barras
    const barChart = document.createElement("div");
    barChart.style.width = "400px";
    barChart.style.height = "300px";
    barChart.style.background = "#e3e3e3";
    barChart.style.borderRadius = "10px";
    barChart.style.padding = "10px";
    barChart.innerHTML = `<canvas id="barChartCanvas" width="400" height="300"></canvas>`;
    document.body.appendChild(barChart);

    const barCanvas = await html2canvas(barChart);
    const barChartData = barCanvas.toDataURL("image/png");
    doc.addImage(barChartData, "PNG", 15, 180, 170, 80);
    document.body.removeChild(barChart);

    // Criar gráfico de fluxo de caixa
    const lineChart = document.createElement("div");
    lineChart.style.width = "400px";
    lineChart.style.height = "300px";
    lineChart.style.background = "#d3d3d3";
    lineChart.style.borderRadius = "10px";
    lineChart.style.padding = "10px";
    lineChart.innerHTML = `<canvas id="lineChartCanvas" width="400" height="300"></canvas>`;
    document.body.appendChild(lineChart);

    const lineCanvas = await html2canvas(lineChart);
    const lineChartData = lineCanvas.toDataURL("image/png");
    doc.addImage(lineChartData, "PNG", 15, 270, 170, 80);
    document.body.removeChild(lineChart);

    // Listar transações detalhadas
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Detalhamento das Transações", 15, 20);

    let yDetailPosition = 30;
    monthlyTransactions.forEach((transaction) => {
        doc.setFont("helvetica", "normal");
        const color = transaction.type === "income" ? "green" : "red";
        doc.setTextColor(color === "green" ? 0 : 200, color === "green" ? 150 : 0, 0);
        doc.text(
            `${new Date(transaction.date).toLocaleDateString()} - ${transaction.description} - R$ ${transaction.amount.toFixed(2)} (${transaction.tag})`,
            15,
            yDetailPosition
        );
        yDetailPosition += 10;
        if (yDetailPosition > 270) {
            doc.addPage();
            yDetailPosition = 20;
        }
    });

    // Salvar PDF
    doc.save("Relatorio_Mensal.pdf");
};
