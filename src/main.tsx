import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import { api, getToken, setToken } from './api';
import { ToastProvider } from './components/Toast';
import Analytics from './pages/Analytics';
import CaseStudy from './pages/CaseStudy';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Campaigns, Customers, Products, Sales, Suppliers } from './pages/Resources';

const PAGES: [string, string, () => JSX.Element][] = [
    ['dashboard', 'Dashboard', Dashboard],
    ['analytics', 'Analytics', Analytics],
    ['sales', 'Sales', Sales],
    ['products', 'Products', Products],
    ['customers', 'Customers', Customers],
    ['campaigns', 'Campaigns', Campaigns],
    ['suppliers', 'Suppliers', Suppliers],
    ['case', 'Case study', CaseStudy],
];
const fromHash = () => {
    const h = window.location.hash.replace('#/', '');
    return PAGES.some((p) => p[0] === h) ? h : 'dashboard';
};

function App() {
    const [authed, setAuthed] = useState(!!getToken());
    const [page, setPage] = useState(fromHash());
    const [menu, setMenu] = useState(false);

    useEffect(() => {
        const on = () => setPage(fromHash());
        window.addEventListener('hashchange', on);
        return () => window.removeEventListener('hashchange', on);
    }, []);

    if (!authed) return <Login onDone={() => setAuthed(true)} />;

    const Current = PAGES.find((p) => p[0] === page)![2];
    const go = (k: string) => { window.location.hash = `/${k}`; setMenu(false); };
    const logout = async () => {
        try { await api('logout', 'POST'); } catch { /* ignore */ }
        setToken(null);
        setAuthed(false);
    };

    return (
        <div className="shell">
            <header className="topbar no-print">
                <b>Laze<span style={{ color: 'var(--lime)' }}>.</span></b>
                <button className="btn sm" onClick={() => setMenu(!menu)} aria-expanded={menu}>{menu ? 'Close' : 'Menu'}</button>
            </header>
            <nav className={`side no-print ${menu ? 'open' : ''}`}>
                <div className="brand">Laze<span>.</span></div>
                {PAGES.map(([key, label]) => (
                    <button key={key} className={`nav ${page === key ? 'on' : ''}`} onClick={() => go(key)} aria-current={page === key ? 'page' : undefined}>{label}</button>
                ))}
                <div className="spacer" />
                <button className="nav" onClick={logout}>Sign out</button>
            </nav>
            <main className="main"><Current /></main>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<ToastProvider><App /></ToastProvider>);
