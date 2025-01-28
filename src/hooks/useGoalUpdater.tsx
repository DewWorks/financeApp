// import { useEffect, useCallback } from 'react';
// import {ITransaction} from "@/interfaces/ITransaction";
// import {useRouter} from "next/navigation";
// import {IGoal} from "@/interfaces/IGoal";
//
// const useGoalUpdater = (goals: IGoal[], transactions: ITransaction[], fetchGoals: () => void, showToast: (message: string, type: string) => void) => {
//     const router = useRouter();
//
//     const handleAuthError = useCallback(() => {
//         const modal = document.createElement('div')
//         modal.innerHTML = `
//       <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//         <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
//           <img src="/logo.png" alt="Logo" class="mx-auto mb-4 w-24 h-24" />
//           <h2 class="text-2xl font-bold mb-4 text-center">Sessão Expirada</h2>
//           <p class="mb-6 text-center">Sua sessão expirou. Por favor, faça login novamente para continuar usando nossa plataforma.</p>
//           <div class="flex justify-center space-x-4">
//             <button id="loginBtn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Login</button>
//             <button id="registerBtn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Cadastrar</button>
//           </div>
//         </div>
//       </div>
//     `
//         document.body.appendChild(modal)
//
//         const loginBtn = modal.querySelector('#loginBtn')
//         const registerBtn = modal.querySelector('#registerBtn')
//
//         loginBtn?.addEventListener('click', () => {
//             document.body.removeChild(modal)
//             router.push('/auth/login')
//         })
//
//         registerBtn?.addEventListener('click', () => {
//             document.body.removeChild(modal)
//             router.push('/auth/register')
//         })
//     }, [router])
//
//     const editGoal = async (updatedGoal: Partial<IGoal>) => {
//         try {
//             const response = await fetch(`/api/goals/${updatedGoal._id}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(updatedGoal),
//             });
//
//             if (response.ok) {
//                 await fetchGoals(); // Atualiza a lista de goals após sucesso
//                 showToast('Meta atualizada com sucesso!', 'success');
//             } else if (response.status === 401) {
//                 handleAuthError(); // Caso erro de autenticação
//             } else {
//                 const errorData = await response.json();
//                 console.error('Failed to edit goal:', errorData.error);
//                 showToast('Falha ao atualizar meta. Por favor, tente novamente.', 'error');
//             }
//         } catch (error) {
//             console.error('Error editing goal:', error);
//             showToast('Ocorreu um erro ao atualizar a meta. Por favor, tente novamente.', 'error');
//         }
//     };
//
//     const updateGoalProgress = useCallback(() => {
//         goals.forEach(goal => {
//             const relevantTransactions = transactions.filter(t => t.tag === goal.tag && t.type === 'income');
//             const currentAmount = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
//             const newAmount = Math.min(currentAmount, goal.targetAmount);
//             if (newAmount !== goal.currentAmount) {
//                 editGoal({ ...goal, currentAmount: newAmount });
//             }
//         });
//     }, [transactions, goals, editGoal]);
//
//     useEffect(() => {
//         updateGoalProgress();
//     }, [updateGoalProgress]); // Utilizando a versão memorizada de updateGoalProgress
// };
//
// export default useGoalUpdater;
