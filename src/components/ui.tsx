import { ReactNode } from 'react';

export const Loading = ({ text = 'Loading…' }: { text?: string }) => (
    <div className="card state"><div className="spin" /> {text}</div>
);

export const ErrorBox = ({ message, retry }: { message: string; retry?: () => void }) => (
    <div className="card state err">
        <span>Could not load data: {message}</span>
        {retry && <button className="btn sm" onClick={retry}>Try again</button>}
    </div>
);

export function Confirm({ text, onYes, onNo }: { text: string; onYes: () => void; onNo: () => void }) {
    return (
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onNo()}>
            <div className="box" style={{ width: 'min(400px,100%)' }}>
                <h2 style={{ marginBottom: 8 }}>Are you sure?</h2>
                <p style={{ color: 'var(--muted)' }}>{text}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn ghost" onClick={onNo}>Keep it</button>
                    <button className="btn danger" onClick={onYes}>Delete</button>
                </div>
            </div>
        </div>
    );
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
