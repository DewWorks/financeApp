
"use client";
import React from 'react';
import { Title } from "@/components/ui/molecules/Title";
import { Button } from "@/components/ui/atoms/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function TermsPage() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Back Link */}
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Voltar
                    </Button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <header className="mb-8 border-b pb-4 dark:border-gray-700">
                        <Title />
                        <h1 className="text-3xl font-bold mt-4 text-gray-900 dark:text-gray-100">Termos de Uso e Política de Privacidade</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Última atualização: 25 de Janeiro de 2025</p>
                    </header>

                    <article className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Aceitação dos Termos</h2>
                            <p>
                                Ao criar uma conta e utilizar o FinanceApp ("Plataforma"), você concorda em cumprir estes Termos de Uso e nossa Política de Privacidade.
                                Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Descrição do Serviço</h2>
                            <p>
                                O FinanceApp é uma ferramenta de gestão financeira pessoal que permite aos usuários agregar dados bancários, categorizar transações e visualizar insights sobre suas finanças.
                                Utilizamos serviços de terceiros (como Pluggy) para conexão segura com instituições financeiras e Inteligência Artificial (como Google Gemini) para enriquecimento de dados.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Privacidade e Segurança de Dados</h2>
                            <p>
                                A sua privacidade é nossa prioridade.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li><strong>Dados Bancários:</strong> Não armazenamos suas senhas bancárias. A conexão é feita via Open Finance através de parceiros regulados (Pluggy) com criptografia de ponta a ponta.</li>
                                <li><strong>Uso de IA:</strong> Utilizamos IA para categorizar suas transações. Os dados enviados são anonimizados sempre que possível e utilizados estritamente para funcionalidade do serviço.</li>
                                <li><strong>Compartilhamento:</strong> Não vendemos seus dados pessoais para terceiros.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Responsabilidades do Usuário</h2>
                            <p>
                                Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorram em sua conta.
                                Você concorda em fornecer informações verdadeiras e atualizadas durante o cadastro.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Planos e Pagamentos</h2>
                            <p>
                                Oferecemos planos Gratuitos e Premium (PRO/MAX). Detalhes sobre cobrança, renovação e cancelamento estão disponíveis na página de Preços.
                                O cancelamento pode ser feito a qualquer momento, mantendo-se o acesso até o fim do ciclo de faturamento vigente.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">6. Alterações nos Termos</h2>
                            <p>
                                Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre alterações significativas através da plataforma ou e-mail.
                                O uso continuado após as alterações constitui aceitação dos novos termos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">7. Contato</h2>
                            <p>
                                Para dúvidas sobre estes termos ou sobre seus dados, entre em contato através do canal de suporte na plataforma.
                            </p>
                        </section>
                    </article>
                </div>
            </div>
        </div>
    );
}
