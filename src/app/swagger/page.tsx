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
    const [isAuthorized, setIsAuthorized] = useState(true); // Default to true if you removed the check

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Don't render anything until mounted to prevent hydration mismatch
    if (!isMounted) {
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
