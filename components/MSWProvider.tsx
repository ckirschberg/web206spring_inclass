"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (process.env.NODE_ENV === "development") {
                import("../mocks/browser").then(({ worker }) => {
                    worker.start({ onUnhandledRequest: "bypass" }).then(() => setReady(true));
                });
            } else {
                // MSW is disabled in production (e.g. Vercel).
                // Requests go to the real backend via NEXT_PUBLIC_BASE_URL.
                setReady(true);
            }
        }
    }, []);

    if (!ready) return null;

    return <>{children}</>;
}
 