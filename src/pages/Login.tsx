import { FormEvent, useState } from 'react';
import { api, setToken } from '../api';

export default function Login({ onDone }: { onDone: () => void }) {
    const [email, setEmail] = useState('admin@laze.test');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const r = await api<{ token: string }>('login', 'POST', { email, password });
            setToken(r.token);
            onDone();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    return (
        <div className="login">
            <form className="card" onSubmit={submit}>
                <h1>Laze<span>.</span></h1>
                <p style={{ color: 'var(--muted)', marginTop: 0 }}>Vapeshop business analytics. Sign in to continue.</p>
                {error && <div className="err">{error}</div>}
                <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                <button className="btn" style={{ width: '100%' }}>Sign in</button>
            </form>
        </div>
    );
}
