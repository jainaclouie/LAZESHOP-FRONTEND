import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Confirm, Loading, ErrorBox, downloadCsv } from '../components/ui';
import { useToast } from '../components/Toast';
import { Row } from '../types';

export interface Field {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'email' | 'select';
    options?: string[];
    lookup?: string;
    optional?: boolean;
    step?: string;
    full?: boolean;
}
export interface Column {
    label: string;
    value: (r: Row) => string | number;
    render?: (r: Row) => ReactNode;
}
interface Props {
    resource: string;
    title: string;
    singular: string;
    subtitle: string;
    columns: Column[];
    fields: Field[];
    defaults?: Row;
    filter?: { label: string; value: (r: Row) => string; options: string[] };
    extra?: (editing: Row, lookups: Record<string, Row[]>) => ReactNode;
}

const PAGE = 12;

export default function Crud({ resource, title, singular, subtitle, columns, fields, defaults = {}, filter, extra }: Props) {
    const toast = useToast();
    const [rows, setRows] = useState<Row[] | null>(null);
    const [loadError, setLoadError] = useState('');
    const [lookups, setLookups] = useState<Record<string, Row[]>>({});
    const [q, setQ] = useState('');
    const [fv, setFv] = useState('');
    const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
    const [page, setPage] = useState(0);
    const [editing, setEditing] = useState<Row | null>(null);
    const [deleting, setDeleting] = useState<Row | null>(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoadError('');
        api<Row[]>(resource).then(setRows).catch((e) => setLoadError(e.message));
    };

    useEffect(() => {
        setRows(null); setPage(0); setQ(''); setFv(''); setSort(null);
        load();
        fields.filter((f) => f.lookup).forEach((f) =>
            api<Row[]>(f.lookup!).then((d) => setLookups((l) => ({ ...l, [f.lookup!]: d }))),
        );
    }, [resource]);

    const view = useMemo(() => {
        const s = q.toLowerCase();
        let out = (rows ?? []).filter(
            (r) => (!s || columns.some((c) => String(c.value(r)).toLowerCase().includes(s))) && (!fv || filter?.value(r) === fv),
        );
        if (sort) {
            const c = columns[sort.col];
            out = [...out].sort((a, b) => {
                const x = c.value(a), y = c.value(b);
                const nx = parseFloat(String(x).replace(/[₱,]/g, '')), ny = parseFloat(String(y).replace(/[₱,]/g, ''));
                const cmp = !isNaN(nx) && !isNaN(ny) && /^[₱\d]/.test(String(x)) ? nx - ny : String(x).localeCompare(String(y));
                return cmp * sort.dir;
            });
        }
        return out;
    }, [rows, q, fv, sort]);

    const pages = Math.max(1, Math.ceil(view.length / PAGE));
    const shown = view.slice(page * PAGE, page * PAGE + PAGE);

    const save = async (e: FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        setError(''); setSaving(true);
        try {
            const body: Row = {};
            fields.forEach((f) => (body[f.name] = editing[f.name] === '' ? null : editing[f.name]));
            if (editing.id) await api(`${resource}/${editing.id}`, 'PUT', body);
            else await api(resource, 'POST', body);
            toast(`${singular} ${editing.id ? 'updated' : 'added'}`);
            setEditing(null);
            load();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!deleting) return;
        try {
            await api(`${resource}/${deleting.id}`, 'DELETE');
            toast(`${singular} deleted`);
            load();
        } catch (err) {
            toast((err as Error).message, 'bad');
        }
        setDeleting(null);
    };

    const toggleSort = (i: number) =>
        setSort((s) => (s?.col === i ? (s.dir === 1 ? { col: i, dir: -1 } : null) : { col: i, dir: 1 }));

    const open = (r?: Row) => { setError(''); setEditing(r ? { ...r } : { ...defaults }); };

    return (
        <>
            <div className="head">
                <div><h1>{title}</h1><p>{subtitle}</p></div>
                <div className="tools" style={{ margin: 0 }}>
                    <button className="btn ghost" onClick={() => downloadCsv(resource, columns.map((c) => c.label), view.map((r) => columns.map((c) => c.value(r))))} disabled={!view.length}>
                        Export CSV
                    </button>
                    <button className="btn" onClick={() => open()}>Add {singular.toLowerCase()}</button>
                </div>
            </div>

            {loadError ? <ErrorBox message={loadError} retry={load} /> : rows === null ? <Loading /> : (
                <div className="card">
                    <div className="tools">
                        <input placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Search" />
                        {filter && (
                            <select style={{ maxWidth: 200 }} value={fv} onChange={(e) => { setFv(e.target.value); setPage(0); }} aria-label={filter.label}>
                                <option value="">All {filter.label.toLowerCase()}</option>
                                {filter.options.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        )}
                        <span style={{ color: 'var(--muted)' }}>{view.length} of {rows.length} records</span>
                    </div>
                    <div className="tablewrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {columns.map((c, i) => (
                                        <th key={c.label} className="sortable" onClick={() => toggleSort(i)} aria-sort={sort?.col === i ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                                            {c.label}{sort?.col === i ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                                        </th>
                                    ))}
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.id}</td>
                                        {columns.map((c) => <td key={c.label}>{c.render ? c.render(r) : c.value(r)}</td>)}
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn ghost sm" onClick={() => open(r)}>Edit</button>{' '}
                                            <button className="btn danger sm" onClick={() => setDeleting(r)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {!shown.length && <tr><td colSpan={columns.length + 2} className="empty">Nothing matches. Clear the search or add a {singular.toLowerCase()}.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="pager">
                        <button className="btn ghost sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                        Page {page + 1} of {pages}
                        <button className="btn ghost sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button>
                    </div>
                </div>
            )}

            {editing && (
                <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
                    <form className="box" onSubmit={save}>
                        <h2 style={{ marginBottom: 14 }}>{editing.id ? 'Edit' : 'Add'} {singular.toLowerCase()}</h2>
                        {error && <div className="err">{error}</div>}
                        <div className="form2">
                            {fields.map((f) => (
                                <label key={f.name} style={f.full ? { gridColumn: '1 / -1' } : undefined}>
                                    {f.label}
                                    {f.type === 'select' ? (
                                        <select required={!f.optional} value={editing[f.name] ?? ''} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })}>
                                            <option value="">{f.optional ? 'None' : 'Choose…'}</option>
                                            {f.lookup
                                                ? (lookups[f.lookup] ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)
                                                : f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={f.type ?? 'text'} step={f.step} required={!f.optional}
                                            value={editing[f.name] ?? ''} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} />
                                    )}
                                </label>
                            ))}
                        </div>
                        {extra?.(editing, lookups)}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
                            <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}
            {deleting && <Confirm text={`This ${singular.toLowerCase()} will be removed permanently.`} onYes={remove} onNo={() => setDeleting(null)} />}
        </>
    );
}
