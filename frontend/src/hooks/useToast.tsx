//frontend/src/hooks/useToast.ts
import { useState } from "react";
import ToastComponent from "@components/Toast";

/**
 * Hook pour afficher des notifications Toast.
 */
export const useToast = () => {
    const [toastData, setToastData] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        setToastData({ message, type });
    };

    const hideToast = () => setToastData(null);

    const ToastContainer = () =>
        toastData ? <ToastComponent message={toastData.message} type={toastData.type} onClose={hideToast} /> : null;

    return { showToast, ToastContainer };
};
