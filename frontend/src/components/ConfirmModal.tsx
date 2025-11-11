//frontend/src/components/ConfirmModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ConfirmModal.module.scss";

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal = ({
                          open,
                          title = "Confirmation",
                          message,
                          confirmText = "Confirmer",
                          cancelText = "Annuler",
                          onConfirm,
                          onCancel,
                      }: ConfirmModalProps) => {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* 🔹 Overlay sombre */}
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                    />

                    {/* 🔹 Fenêtre principale */}
                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        {title && <h3>{title}</h3>}
                        <p>{message}</p>

                        <div className={styles.actions}>
                            <button className={styles.cancel} onClick={onCancel}>
                                {cancelText}
                            </button>
                            <button className={styles.confirm} onClick={onConfirm}>
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
