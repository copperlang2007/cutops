import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, Calendar, Users, Building2, FileSignature, X, 
  ChevronDown, Save, Bookmark
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear } from 'date-fns';

const DATE_PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom Range' }
];

const QUARTERS = [
  { value: 'q1', label: 'Q1 (Jan-Mar)' },
  { value: 'q2', label: 'Q2 (Apr-Jun)' },
  { value: 'q3', label: 'Q3 (Jul-Sep)' },
  { value: 'q4', label: 'Q4 (Oct-Dec)' }
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReportFilters({
  filters,
  onFiltersChange,
  agents = [],
  carriers = [],
  savedReports = [],
  onSaveReport,
  onLoadReport
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveReportName, setSaveReportName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleDatePresetChange = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case '7':
      case '30':
      case '90':
      case '365':
        start = subDays(today, parseInt(preset));
        end = today;
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'quarter':
        start = startOfQuarter(today);
        end = endOfQuarter(today);
        break;
      case 'ytd':
        start = startOfYear(today);
        end = today;
        break;
      default:
        start = filters.startDate ? new Date(filters.startDate) : subDays(today, 30);
        end = filters.endDate ? new Date(filters.endDate) : today;
    }

    onFiltersChange({
      ...filters,
      dateRange: preset,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    });
  };

  const handleAgentToggle = (agentId) => {
    const current = filters.selectedAgents || [];
    const updated = current.includes(agentId)
      ? current.filter(id => id !== agentId)
      : [...current, agentId];
    onFiltersChange({ ...filters, selectedAgents: updated });
  };

  const handleCarrierToggle = (carrierName) => {
    const current = filters.selectedCarriers || [];
    const updated = current.includes(carrierName)
      ? current.filter(c => c !== carrierName)
      : [...current, carrierName];
    onFiltersChange({ ...filters, selectedCarriers: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: '30',
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      statusFilter: 'all',
      selectedAgents: [],
      selectedCarriers: [],
      contractStatus: 'all'
    });
  };

  const handleSaveReport = () => {
    if (!saveReportName.trim()) return;
    onSaveReport({
      name: saveReportName,
      filters: filters,
      date_range_type: filters.dateRange,
      start_date: filters.startDate,
      end_date: filters.endDate
    });
    setSaveReportName('');
    setShowSaveDialog(false);
  };

  const activeFilterCount = [
    filters.selectedAgents?.length > 0,
    filters.selectedCarriers?.length > 0,
    filters.statusFilter !== 'all',
    filters.contractStatus !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      {/* Top Row - Date & Quick Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <Select value={filters.dateRange} onValueChange={handleDatePresetChange}>
          <SelectTrigger className="w-44">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map(preset => (
              <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filters.dateRange === 'custom' && (
          <>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              className="w-40"
            />
            <span className="text-slate-400">to</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              className="w-40"
            />
          </>
        )}

        {/* Status Filter */}
        <Select 
          value={filters.statusFilter} 
          onValueChange={(v) => onFiltersChange({ ...filters, statusFilter: v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ready_to_sell">Ready to Sell</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={showAdvanced ? 'bg-teal-50 border-teal-200' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Advanced
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-teal-600 text-white text-xs">{activeFilterCount}</Badge>
          )}
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>

        {/* Saved Reports */}
        {savedReports.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved Reports
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-1">
                {savedReports.map(report => (
                  <Button
                    key={report.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onLoadReport(report)}
                  >
                    {report.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Save Report */}
        <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <Label>Report Name</Label>
              <Input
                value={saveReportName}
                onChange={(e) => setSaveReportName(e.target.value)}
                placeholder="My Custom Report"
              />
              <Button 
                size="sm" 
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={handleSaveReport}
                disabled={!saveReportName.trim()}
              >
                Save Configuration
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Agent Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-slate-400" />
                Filter by Agents
              </Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {agents.slice(0, 20).map(agent => (
                  <div key={agent.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.selectedAgents?.includes(agent.id)}
                      onCheckedChange={() => handleAgentToggle(agent.id)}
                    />
                    <span className="text-sm truncate">{agent.first_name} {agent.last_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrier Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-slate-400" />
                Filter by Carriers
              </Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {carriers.map(carrier => (
                  <div key={carrier.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.selectedCarriers?.includes(carrier.name)}
                      onCheckedChange={() => handleCarrierToggle(carrier.name)}
                    />
                    <span className="text-sm truncate">{carrier.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Status Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <FileSignature className="w-4 h-4 text-slate-400" />
                Contract Status
              </Label>
              <Select 
                value={filters.contractStatus || 'all'} 
                onValueChange={(v) => onFiltersChange({ ...filters, contractStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contracts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="requires_correction">Requires Correction</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(filters.selectedAgents?.length > 0 || filters.selectedCarriers?.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {filters.selectedAgents?.map(agentId => {
                const agent = agents.find(a => a.id === agentId);
                return agent ? (
                  <Badge key={agentId} variant="secondary" className="bg-teal-50 text-teal-700">
                    {agent.first_name} {agent.last_name}
                    <button onClick={() => handleAgentToggle(agentId)} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {filters.selectedCarriers?.map(carrier => (
                <Badge key={carrier} variant="secondary" className="bg-blue-50 text-blue-700">
                  {carrier}
                  <button onClick={() => handleCarrierToggle(carrier)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}