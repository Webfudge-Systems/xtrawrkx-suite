"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function Home() {
    const router = useRouter();

    const handleAccessDashboard = () => {
        router.push("/auth");
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4 text-neutral-900">Welcome to Client Portal</h1>
                <p className="text-gray-600 mb-6">Access your account and manage your projects</p>
                <Button onClick={handleAccessDashboard}>
                    Access Dashboard
                </Button>
            </div>
        </main>
    );
}
