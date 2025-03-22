'use client';

import { error } from "console";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Conditionally log the error reporting service
        console.error(error);
    }, [error]);

    return (
        <main className="flex h-full flex-col items-center justify-center">
            <h2 className="text-center">Something went wrong!</h2>
            <button className="mt-4 rounded-md bg-blue-500 px-3 p-2 text-sm text-white transition-colors hover:bg-blue-400"
            onClick={
                // Attempt to recover by trying to re-render the invoices route
                () => reset()
            }
            >
                Try again
            </button>
        </main>
    )

}