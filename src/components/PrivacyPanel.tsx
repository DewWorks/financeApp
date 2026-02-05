"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Download, Trash2, Shield } from "lucide-react";

export default function PrivacyPanel() {
    const [loadingExport, setLoadingExport] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const router = useRouter();

    const handleExport = async () => {
        setLoadingExport(true);
        try {
            const res = await fetch('/api/user/me/export');
            if (!res.ok) throw new Error('Falha ao exportar');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meus_dados_financeapp_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            alert('Download iniciado! Verifique seus arquivos.');
        } catch (error) {
            alert('Erro ao exportar dados.');
        } finally {
            setLoadingExport(false);
        }
    };

    const handleDelete = async () => {
        const confirm1 = confirm("TEM CERTEZA? Essa ação é irreversível e apagará todos os seus dados.");
        if (!confirm1) return;

        const confirm2 = confirm("Último aviso: Todos os lançamentos financeiros serão perdidos. Confirmar exclusão?");
        if (!confirm2) return;

        setLoadingDelete(true);
        try {
            const res = await fetch('/api/user/me/delete', { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao excluir');

            alert('Sua conta foi excluída. Sentiremos sua falta.');
            router.push('/auth/login');
        } catch (error) {
            alert('Erro ao excluir conta. Tente novamente.');
        } finally {
            setLoadingDelete(false);
        }
    };

    return (
        <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <Shield className="w-6 h-6 text-purple-600" />
                    Minha Privacidade (LGPD)
                </CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Você tem total controle sobre seus dados. Abaixo você pode exercer seus direitos de portabilidade e esquecimento.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Export Section */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="mb-4 md:mb-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Download className="w-4 h-4 text-blue-500" />
                            Exportar Dados
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Baixe uma cópia completa de suas transações e dados pessoais (JSON).
                        </p>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={loadingExport}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loadingExport ? 'Gerando...' : 'Baixar Dados'}
                    </Button>
                </div>

                {/* Delete Section */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-red-50 dark:bg-red-950/10 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="mb-4 md:mb-0">
                        <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Excluir Conta
                        </h3>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80">
                            Apagar permanentemente todos os registros. Esta ação não pode ser desfeita.
                        </p>
                    </div>
                    <Button
                        onClick={handleDelete}
                        disabled={loadingDelete}
                        variant="destructive"
                        className="w-full md:w-auto"
                    >
                        {loadingDelete ? 'Excluindo...' : 'Excluir Conta'}
                    </Button>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-xs text-zinc-400 font-medium">
                        Seus dados são protegidos por criptografia de ponta a ponta (AES-256).
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
