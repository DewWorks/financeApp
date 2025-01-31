// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import { ITransaction } from "@/interfaces/ITransaction";
// import { calculateTotals, filterTransactionsByFrequency, getCategoryTotals } from "./report";
// import * as fs from 'fs';
// import * as path from 'path';
// import PDFDocument from 'pdfkit';
// import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
// import { ChartType } from 'chart.js';
// import { IUser } from '../../interfaces/IUser';
// import { IGoal } from '../../interfaces/IGoal';
// import axios from 'axios';
//
// export const generateMonthlyReportPDF = async (transactions: ITransaction[]) => {
//     const doc = new jsPDF("p", "mm", "a4");
//     const logo = "https://raw.githubusercontent.com/DewWorks/financeApp/refs/heads/feat/reportFinances/public/logo.png";
//
//     // Filtrar transações do mês
//     const monthlyTransactions = filterTransactionsByFrequency(transactions, "monthly");
//     const monthlyTotals = calculateTotals(monthlyTransactions);
//     const monthlyCategoryTotals = getCategoryTotals(monthlyTransactions);
//
//     // Cabeçalho do PDF
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(18);
//     doc.text("Relatório Financeiro Mensal", 15, 20);
//
//     if (logo) {
//         const img = new Image();
//         img.src = logo;
//         doc.addImage(img, "PNG", 150, 10, 40, 20);
//     }
//
//     // Totais
//     doc.setFontSize(12);
//     doc.setTextColor(50);
//     doc.text(`Saldo Total: R$ ${(monthlyTotals.totalIncome - monthlyTotals.totalExpenses).toFixed(2)}`, 15, 40);
//     doc.setTextColor(0, 150, 0);
//     doc.text(`Total de Receitas: R$ ${monthlyTotals.totalIncome.toFixed(2)}`, 15, 50);
//     doc.setTextColor(200, 0, 0);
//     doc.text(`Total de Despesas: R$ ${monthlyTotals.totalExpenses.toFixed(2)}`, 15, 60);
//
//     // Título da seção de categorias
//     doc.setTextColor(0);
//     doc.setFont("helvetica", "bold");
//     doc.text("Distribuição por Categoria:", 15, 75);
//
//     // Lista de categorias
//     let yPosition = 85;
//     Object.entries(monthlyCategoryTotals).forEach(([category, total]) => {
//         doc.setFont("helvetica", "normal");
//         doc.text(`${category}: R$ ${total.toFixed(2)}`, 15, yPosition);
//         yPosition += 10;
//     });
//
//     // Adicionando Gráficos
//
//     // Criar gráfico de pizza com HTML + Canvas
//     const pieChart = document.createElement("div");
//     pieChart.style.width = "300px";
//     pieChart.style.height = "300px";
//     pieChart.style.background = "#f3f3f3";
//     pieChart.style.borderRadius = "10px";
//     pieChart.style.padding = "10px";
//     pieChart.innerHTML = `<canvas id="pieChartCanvas" width="300" height="300"></canvas>`;
//     document.body.appendChild(pieChart);
//
//     const pieCanvas = await html2canvas(pieChart);
//     const pieChartData = pieCanvas.toDataURL("image/png");
//     doc.addImage(pieChartData, "PNG", 120, 85, 80, 80);
//     document.body.removeChild(pieChart);
//
//     // Criar gráfico de barras
//     const barChart = document.createElement("div");
//     barChart.style.width = "400px";
//     barChart.style.height = "300px";
//     barChart.style.background = "#e3e3e3";
//     barChart.style.borderRadius = "10px";
//     barChart.style.padding = "10px";
//     barChart.innerHTML = `<canvas id="barChartCanvas" width="400" height="300"></canvas>`;
//     document.body.appendChild(barChart);
//
//     const barCanvas = await html2canvas(barChart);
//     const barChartData = barCanvas.toDataURL("image/png");
//     doc.addImage(barChartData, "PNG", 15, 180, 170, 80);
//     document.body.removeChild(barChart);
//
//     // Criar gráfico de fluxo de caixa
//     const lineChart = document.createElement("div");
//     lineChart.style.width = "400px";
//     lineChart.style.height = "300px";
//     lineChart.style.background = "#d3d3d3";
//     lineChart.style.borderRadius = "10px";
//     lineChart.style.padding = "10px";
//     lineChart.innerHTML = `<canvas id="lineChartCanvas" width="400" height="300"></canvas>`;
//     document.body.appendChild(lineChart);
//
//     const lineCanvas = await html2canvas(lineChart);
//     const lineChartData = lineCanvas.toDataURL("image/png");
//     doc.addImage(lineChartData, "PNG", 15, 270, 170, 80);
//     document.body.removeChild(lineChart);
//
//     // Listar transações detalhadas
//     doc.addPage();
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(14);
//     doc.text("Detalhamento das Transações", 15, 20);
//
//     let yDetailPosition = 30;
//     monthlyTransactions.forEach((transaction) => {
//         doc.setFont("helvetica", "normal");
//         const color = transaction.type === "income" ? "green" : "red";
//         doc.setTextColor(color === "green" ? 0 : 200, color === "green" ? 150 : 0, 0);
//         doc.text(
//             `${new Date(transaction.date).toLocaleDateString()} - ${transaction.description} - R$ ${transaction.amount.toFixed(2)} (${transaction.tag})`,
//             15,
//             yDetailPosition
//         );
//         yDetailPosition += 10;
//         if (yDetailPosition > 270) {
//             doc.addPage();
//             yDetailPosition = 20;
//         }
//     });
//
//     // Salvar PDF
//     doc.save("Relatorio_Mensal.pdf");
// };
//
// const PRIMARY_COLOR = '#1E3A8A';
// const SECONDARY_COLOR = '#10B981';
// const TEXT_COLOR = '#111827';
//
// const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 400 });
// const LOGO_PATHS = [
//     path.join(__dirname, 'src/assets/img/logo/logo.png'),
//     path.join(__dirname, 'logo.png'),
//     'https://raw.githubusercontent.com/DewWorks/financeApp/refs/heads/main/public/logo.png?token=GHSAT0AAAAAAC5TU5H4CA4ZGMCPDAJQU4N6Z4434ZQ'
// ];
//
// async function getValidLogoPath(): Promise<string | null> {
//     for (const logoPath of LOGO_PATHS) {
//         if (fs.existsSync(logoPath)) {
//             return logoPath;
//         }
//     }
//     try {
//         const response = await axios.get(LOGO_PATHS[2], { responseType: 'arraybuffer' });
//         const tempLogoPath = path.join(__dirname, 'temp_logo.png');
//         fs.writeFileSync(tempLogoPath, response.data);
//         return tempLogoPath;
//     } catch (error) {
//         console.error('Erro ao baixar a logo:', error);
//         return null;
//     }
// }
//
// async function generateChart(data: any, labels: string[], type: ChartType, title: string): Promise<string> {
//     const chartBuffer = await chartJSNodeCanvas.renderToBuffer({
//         type,
//         data: {
//             labels,
//             datasets: [{
//                 data,
//                 backgroundColor: ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'],
//                 borderColor: '#FFFFFF',
//                 borderWidth: 1,
//             }]
//         },
//         options: {
//             plugins: {
//                 title: {
//                     display: true,
//                     text: title,
//                     color: '#000',
//                     font: { size: 16 }
//                 }
//             }
//         }
//     });
//
//     const chartPath = path.join(__dirname, `${title.replace(/\s+/g, '_')}.png`);
//     fs.writeFileSync(chartPath, chartBuffer);
//     return chartPath;
// }
//
// export async function generatePDF(user: IUser, transactions: ITransaction[], goals: IGoal[]): Promise<string> {
//     const doc = new PDFDocument({ margin: 50 });
//     const filePath = path.join(__dirname, `report_${user._id}.pdf`);
//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);
//
//     const logoPath = await getValidLogoPath();
//     if (logoPath) {
//         doc.image(logoPath, 50, 50, { width: 100 });
//     }
//
//     doc.fillColor(PRIMARY_COLOR).fontSize(20).text('Relatório Financeiro', { align: 'center' });
//     doc.fillColor(TEXT_COLOR).fontSize(14).text(`Usuário: ${user.name} (${user.email})`, { align: 'center' });
//     doc.moveDown();
//
//     const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
//     const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
//     const balance = totalIncome - totalExpense;
//
//     doc.fillColor(SECONDARY_COLOR).text(`Total de Receitas: R$${totalIncome.toFixed(2)}`);
//     doc.fillColor(SECONDARY_COLOR).text(`Total de Despesas: R$${totalExpense.toFixed(2)}`);
//     doc.fillColor(balance >= 0 ? '#10B981' : '#EF4444').text(`Saldo Atual: R$${balance.toFixed(2)}`);
//     doc.moveDown();
//
//     const pieChartPath = await generateChart([totalIncome, totalExpense], ['Receitas', 'Despesas'], 'pie', 'Distribuição de Receitas e Despesas');
//     const barChartPath = await generateChart(transactions.map(t => t.amount), transactions.map(t => t.description), 'bar', 'Últimas Transações');
//     const lineChartPath = await generateChart(transactions.map(t => t.amount), transactions.map(t => t.date), 'line', 'Fluxo de Caixa');
//     const areaChartPath = await generateChart([totalIncome, totalExpense], ['Receita', 'Despesa'], 'line', 'Receitas vs Despesas');
//
//     doc.fillColor(SECONDARY_COLOR).text('Transações:', { underline: true });
//     transactions.forEach(t => {
//         doc.fillColor(TEXT_COLOR).text(`${t.date} - ${t.description}: R$${t.amount} (${t.type})`);
//     });
//
//     doc.moveDown();
//     doc.fillColor(SECONDARY_COLOR).text('Metas Financeiras:', { underline: true });
//     goals.forEach(g => {
//         doc.fillColor(TEXT_COLOR).text(`${g.name}: R$${g.currentAmount} / R$${g.targetAmount}`);
//     });
//
//     doc.moveDown();
//     const chartWidth = 400;
//     const startX = 50;
//     let currentY = 350;
//
//     doc.image(pieChartPath, startX, currentY, { width: chartWidth });
//     currentY += 250;
//     doc.image(barChartPath, startX, currentY, { width: chartWidth });
//     currentY += 250;
//     doc.image(lineChartPath, startX, currentY, { width: chartWidth });
//     currentY += 250;
//     doc.image(areaChartPath, startX, currentY, { width: chartWidth });
//
//     doc.end();
//     return new Promise((resolve) => {
//         stream.on('finish', () => {
//             fs.unlinkSync(pieChartPath);
//             fs.unlinkSync(barChartPath);
//             fs.unlinkSync(lineChartPath);
//             fs.unlinkSync(areaChartPath);
//             resolve(filePath);
//         });
//     });
// }
