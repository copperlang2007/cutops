import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileSignature } from 'lucide-react'
import ContractCard from './ContractCard';
import ContractAIAnalysis from './ContractAIAnalysis';

export default function ContractList({ 
  contracts, 
  onAdd, 
  onEdit, 
  isLoading,
  title = "Carrier Contracts",
  documents = []
}) {
  const [selectedContractForAI, setSelectedContractForAI] = useState(null);
  const activeContracts = contracts.filter(c => 
    ['active', 'contract_signed'].includes(c.contract_status)
  ).length;
  
  const pendingContracts = contracts.filter(c => 
    ['pending_submission', 'submitted', 'pending_carrier_review', 'contract_sent'].includes(c.contract_status)
  ).length;
  
  const actionRequired = contracts.filter(c => 
    c.contract_status === 'requires_correction'
  ).length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex gap-2">
              {activeContracts > 0 && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {activeContracts} Active
                </Badge>
              )}
              {pendingContracts > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {pendingContracts} Pending
                </Badge>
              )}
              {actionRequired > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {actionRequired} Action Required
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={onAdd} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Contract
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No contracts yet</p>
            <p className="text-sm mt-1">Add a carrier contract to get started</p>
            <Button onClick={onAdd} className="mt-4 bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Contract
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map(contract => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onEdit={onEdit}
                onAnalyze={() => setSelectedContractForAI(contract)}
              />
            ))}
          </div>
        )}
        
        {/* AI Analysis Panel */}
        {selectedContractForAI && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-700">
                AI Analysis: {selectedContractForAI.carrier_name}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedContractForAI(null)}
              >
                Close
              </Button>
            </div>
            <ContractAIAnalysis 
              contract={selectedContractForAI}
              documentUrl={documents.find(d => 
                d.document_type === 'contract' && 
                d.carrier_name === selectedContractForAI.carrier_name
              )?.file_url}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}