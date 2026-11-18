import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type Kind = 'ok' | 'bad';
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<{ id: number; msg: string; kind: Kind }[]>([]);
    const push = useCallback((msg: string, kind: Kind = 'ok') => {
        const id = Date.now() + Math.random();
        setItems((x) => [...x, { id, msg, kind }]);
        setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
    }, []);
    return (
        <Ctx.Provider value={push}>
            {children}
            <div className="toasts" role="status" aria-live="polite">
                {items.map((i) => <div key={i.id} className={`toast ${i.kind}`}>{i.msg}</div>)}
            </div>
        </Ctx.Provider>
    );
}
