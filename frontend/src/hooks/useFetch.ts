//frontend/src/hooks/useFetch.ts
import { useEffect, useState } from "react";

export const useFetch = <T,>(
    fetchFn: () => Promise<{ data: T }>,
    deps: any[] = []
) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchFn()
            .then((res) => {
                if (mounted) setData(res.data);
            })
            .catch((err) => {
                if (mounted) setError(err.message);
            })
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
        };
    }, deps);

    return { data, loading, error };
};
