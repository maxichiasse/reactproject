//frontend/src/components/Toast.tsx
import React, { useEffect } from "react";
import "@styles/toast.css";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose: () => void;
}

const ToastComponent: React.FC<ToastProps> = ({ message, type = "info", onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <span>{message}</span>
        </div>
    );
};

export default ToastComponent;
