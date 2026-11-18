export type Row = Record<string, any>;

export interface Analytics {
    descriptive: {
        kpis: Record<string, number>;
        monthly: { month: string; revenue: number; orders: number; spend: number; partial: boolean }[];
        by_category: { name: string; revenue: number; units: number; profit: number }[];
        by_sales_channel: { name: string; revenue: number; orders: number }[];
        by_city: { name: string; revenue: number }[];
        by_age: { name: string; revenue: number }[];
        top_products: { name: string; revenue: number; units: number }[];
        channel_roas: { channel: string; campaigns: number; spend: number; revenue: number; roas: number }[];
    };
    predictive: {
        model: string;
        slope_per_month: number;
        r_squared: number;
        trend: string;
        forecast: { month: string; predicted_revenue: number }[];
        spend_revenue_correlation: number;
        growth_factor: number;
    };
    prescriptive: {
        budget: number;
        restock: {
            id: number; name: string; stock: number; reorder_level: number;
            forecast_monthly_units: number; lead_time_days: number;
            order_qty: number; order_cost: number; priority: string;
        }[];
        allocation: { channel: string; roas: number; share_pct: number; budget: number; expected_revenue: number }[];
        current_mix_expected_revenue: number;
        optimized_expected_revenue: number;
        uplift: number;
        actions: string[];
    };
}
