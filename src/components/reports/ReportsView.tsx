import React, { useState } from 'react';
import { DailyReportView } from './DailyReportView';
import { MonthlyReportView } from './MonthlyReportView';
import { ProfitLossReportView } from './ProfitLossReportView';
import { Calendar, FileSpreadsheet, BarChart3 } from 'lucide-react';

interface ReportsViewProps {
  initialTab?: 'daily' | 'monthly' | 'profit_loss';
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialTab = 'daily' }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'profit_loss'>(initialTab);

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'daily'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Cash Flow Report</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'monthly'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Monthly Financials</span>
        </button>

        <button
          onClick={() => setActiveTab('profit_loss')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'profit_loss'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Profit & Loss Statement (P&L)</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'daily' && <DailyReportView />}
      {activeTab === 'monthly' && <MonthlyReportView />}
      {activeTab === 'profit_loss' && <ProfitLossReportView />}
    </div>
  );
};
