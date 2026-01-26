
"use client";
import React, { useEffect, useState } from 'react';
import { Title } from "@/components/ui/molecules/Title";
import { Button } from "@/components/ui/atoms/button";
import { ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function TermsPage() {
    const router = useRouter();
    const [content, setContent] = useState<string>("");
    const [meta, setMeta] = useState({ version: "", date: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchTerms() {
            try {
                const res = await fetch('/api/legal/terms');
                if (res.ok) {
                    const data = await res.json();
                    setContent(data.content);
                    setMeta({
                        version: data.version,
                        date: new Date(data.updatedAt).toLocaleDateString('pt-BR')
                    });
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchTerms();
    }, []);

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
                    <header className="mb-0 border-b pb-4 dark:border-gray-700">
                        <Title />
                        <h1 className="text-3xl font-bold mt-4 text-gray-900 dark:text-gray-100">Termos de Uso</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Documento Oficial da DevWorks</p>

                        {!loading && !error && (
                            <div className="mt-4 flex gap-4 text-sm">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
                                    Versão: <strong>{meta.version}</strong>
                                </span>
                                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full dark:bg-gray-700 dark:text-gray-200">
                                    Atualizado: <strong>{meta.date}</strong>
                                </span>
                            </div>
                        )}
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>Carregando termos atualizados...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">
                            <p>Erro ao carregar os termos. Por favor, tente novamente.</p>
                        </div>
                    ) : (
                        <article className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </article>
                    )}

                    <div className="mt-8 pt-8 border-t dark:border-gray-700 text-center text-sm text-gray-500">
                        <p>DevWorks (CNPJ 54.399.111/0001-41) - Palmas/TO</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
