"use client";

import React from "react";
import { Check, X, Star, Zap, MessageCircle, Building2, BrainCircuit, ArrowRight, ShieldCheck, ChevronDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PricingPage() {
    const { currentPlan } = useUser();
    const router = useRouter();
    const [loading, setLoading] = React.useState<string | null>(null);

    const handleSubscribe = async (plan: string) => {
        try {
            setLoading(plan);
            const userString = localStorage.getItem("user-id");

            if (!userString) {
                router.push('/auth/login');
                return;
            }

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: plan,
                    userId: userString,
                    successUrl: window.location.origin + '/dashboard?success=true',
                    cancelUrl: window.location.origin + '/pricing?canceled=true',
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Stripe Error:", data.error);
                alert("Erro ao iniciar pagamento. Tente novamente.");
                setLoading(null);
            }

        } catch (error) {
            console.error("Checkout Error:", error);
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-blue-600/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                            ✨ O Futuro das suas Finanças
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white via-blue-100 to-blue-300 bg-clip-text text-transparent leading-tight">
                            Controle Financeiro Inteligente <br /> com o Poder da IA.
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                           Saiba controlar suas finanças, e extraia o poder da Inteligência Artificial para gerenciar melhor o seu dinheiro!
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* VISUAL DEMOS SECTION */}
            <section className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto space-y-32">

                    {/* Feature 1: WhatsApp Bot */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col md:flex-row items-center gap-16"
                    >
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-4">
                                <MessageCircle size={28} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Lançamentos via WhatsApp</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Esqueça as planilhas chatas. Envie uma mensagem para nosso número e ele registra, categoriza e organiza suas despesas automaticamente em segundos.
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Check className="w-5 h-5 text-green-500" /> Compreensão de mensagens naturais
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Check className="w-5 h-5 text-green-500" /> Categorização automática com IA
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                            {/* Fake Chat UI */}
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-md">
                                        Gastei 150 reais no mercado agora
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-[#202c33] text-white p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm shadow-md border border-zinc-700">
                                        <div className="flex items-center gap-2 mb-2 font-semibold text-green-400">
                                            <Check size={14} /> Anotado!
                                        </div>
                                        <div>Despesa de <b>R$ 150,00</b> registrada em <b>Mercado</b>. 🛒</div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <div className="bg-[#005c4b] text-white py-2 px-4 rounded-full flex items-center gap-3 w-fit ml-auto opacity-90">
                                        <div className="w-24 h-1 bg-white/30 rounded-full animate-pulse"></div>
                                        <span className="text-xs">0:04</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 2: Bank Sync */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col md:flex-row-reverse items-center gap-16"
                    >
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                                <Building2 size={28} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Sincronização Bancária</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Conecte suas contas do Itaú, Nubank, Inter e outros. Seus saldos e transações são importados em tempo real via Open Finance seguro.
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Check className="w-5 h-5 text-blue-500" /> Conexão criptografada e segura
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Check className="w-5 h-5 text-blue-500" /> Atualização em tempo real
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full max-w-md h-72 relative flex items-center justify-center">
                            {/* Central App Node */}
                            <div className="absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full" />

                            <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-2xl z-20 flex flex-col items-center justify-center text-white relative border-4 border-black/50">
                                <Wallet size={40} className="mb-1" />
                                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">FinancePro</span>
                                {/* Pulse Effect */}
                                <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/50 animate-ping opacity-20"></div>
                            </div>

                            {/* Orbiting Bank Nodes */}
                            {[1, 2, 3, 4, 5].map((i) => {
                                const angle = (i * 72) * (Math.PI / 180);
                                const radius = 140;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ x: 0, y: 0, opacity: 0 }}
                                        animate={{
                                            x: x,
                                            y: y,
                                            opacity: 1,
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            delay: i * 0.1,
                                            type: "spring"
                                        }}
                                        className="absolute w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center shadow-lg z-10"
                                    >
                                        <Building2 size={18} className="text-gray-400" />
                                    </motion.div>
                                )
                            })}

                            {/* Dynamic Connection Lines (SVG) */}
                            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-40 overflow-visible">
                                <defs>
                                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                                        <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {[1, 2, 3, 4, 5].map((i) => {
                                    const angle = (i * 72) * (Math.PI / 180);
                                    const x = 50 + (Math.cos(angle) * 35); // Approx percent coordinates
                                    const y = 50 + (Math.sin(angle) * 35);
                                    return (
                                        <motion.line
                                            key={i}
                                            x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`}
                                            stroke="url(#lineGradient)"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 1.5, delay: 0.5 + (i * 0.2) }}
                                        />
                                    )
                                })}
                            </svg>
                        </div>
                    </motion.div>

                    {/* Feature 3: AI Insights */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col md:flex-row items-center gap-16"
                    >
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
                                <BrainCircuit size={28} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Inteligência Artificial Pessoal</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Receba relatórios semanais que analisam seus hábitos, identificam onde você pode economizar e te parabenizam pelas suas conquistas.
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Check className="w-5 h-5 text-blue-500" /> Dicas personalizadas de economia
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Check className="w-5 h-5 text-blue-500" /> Detecção de padrões de gastos
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full max-w-md">
                            <div className="bg-gradient-to-br from-[#0c1424] to-[#0a0a0a] p-6 rounded-2xl border border-blue-500/30 relative shadow-2xl">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                        <Zap size={20} className="text-white fill-current" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-white font-semibold flex items-center gap-2">
                                            Insight Semanal
                                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">NOVO</span>
                                        </h4>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            "Notei que você gastou <b>R$ 200,00</b> a menos com Uber este mês comparado à média. Ótimo trabalho mantendo o foco! 🚗💨"
                                        </p>
                                        <div className="pt-2 flex gap-2">
                                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full w-[80%] bg-blue-500 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* PRICING GRID */}
            <section id="pricing-table" className="py-20 px-4 md:px-6 relative">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl font-bold text-white">Escolha o seu plano</h2>
                    <p className="text-gray-400">Sem contratos longos. Cancele quando quiser.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl mx-auto items-center">

                    {/* 1. STARTER */}
                    <div className="relative p-8 rounded-[2rem] bg-zinc-950 border border-zinc-800 flex flex-col hover:border-zinc-700 transition-all duration-300 group">
                        <div className="mb-8">
                            <h3 className="text-gray-400 font-medium tracking-wide uppercase text-sm mb-4">Starter</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">R$ 0,00</span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-4">Para quem está começando a se organizar.</p>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-zinc-500" /> Dashboard Completo
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-zinc-500" /> 50 Lançamentos mensais
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-zinc-500" /> Categorização manual
                            </li>
                            <li className="flex items-center gap-3 text-zinc-600 text-sm line-through decoration-zinc-700">
                                Integração WhatsApp
                            </li>
                            <li className="flex items-center gap-3 text-zinc-600 text-sm line-through decoration-zinc-700">
                                Sincronização Bancária
                            </li>
                        </ul>

                        <Button
                            variant="outline"
                            className="w-full bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white rounded-xl h-12 transition-all"
                            onClick={() => handleSubscribe('FREE')}
                        >
                            {currentPlan === 'FREE' ? 'Seu Plano Atual' : 'Começar Grátis'}
                        </Button>
                    </div>

                    {/* 2. PRO */}
                    <div className="relative p-8 rounded-[2rem] bg-[#0F172A]/50 border border-blue-900/50 flex flex-col transition-transform duration-300 hover:scale-[1.02]">
                        <div className="mb-8 mt-2">
                            <h3 className="text-blue-400 font-medium tracking-wide uppercase text-sm mb-4">PRO</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-white">R$ 19,90</span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                            <p className="text-blue-200/60 text-sm mt-4">Automação essencial para o dia a dia.</p>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-white text-sm">
                                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><Check className="w-3 h-3" /></div>
                                Tudo do Starter
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm">
                                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><MessageCircle className="w-3 h-3" /></div>
                                Bot de WhatsApp Ilimitado
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm">
                                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><BrainCircuit className="w-3 h-3" /></div>
                                Insights Semanais IA
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm">
                                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><Check className="w-3 h-3" /></div>
                                Lançamentos Ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-zinc-600 text-sm line-through decoration-zinc-700">
                                Sincronização Bancária
                            </li>
                        </ul>

                        <Button
                            disabled={!!loading}
                            className="w-full bg-blue-900/50 hover:bg-blue-800 text-white rounded-xl h-12 font-semibold transition-all"
                            onClick={() => handleSubscribe('PRO')}
                        >
                            {loading === 'PRO' ? <span className="animate-pulse">Processando...</span> : (currentPlan === 'PRO' ? 'Seu Plano Atual' : 'Assinar PRO')}
                        </Button>
                    </div>

                    {/* 3. ULTIMATE (HIGHLIGHTED) */}
                    <div className="relative p-8 rounded-[2rem] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-[#0a0f29] to-black border border-blue-500 flex flex-col shadow-[0_0_60px_-15px_rgba(37,99,235,0.3)] min-h-[580px] z-10 transform scale-105">

                        <div className="absolute -top-5 left-0 right-0 flex justify-center">
                            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xl">
                                <Star className="w-3 h-3 fill-current" /> O Mais Completo
                            </span>
                        </div>

                        <div className="mb-8 mt-2">
                            <h3 className="text-cyan-400 font-medium tracking-wide uppercase text-sm mb-4 flex items-center gap-2">
                                Ultimate <Zap size={14} className="fill-current" />
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-bold text-white tracking-tight">R$ 39,90</span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                            <p className="text-cyan-200/60 text-sm mt-4 line-clamp-2">Experiência completa com Open Finance e IA Avançada.</p>
                        </div>

                        <ul className="flex-1 space-y-5 mb-10">
                            <li className="flex items-center gap-3 text-white text-sm font-medium">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"><Check className="w-3.5 h-3.5" /></div>
                                Tudo do PRO
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm font-medium">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"><Building2 className="w-3.5 h-3.5" /></div>
                                Sincronização Bancária
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm font-medium">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"><BrainCircuit className="w-3.5 h-3.5" /></div>
                                Consultor IA Avançado
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm font-medium">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"><Star className="w-3.5 h-3.5" /></div>
                                Suporte Prioritário
                            </li>
                        </ul>

                        <Button
                            disabled={!!loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl h-14 font-bold text-lg shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"
                            onClick={() => handleSubscribe('MAX')}
                        >
                            {loading === 'MAX' ? 'Processando...' : (currentPlan === 'MAX' ? 'Seu Plano Atual' : 'Assinar Ultimate')}
                        </Button>
                    </div>

                </div>
            </section>

            {/* FAQ (Optional but good) */}
            <section className="py-20 px-6 max-w-3xl mx-auto border-t border-zinc-900">
                <h2 className="text-2xl font-bold text-center mb-10 text-white">Perguntas Frequentes</h2>
                <div className="space-y-4">
                    <details className="group bg-zinc-900/50 rounded-xl p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex items-center justify-between font-medium text-gray-200 group-hover:text-white transition-colors">
                            Como funciona o cancelamento?
                            <ChevronDown className="transition-transform group-open:rotate-180" size={18} />
                        </summary>
                        <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                            Você pode cancelar a qualquer momento diretamente pelo seu painel. A assinatura continuará ativa até o fim do período já pago (mês vigente) e não será renovada.
                        </p>
                    </details>
                    <details className="group bg-zinc-900/50 rounded-xl p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex items-center justify-between font-medium text-gray-200 group-hover:text-white transition-colors">
                            O Open Finance é seguro?
                            <ChevronDown className="transition-transform group-open:rotate-180" size={18} />
                        </summary>
                        <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                            Sim. Utilizamos parceiros regulados pelo Banco Central (como a Pluggy) para conectar suas contas. Nós temos acesso apenas de leitura (read-only) e nunca podemos movimentar seu dinheiro.
                        </p>
                    </details>
                    <details className="group bg-zinc-900/50 rounded-xl p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex items-center justify-between font-medium text-gray-200 group-hover:text-white transition-colors">
                            Posso trocar de plano depois?
                            <ChevronDown className="transition-transform group-open:rotate-180" size={18} />
                        </summary>
                        <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                            Sim! Se você fizer upgrade, a mudança é imediata e cobrada proporcionalmente. Se fizer downgrade, a mudança ocorre no próximo ciclo de pagamento.
                        </p>
                    </details>
                </div>
            </section>

        </div>
    );
}
