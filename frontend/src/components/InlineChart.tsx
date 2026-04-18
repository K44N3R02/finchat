import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
interface InlineChartProps {
  data: [number, number][]; // [timestamp, price] pairs
  symbol?: string;
}

export const InlineChart: React.FC<InlineChartProps> = ({ data, symbol }) => {
  if (!data || data.length === 0) return null;

  // Format data for Recharts
  const formattedData = data.map((point) => ({
    time: new Date(point[0]).toLocaleTimeString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    price: point[1],
  }));

  // Calculate min and max for Y-axis to give the chart more definition
  const prices = data.map((p) => p[1]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Add a little padding to the domain
  const padding = (maxPrice - minPrice) * 0.05;
  const yDomain = [Math.max(0, minPrice - padding), maxPrice + padding];

  return (
    <div className="w-full h-48 mt-3 bg-white rounded-lg p-2 shadow-inner border border-gray-100 overflow-hidden relative">
      {symbol && (
        <div className="absolute top-2 right-2 z-10 bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          {symbol}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
...
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: '#888' }} 
            axisLine={false} 
            tickLine={false}
            minTickGap={30}
          />
          <YAxis 
            domain={yDomain} 
            tick={{ fontSize: 10, fill: '#888' }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}
            itemStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}
            formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
