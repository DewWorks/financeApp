"use client";

import PrivacyPanel from "@/components/PrivacyPanel";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { ArrowLeft, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle";

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background py-8">
            <div className="max-w-2xl mx-auto px-4 relative">
                {/* Theme Toggle Absolute - Matches Profile */}
                <div className="absolute top-0 right-4 md:right-0 -mt-2">
                    <ThemeToggle />
                </div>

                {/* Header Card - Matches Profile */}
                <Card className="mb-6 mt-8 md:mt-0">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="w-8 h-8 text-purple-500" />
                                <div>
                                    <CardTitle className="text-2xl font-bold">Privacidade e Dados</CardTitle>
                                    <p className="text-muted-foreground">Gerencie seus direitos LGPD</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.back()}
                                variant="outline"
                                className="flex items-center gap-2 bg-transparent hover:bg-accent"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Content */}
                <PrivacyPanel />
            </div>
        </div>
    );
}
