import { useEffect, useState } from 'react';
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api, peso } from '../api';
import { Analytics, Row } from '../types';
import { ErrorBox, Loading } from '../components/ui';

export const COLORS = ['#5b2bd6', '#12a594', '#ff5a5f', '#e6b800', '#2f80ed', '#8a8aa3'];

export function Chart({ title, children, height = 260 }: { title: string; children: React.ReactElement; height?: number }) {
    return (
        <div className="card">
            <h3>{title}</h3>
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [a, setA] = useState<Analytics | null>(null);
    const [low, setLow] = useState<Row[]>([]);
    const [recent, setRecent] = useState<Row[]>([]);
    const [range, setRange] = useState(12);
    const [err, setErr] = useState('');
    const load = () => {
        setErr('');
        api<Analytics>('analytics').then(setA).catch((e) => setErr(e.message));
        api<Row[]>('products').then((p) => setLow(p.filter((x) => x.stock <= x.reorder_level).sort((x, y) => x.stock - y.stock).slice(0, 6)));
        api<Row[]>('sales').then((s) => setRecent(s.sort((x, y) => String(y.sold_at).localeCompare(String(x.sold_at))).slice(0, 6)));
    };
    useEffect(load, []);
    if (err) return <ErrorBox message={err} retry={load} />;
    if (!a) return <Loading text="Loading dashboard…" />;

    const d = a.descriptive;
    const k = d.kpis;
    const money = (v: number) => peso(v);

    return (
        <>
            <div className="head">
                <div>
                    <h1>Dashboard</h1>
                    <p>Live picture of Laze Vapeshop sales, customers and marketing.</p>
                </div>
                <div className="tools" style={{ margin: 0 }}>
                    <select style={{ width: 'auto' }} value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Chart range">
                        <option value={12}>Last 12 months</option>
                        <option value={6}>Last 6 months</option>
                        <option value={3}>Last 3 months</option>
                    </select>
                    <button className="btn ghost" onClick={load}>Refresh</button>
                </div>
            </div>

            <div className="grid g4" style={{ marginBottom: 16 }}>
                <div className="card kpi hot"><div className="v">{peso(k.revenue)}</div><div className="l">Total revenue</div></div>
                <div className="card kpi"><div className="v">{peso(k.profit)}</div><div className="l">Gross profit ({k.margin_pct}% margin)</div></div>
                <div className="card kpi"><div className="v">{k.orders}</div><div className="l">Orders · avg {peso(k.avg_order_value)}</div></div>
                <div className="card kpi"><div className="v">{peso(k.ad_spend)}</div><div className="l">Marketing spend</div></div>
                <div className="card kpi"><div className="v">{k.customers}</div><div className="l">Customers</div></div>
                <div className="card kpi"><div className="v">{k.low_stock}</div><div className="l">Products at or below reorder level</div></div>
            </div>

            <div className="grid g2">
                <Chart title="Monthly revenue vs. marketing spend">
                    <LineChart data={d.monthly.slice(-range)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={money} />
                        <Legend />
                        <Line dataKey="revenue" name="Revenue" stroke={COLORS[0]} strokeWidth={3} />
                        <Line dataKey="spend" name="Ad spend" stroke={COLORS[2]} strokeWidth={2} />
                    </LineChart>
                </Chart>
                <Chart title="Revenue by category">
                    <PieChart>
                        <Pie data={d.by_category} dataKey="revenue" nameKey="name" outerRadius={95} label={(e) => e.name}>
                            {d.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={money} />
                    </PieChart>
                </Chart>
                <Chart title="Top 8 products by revenue">
                    <BarChart data={d.top_products} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={11} />
                        <YAxis type="category" dataKey="name" width={150} fontSize={11} />
                        <Tooltip formatter={money} />
                        <Bar dataKey="revenue" fill={COLORS[0]} />
                    </BarChart>
                </Chart>
                <Chart title="Return on ad spend by channel (₱ revenue per ₱1)">
                    <BarChart data={d.channel_roas}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="channel" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="roas" name="ROAS" fill={COLORS[1]} />
                    </BarChart>
                </Chart>
                <Chart title="Revenue by city">
                    <BarChart data={d.by_city}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={money} />
                        <Bar dataKey="revenue" fill={COLORS[3]} />
                    </BarChart>
                </Chart>
                <Chart title="Store vs. online sales">
                    <PieChart>
                        <Pie data={d.by_sales_channel} dataKey="revenue" nameKey="name" innerRadius={55} outerRadius={95} label={(e) => e.name}>
                            {d.by_sales_channel.map((_, i) => <Cell key={i} fill={COLORS[i + 1]} />)}
                        </Pie>
                        <Tooltip formatter={money} />
                    </PieChart>
                </Chart>
                <Chart title="Revenue by customer age group">
                    <BarChart data={d.by_age}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={money} />
                        <Bar dataKey="revenue" fill={COLORS[4]} />
                    </BarChart>
                </Chart>
            </div>

            <div className="grid g2" style={{ marginTop: 16 }}>
                <div className="card">
                    <h3>Low stock alerts</h3>
                    {low.length ? (
                        <table>
                            <thead><tr><th>Product</th><th>Stock</th><th>Reorder at</th></tr></thead>
                            <tbody>{low.map((p) => <tr key={p.id}><td>{p.name}</td><td><span className="badge High">{p.stock}</span></td><td>{p.reorder_level}</td></tr>)}</tbody>
                        </table>
                    ) : <p className="empty">All products are above their reorder level.</p>}
                </div>
                <div className="card">
                    <h3>Recent sales</h3>
                    <table>
                        <thead><tr><th>Date</th><th>Customer</th><th>Product</th><th>Total</th></tr></thead>
                        <tbody>{recent.map((s) => <tr key={s.id}><td>{s.sold_at}</td><td>{s.customer?.name}</td><td>{s.product?.name}</td><td>{peso(s.total)}</td></tr>)}</tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
