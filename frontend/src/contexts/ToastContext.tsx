//frontend/src/contexts/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import ToastComponent from "@components/Toast";

type ToastType = "success" | "error" | "info";

interface ToastContextProps {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps>({
    showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toastData, setToastData] = useState<{ message: string; type?: ToastType } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        setToastData({ message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToastData(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toastData && (
                <ToastComponent
                    message={toastData.message}
                    type={toastData.type}
                    onClose={hideToast}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
