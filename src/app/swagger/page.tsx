"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/ui/atoms/DashboardSkeleton";

// Dynamically import SwaggerUI to avoid server-side rendering issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        setIsMounted(true);

        async function checkAdmin() {
            try {
                const response = await fetch("/api/users");
                if (!response.ok) {
                    throw new Error("Failed to fetch user");
                }
                const user = await response.json();

                if (user.admin === true) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                    router.push("/dashboard");
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAuthorized(false);
                router.push("/dashboard");
            }
        }

        checkAdmin();
    }, [router]);

    // Don't render anything until mounted to prevent hydration mismatch
    if (!isMounted || isAuthorized === null) {
        return <DashboardSkeleton />;
    }

    if (!isAuthorized) {
        return <DashboardSkeleton />; // Or null while redirecting
    }

    return (
        <div className="bg-white min-h-screen text-black">
            <div className="max-w-7xl mx-auto p-4">
                <SwaggerUI url="/api/doc" />
            </div>
        </div>
    );
}
