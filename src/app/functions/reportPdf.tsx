// import { compile } from "@fileforge/react-print";
// import { IUser } from "@/interfaces/IUser";
// import { ITransaction } from "@/interfaces/ITransaction";
// import { IGoal } from "@/interfaces/IGoal";
// import { ReportModal } from '@/components/ui/organisms/ReportModal';
//
// // 🔹 Criamos um componente wrapper para renderizar corretamente o `ReportModal`
// const ReportPrintWrapper = (props: {
//     user: IUser;
//     transactions: ITransaction[];
//     goals: IGoal[];
//     onClose: () => void;
// }) => <ReportModal {...props} />;
//
// export const generatePDF = async (user: IUser, transactions: ITransaction[], goals: IGoal[]) => {
//     try {
//         console.log("📄 Gerando PDF a partir do ReportModal...");
//
//         // 🔹 Passa o JSX diretamente para `compile()`, sem `{ children: ... }`
//         const reportHTML = await compile(<ReportPrintWrapper user={user} transactions={transactions} goals={goals} onClose={() => {}} />);
//
//         // 🔹 Abre uma nova aba e exibe o conteúdo renderizado
//         const printWindow = window.open("", "_blank");
//         if (!printWindow) return;
//
//         printWindow.document.write(reportHTML);
//         printWindow.document.close();
//         printWindow.focus();
//
//         // 🔹 Aguarda a renderização e chama a impressão
//         setTimeout(() => {
//             printWindow.print();
//             printWindow.close();
//         }, 1000);
//     } catch (error) {
//         console.error("❌ Erro ao gerar PDF:", error);
//     }
// };
