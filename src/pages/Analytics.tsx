import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { api, peso } from '../api';
import { Analytics as A } from '../types';
import { Chart, COLORS } from './Dashboard';
import { ErrorBox, Loading } from '../components/ui';

export default function Analytics() {
    const [a, setA] = useState<A | null>(null);
    const [budget, setBudget] = useState(50000);
    const [input, setInput] = useState('50000');

    const [err, setErr] = useState('');
    useEffect(() => {
        setErr('');
        api<A>(`analytics?budget=${budget}`).then(setA).catch((e) => setErr(e.message));
    }, [budget]);
    if (err) return <ErrorBox message={err} />;
    if (!a) return <Loading text="Running analytics…" />;

    const { descriptive: d, predictive: p, prescriptive: r } = a;
    const full = d.monthly.filter((m) => !m.partial);
    const last = full[full.length - 1];
    const series = [
        ...full.map((m, i) => ({ month: m.month, actual: m.revenue, forecast: i === full.length - 1 ? m.revenue : undefined as number | undefined })),
        ...p.forecast.map((f) => ({ month: f.month, actual: undefined as number | undefined, forecast: f.predicted_revenue })),
    ];
    const bestCat = d.by_category[0];
    const bestRoas = d.channel_roas[0];

    return (
        <>
            <div className="head">
                <div>
                    <h1>Business analytics</h1>
                    <p>Descriptive, predictive and prescriptive analysis, each step feeding the next.</p>
                </div>
                <button className="btn ghost no-print" onClick={() => window.print()}>Print report</button>
            </div>

            <div className="flow">
                <span className="n">1 Descriptive</span> history and ROAS feed →
                <span className="n">2 Predictive</span> forecast and growth factor feed →
                <span className="n">3 Prescriptive</span> restock and budget decisions
            </div>

            {/* STEP 1 */}
            <div className="card step d" style={{ marginBottom: 16 }}>
                <h2>Step 1. Descriptive: what happened?</h2>
                <p>
                    Over the last 12 months Laze recorded <b>{peso(d.kpis.revenue)}</b> in sales from <b>{d.kpis.orders}</b> orders
                    at a {d.kpis.margin_pct}% gross margin. {bestCat && <><b>{bestCat.name}</b> is the largest category ({peso(bestCat.revenue)}).</>}
                </p>
                <div className="grid g2">
                    <Chart title="Revenue per month" height={220}>
                        <BarChart data={d.monthly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip formatter={(v: number) => peso(v)} />
                            <Bar dataKey="revenue" fill={COLORS[1]} />
                        </BarChart>
                    </Chart>
                    <div className="card">
                        <h3>Marketing channels (return on ad spend)</h3>
                        <div className="tablewrap">
                            <table>
                                <thead><tr><th>Channel</th><th>Campaigns</th><th>Spend</th><th>Revenue</th><th>ROAS</th></tr></thead>
                                <tbody>
                                    {d.channel_roas.map((c) => (
                                        <tr key={c.channel}><td>{c.channel}</td><td>{c.campaigns}</td><td>{peso(c.spend)}</td><td>{peso(c.revenue)}</td><td><b>{c.roas}</b></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {bestRoas && <div className="insight">Best channel so far: <b>{bestRoas.channel}</b>. This ROAS table is the input for Step 3.</div>}
                    </div>
                </div>
            </div>

            {/* STEP 2 */}
            <div className="card step p" style={{ marginBottom: 16 }}>
                <h2>Step 2. Predictive: what will happen?</h2>
                <p>
                    {p.model}, trained on the last {full.length} full months. Revenue is trending <b>{p.trend}</b> by about{' '}
                    <b>{peso(Math.abs(p.slope_per_month))}</b> per month (R² = {p.r_squared}). Ad spend and revenue have a correlation of{' '}
                    <b>{p.spend_revenue_correlation}</b>.
                </p>
                <div className="grid g2">
                    <Chart title="Actual vs. forecast revenue" height={240}>
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip formatter={(v: number) => peso(v)} />
                            <Legend />
                            <Line dataKey="actual" name="Actual" stroke={COLORS[0]} strokeWidth={3} connectNulls />
                            <Line dataKey="forecast" name="Forecast" stroke={COLORS[2]} strokeWidth={3} strokeDasharray="6 4" connectNulls />
                        </LineChart>
                    </Chart>
                    <div className="card">
                        <h3>Next 3 months</h3>
                        <table>
                            <thead><tr><th>Month</th><th>Predicted revenue</th></tr></thead>
                            <tbody>{p.forecast.map((f) => <tr key={f.month}><td>{f.month}</td><td><b>{peso(f.predicted_revenue)}</b></td></tr>)}</tbody>
                        </table>
                        <div className="insight">
                            Growth factor {p.growth_factor}× vs. the last 3 months ({peso(last?.revenue ?? 0)} last full month).
                            Step 3 uses this factor to scale each product's expected demand.
                        </div>
                    </div>
                </div>
            </div>

            {/* STEP 3 */}
            <div className="card step r">
                <h2>Step 3. Prescriptive: what should we do?</h2>
                <div className="insight" style={{ marginTop: 0, marginBottom: 14 }}>
                    <b>Recommended actions</b>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>{r.actions.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>

                <div className="grid g2">
                    <div className="card">
                        <h3>Try it: allocate a marketing budget</h3>
                        <form
                            className="tools"
                            onSubmit={(e) => { e.preventDefault(); setBudget(Math.max(0, Number(input) || 0)); }}
                        >
                            <input type="number" min={0} step={1000} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Monthly marketing budget in pesos" />
                            <button className="btn">Optimize</button>
                        </form>
                        <div className="tablewrap">
                            <table>
                                <thead><tr><th>Channel</th><th>Share</th><th>Budget</th><th>Expected revenue</th></tr></thead>
                                <tbody>
                                    {r.allocation.map((x) => (
                                        <tr key={x.channel}><td>{x.channel}</td><td>{x.share_pct}%</td><td>{peso(x.budget)}</td><td>{peso(x.expected_revenue)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="insight">
                            Optimized mix: <b>{peso(r.optimized_expected_revenue)}</b> vs. current mix {peso(r.current_mix_expected_revenue)}
                            {' '}(<b>{r.uplift >= 0 ? '+' : ''}{peso(r.uplift)}</b>).
                        </div>
                    </div>
                    <Chart title={`Budget split for ${peso(r.budget)}`} height={280}>
                        <BarChart data={r.allocation}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="channel" fontSize={11} />
                            <YAxis fontSize={11} />
                            <Tooltip formatter={(v: number) => peso(v)} />
                            <Legend />
                            <Bar dataKey="budget" name="Budget" fill={COLORS[0]} />
                            <Bar dataKey="expected_revenue" name="Expected revenue" fill={COLORS[1]} />
                        </BarChart>
                    </Chart>
                </div>

                <div className="card" style={{ marginTop: 16 }}>
                    <h3>Restock plan (based on forecast demand and supplier lead time)</h3>
                    <div className="tablewrap">
                        <table>
                            <thead>
                                <tr><th>Product</th><th>Stock</th><th>Reorder level</th><th>Forecast units/mo</th><th>Lead time</th><th>Order qty</th><th>Cost</th><th>Priority</th></tr>
                            </thead>
                            <tbody>
                                {r.restock.map((x) => (
                                    <tr key={x.id}>
                                        <td>{x.name}</td><td>{x.stock}</td><td>{x.reorder_level}</td><td>{x.forecast_monthly_units}</td>
                                        <td>{x.lead_time_days}d</td><td><b>{x.order_qty}</b></td><td>{peso(x.order_cost)}</td>
                                        <td><span className={`badge ${x.priority}`}>{x.priority}</span></td>
                                    </tr>
                                ))}
                                {!r.restock.length && <tr><td colSpan={8}>No restocking needed.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
