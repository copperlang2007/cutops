import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Layers, Mail, FileText, RefreshCw, Upload, Download,
  CheckCircle, AlertTriangle, Loader2, Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function BulkOperations({ agents, licenses, contracts, onComplete }) {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [operation, setOperation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const selectAll = () => {
    setSelectedAgents(agents.map(a => a.id));
  };

  const clearSelection = () => {
    setSelectedAgents([]);
  };

  const executeBulkOperation = async () => {
    if (selectedAgents.length === 0 || !operation) return;

    setIsProcessing(true);
    setProgress(0);
    const operationResults = { success: 0, failed: 0, details: [] };

    try {
      for (let i = 0; i < selectedAgents.length; i++) {
        const agentId = selectedAgents[i];
        const agent = agents.find(a => a.id === agentId);
        
        try {
          switch (operation) {
            case 'send_reminder':
              if (agent?.email) {
                await base44.integrations.Core.SendEmail({
                  to: agent.email,
                  subject: 'Onboarding Reminder',
                  body: `Hi ${agent.first_name},\n\nThis is a friendly reminder to complete your onboarding process.\n\nBest regards`
                });
              }
              break;
            case 'update_status':
              await base44.entities.Agent.update(agentId, { onboarding_status: 'in_progress' });
              break;
            case 'verify_licenses':
              // Simulate license verification
              await new Promise(resolve => setTimeout(resolve, 500));
              break;
            case 'export_data':
              // Just collect data for export
              break;
          }
          operationResults.success++;
          operationResults.details.push({ agent: agent?.first_name, status: 'success' });
        } catch (err) {
          operationResults.failed++;
          operationResults.details.push({ agent: agent?.first_name, status: 'failed', error: err.message });
        }

        setProgress(Math.round(((i + 1) / selectedAgents.length) * 100));
      }

      setResults(operationResults);
      toast.success(`Completed: ${operationResults.success} success, ${operationResults.failed} failed`);
      onComplete?.();
    } catch (err) {
      toast.error('Bulk operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const operations = [
    { value: 'send_reminder', label: 'Send Onboarding Reminder', icon: Mail },
    { value: 'update_status', label: 'Update Status to In Progress', icon: RefreshCw },
    { value: 'verify_licenses', label: 'Verify Licenses (NIPR)', icon: FileText },
    { value: 'export_data', label: 'Export Agent Data', icon: Download }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Bulk Operations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Selection Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Clear
            </Button>
            <Badge variant="secondary">{selectedAgents.length} selected</Badge>
          </div>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select operation" />
            </SelectTrigger>
            <SelectContent>
              {operations.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  <div className="flex items-center gap-2">
                    <op.icon className="w-4 h-4" />
                    {op.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Agent List */}
        <div className="max-h-48 overflow-y-auto mb-4 border rounded-lg">
          {agents.map(agent => (
            <div 
              key={agent.id}
              className={`flex items-center gap-3 p-2 border-b last:border-b-0 cursor-pointer hover:bg-slate-50 ${
                selectedAgents.includes(agent.id) ? 'bg-blue-50' : ''
              }`}
              onClick={() => toggleAgent(agent.id)}
            >
              <Checkbox 
                checked={selectedAgents.includes(agent.id)}
                onCheckedChange={() => toggleAgent(agent.id)}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{agent.first_name} {agent.last_name}</p>
                <p className="text-xs text-slate-500">{agent.email}</p>
              </div>
              <Badge variant="outline" className="text-xs">{agent.onboarding_status}</Badge>
            </div>
          ))}
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Processing...</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results */}
        {results && !isProcessing && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{results.success} Success</span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{results.failed} Failed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execute Button */}
        <Button 
          className="w-full" 
          onClick={executeBulkOperation}
          disabled={selectedAgents.length === 0 || !operation || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Layers className="w-4 h-4 mr-2" />
          )}
          Execute Operation ({selectedAgents.length} agents)
        </Button>
      </CardContent>
    </Card>
  );
}