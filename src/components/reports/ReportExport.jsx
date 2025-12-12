import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportExport({ metrics, agents, licenses, contracts, filters }) {
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = () => {
    const rows = [
      ['Report Generated', format(new Date(), 'yyyy-MM-dd HH:mm')],
      ['Date Range', `${filters.startDate} to ${filters.endDate}`],
      [''],
      ['SUMMARY METRICS'],
      ['Total Agents', metrics.totalAgents],
      ['Ready to Sell', metrics.readyToSell],
      ['Ready to Sell Rate', `${metrics.readyToSellRate}%`],
      ['Avg Onboarding Completion', `${metrics.avgCompletionRate}%`],
      ['Active Licenses', metrics.activeLicenses],
      ['Expiring Licenses', metrics.expiringLicenses],
      ['Active Contracts', metrics.activeContracts],
      ['Pending Contracts', metrics.pendingContracts],
      ['Active Alerts', metrics.activeAlerts],
      [''],
      ['AGENTS'],
      ['Name', 'Email', 'NPN', 'Status', 'State'],
      ...agents.map(a => [
        `${a.first_name} ${a.last_name}`,
        a.email,
        a.npn,
        a.onboarding_status,
        a.state || ''
      ]),
      [''],
      ['LICENSES'],
      ['Agent', 'State', 'License Number', 'Status', 'Expiration'],
      ...licenses.map(l => {
        const agent = agents.find(a => a.id === l.agent_id);
        return [
          agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown',
          l.state,
          l.license_number,
          l.status,
          l.expiration_date || ''
        ];
      }),
      [''],
      ['CONTRACTS'],
      ['Agent', 'Carrier', 'Status', 'Effective Date', 'Expiration Date'],
      ...contracts.map(c => {
        const agent = agents.find(a => a.id === c.agent_id);
        return [
          agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown',
          c.carrier_name,
          c.contract_status,
          c.effective_date || '',
          c.expiration_date || ''
        ];
      })
    ];

    const csvContent = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return csvContent;
  };

  const exportCSV = () => {
    setIsExporting(true);
    try {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agent-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = () => {
    setIsExporting(true);
    try {
      // Generate printable HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Agent Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #0d9488; }
            h2 { color: #334155; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
            .metric { background: #f8fafc; padding: 16px; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #0d9488; }
            .metric-label { font-size: 12px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f1f5f9; font-weight: 600; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .date-range { color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Agent Performance Report</h1>
            <div class="date-range">
              ${filters.startDate} to ${filters.endDate}
            </div>
          </div>
          
          <h2>Summary Metrics</h2>
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-value">${metrics.totalAgents}</div>
              <div class="metric-label">Total Agents</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.readyToSellRate}%</div>
              <div class="metric-label">Ready to Sell</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.avgCompletionRate}%</div>
              <div class="metric-label">Avg Onboarding</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.activeAlerts}</div>
              <div class="metric-label">Active Alerts</div>
            </div>
          </div>

          <h2>License Compliance</h2>
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-value">${metrics.activeLicenses}</div>
              <div class="metric-label">Active</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.expiringLicenses}</div>
              <div class="metric-label">Expiring Soon</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.expiredLicenses}</div>
              <div class="metric-label">Expired</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.licenseComplianceRate}%</div>
              <div class="metric-label">Compliance Rate</div>
            </div>
          </div>

          <h2>Contract Status</h2>
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-value">${metrics.activeContracts}</div>
              <div class="metric-label">Active</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.pendingContracts}</div>
              <div class="metric-label">Pending</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.actionRequired}</div>
              <div class="metric-label">Action Required</div>
            </div>
          </div>

          <h2>Agents (${agents.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>NPN</th>
                <th>Status</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              ${agents.slice(0, 50).map(a => `
                <tr>
                  <td>${a.first_name} ${a.last_name}</td>
                  <td>${a.npn}</td>
                  <td>${a.onboarding_status}</td>
                  <td>${a.state || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <p style="margin-top: 40px; color: #94a3b8; font-size: 12px;">
            Generated on ${format(new Date(), 'MMMM d, yyyy HH:mm')}
          </p>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportCSV}>
          <Table className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}