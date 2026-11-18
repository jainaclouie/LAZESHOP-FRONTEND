import Crud from './Crud';
import { peso } from '../api';

const cities = ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Talisay', 'Consolacion', 'Minglanilla', 'Danao'];
const today = new Date().toISOString().slice(0, 10);

export const Customers = () => (
    <Crud
        resource="customers" singular="Customer" title="Customers" subtitle="Registered buyers (18 and above only)."
        defaults={{ joined_at: today }}
        filter={{ label: 'Cities', value: (r) => r.city, options: cities }}
        columns={[
            { label: 'Name', value: (r) => r.name },
            { label: 'Age', value: (r) => r.age },
            { label: 'City', value: (r) => r.city },
            { label: 'Phone', value: (r) => r.phone ?? '' },
            { label: 'Joined', value: (r) => r.joined_at },
        ]}
        fields={[
            { name: 'name', label: 'Full name' },
            { name: 'email', label: 'Email', type: 'email', optional: true },
            { name: 'phone', label: 'Phone', optional: true },
            { name: 'age', label: 'Age (18+)', type: 'number' },
            { name: 'city', label: 'City', type: 'select', options: cities },
            { name: 'joined_at', label: 'Joined on', type: 'date' },
        ]}
    />
);

export const Products = () => (
    <Crud
        resource="products" singular="Product" title="Products" subtitle="Inventory with pricing, cost and reorder levels."
        defaults={{ stock: 0, reorder_level: 10 }}
        filter={{ label: 'Categories', value: (r) => r.category, options: ['Disposable', 'Pod System', 'Mod Kit', 'E-Liquid', 'Accessories'] }}
        columns={[
            { label: 'Product', value: (r) => r.name },
            { label: 'Category', value: (r) => r.category },
            { label: 'Supplier', value: (r) => r.supplier?.name ?? '' },
            { label: 'Price', value: (r) => peso(r.price) },
            { label: 'Cost', value: (r) => peso(r.cost) },
            { label: 'Stock', value: (r) => r.stock, render: (r) => <span className={`badge ${r.stock <= r.reorder_level ? 'High' : 'OK'}`}>{r.stock}{r.stock <= r.reorder_level ? ' low' : ''}</span> },
        ]}
        fields={[
            { name: 'name', label: 'Product name' },
            { name: 'brand', label: 'Brand' },
            { name: 'category', label: 'Category', type: 'select', options: ['Disposable', 'Pod System', 'Mod Kit', 'E-Liquid', 'Accessories'] },
            { name: 'supplier_id', label: 'Supplier', type: 'select', lookup: 'suppliers' },
            { name: 'price', label: 'Selling price (₱)', type: 'number', step: '0.01' },
            { name: 'cost', label: 'Unit cost (₱)', type: 'number', step: '0.01' },
            { name: 'stock', label: 'Stock on hand', type: 'number' },
            { name: 'reorder_level', label: 'Reorder level', type: 'number' },
        ]}
    />
);

export const Sales = () => (
    <Crud
        resource="sales" singular="Sale" title="Sales" subtitle="Transactions. The total is computed from price × quantity and stock is deducted automatically."
        defaults={{ quantity: 1, sales_channel: 'Store', sold_at: today }}
        filter={{ label: 'Channels', value: (r) => r.sales_channel, options: ['Store', 'Online'] }}
        extra={(e, l) => {
            const p = (l.products ?? []).find((x) => String(x.id) === String(e.product_id));
            if (!p) return null;
            const qty = Number(e.quantity) || 0;
            return (
                <div className="insight" style={{ marginBottom: 12 }}>
                    Total: <b>{peso(p.price * qty)}</b> ({qty} × {peso(p.price)}). In stock: {p.stock}
                    {qty > p.stock && <span style={{ color: 'var(--coral)' }}> — quantity is above current stock</span>}
                </div>
            );
        }}
        columns={[
            { label: 'Date', value: (r) => r.sold_at },
            { label: 'Customer', value: (r) => r.customer?.name ?? '' },
            { label: 'Product', value: (r) => r.product?.name ?? '' },
            { label: 'Qty', value: (r) => r.quantity },
            { label: 'Total', value: (r) => peso(r.total) },
            { label: 'Channel', value: (r) => r.sales_channel },
            { label: 'Campaign', value: (r) => r.campaign?.name ?? '—' },
        ]}
        fields={[
            { name: 'customer_id', label: 'Customer', type: 'select', lookup: 'customers' },
            { name: 'product_id', label: 'Product', type: 'select', lookup: 'products' },
            { name: 'quantity', label: 'Quantity', type: 'number' },
            { name: 'sales_channel', label: 'Sales channel', type: 'select', options: ['Store', 'Online'] },
            { name: 'campaign_id', label: 'Campaign (optional)', type: 'select', lookup: 'campaigns', optional: true },
            { name: 'sold_at', label: 'Sold on', type: 'date' },
        ]}
    />
);

export const Campaigns = () => (
    <Crud
        resource="campaigns" singular="Campaign" title="Campaigns" subtitle="Marketing campaigns and their spend."
        defaults={{ start_date: today, end_date: today }}
        filter={{ label: 'Channels', value: (r) => r.channel, options: ['Facebook Ads', 'Instagram', 'TikTok', 'Walk-in Promo', 'Referral'] }}
        columns={[
            { label: 'Campaign', value: (r) => r.name },
            { label: 'Channel', value: (r) => r.channel },
            { label: 'Spend', value: (r) => peso(r.spend) },
            { label: 'Start', value: (r) => String(r.start_date).slice(0, 10) },
            { label: 'End', value: (r) => String(r.end_date).slice(0, 10) },
        ]}
        fields={[
            { name: 'name', label: 'Campaign name' },
            { name: 'channel', label: 'Channel', type: 'select', options: ['Facebook Ads', 'Instagram', 'TikTok', 'Walk-in Promo', 'Referral'] },
            { name: 'spend', label: 'Spend (₱)', type: 'number', step: '0.01' },
            { name: 'start_date', label: 'Start date', type: 'date' },
            { name: 'end_date', label: 'End date', type: 'date' },
        ]}
    />
);

export const Suppliers = () => (
    <Crud
        resource="suppliers" singular="Supplier" title="Suppliers" subtitle="Who we buy from and how long they take to deliver."
        defaults={{ lead_time_days: 7 }}
        columns={[
            { label: 'Supplier', value: (r) => r.name },
            { label: 'Contact', value: (r) => r.contact_person },
            { label: 'Email', value: (r) => r.email },
            { label: 'City', value: (r) => r.city },
            { label: 'Lead time', value: (r) => `${r.lead_time_days} days` },
        ]}
        fields={[
            { name: 'name', label: 'Company' },
            { name: 'contact_person', label: 'Contact person' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'city', label: 'City' },
            { name: 'lead_time_days', label: 'Lead time (days)', type: 'number' },
        ]}
    />
);
