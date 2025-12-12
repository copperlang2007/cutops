import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Pill, Search, Plus, X, AlertTriangle, CheckCircle, 
  DollarSign, Loader2, Info, ArrowRight, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const tierLabels = {
  1: { label: 'Tier 1 - Preferred Generic', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  2: { label: 'Tier 2 - Generic', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  3: { label: 'Tier 3 - Preferred Brand', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  4: { label: 'Tier 4 - Non-Preferred', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  5: { label: 'Tier 5 - Specialty', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
};

export default function DrugLookupTool({ client, portalUser }) {
  const [medications, setMedications] = useState([]);
  const [newDrug, setNewDrug] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [lookupResults, setLookupResults] = useState(null);
  const [interactions, setInteractions] = useState([]);

  const lookupMutation = useMutation({
    mutationFn: async (meds) => {
      const prompt = `You are a pharmacy benefits expert. Analyze these medications for a Medicare patient:

Medications: ${meds.map(m => `${m.name} ${m.dosage || ''}`).join(', ')}

For each medication, provide:
1. Whether it's typically covered under Medicare Part D
2. Likely formulary tier (1-5)
3. Estimated monthly cost range
4. Generic alternatives if applicable
5. Is it a generic or brand name

Then check for ALL drug interactions between these medications and provide:
- Severity (mild, moderate, severe, contraindicated)
- Description of the interaction
- What to watch for

Return as JSON:
{
  "medications": [
    {
      "drug_name": "string",
      "dosage": "string",
      "covered": true/false,
      "tier": 1-5,
      "estimated_cost_min": number,
      "estimated_cost_max": number,
      "is_generic": true/false,
      "alternatives": ["string"],
      "notes": "string"
    }
  ],
  "interactions": [
    {
      "drug1": "string",
      "drug2": "string",
      "severity": "mild|moderate|severe|contraindicated",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "total_estimated_monthly_cost_min": number,
  "total_estimated_monthly_cost_max": number,
  "general_recommendations": ["string"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            medications: { type: 'array', items: { type: 'object' } },
            interactions: { type: 'array', items: { type: 'object' } },
            total_estimated_monthly_cost_min: { type: 'number' },
            total_estimated_monthly_cost_max: { type: 'number' },
            general_recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setLookupResults(data);
      setInteractions(data.interactions || []);
      if (data.interactions?.some(i => i.severity === 'severe' || i.severity === 'contraindicated')) {
        toast.warning('Potential serious drug interactions detected!');
      }
    }
  });

  const addMedication = () => {
    if (!newDrug.trim()) return;
    setMedications([...medications, { name: newDrug, dosage: newDosage }]);
    setNewDrug('');
    setNewDosage('');
    setLookupResults(null);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
    setLookupResults(null);
  };

  const handleLookup = () => {
    if (medications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }
    lookupMutation.mutate(medications);
  };

  const severityColors = {
    mild: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    severe: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    contraindicated: 'bg-red-200 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'
  };

  return (
    <div className="space-y-6">
      {/* Add Medications */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            Prescription Drug Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your medications to check coverage, costs, and potential interactions.
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Medication name (e.g., Lisinopril)"
              value={newDrug}
              onChange={(e) => setNewDrug(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMedication()}
              className="flex-1"
            />
            <Input
              placeholder="Dosage (e.g., 10mg)"
              value={newDosage}
              onChange={(e) => setNewDosage(e.target.value)}
              className="w-32"
            />
            <Button onClick={addMedication} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {medications.length > 0 && (
            <div className="space-y-2">
              <AnimatePresence>
                {medications.map((med, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-slate-800 dark:text-white">{med.name}</span>
                      {med.dosage && (
                        <Badge variant="outline">{med.dosage}</Badge>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeMedication(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <Button 
            onClick={handleLookup} 
            disabled={medications.length === 0 || lookupMutation.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {lookupMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Medications...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Check Coverage & Interactions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Drug Interactions Alert */}
      {interactions.length > 0 && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <Heart className="w-5 h-5" />
              Drug Interaction Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interactions.map((interaction, idx) => (
              <Alert key={idx} className={severityColors[interaction.severity]}>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{interaction.drug1}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-semibold">{interaction.drug2}</span>
                    <Badge className={severityColors[interaction.severity]}>
                      {interaction.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm">{interaction.description}</p>
                  {interaction.recommendation && (
                    <p className="text-sm mt-1 font-medium">
                      Recommendation: {interaction.recommendation}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            ))}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              ⚠️ This is for informational purposes only. Always consult your doctor or pharmacist about drug interactions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lookup Results */}
      {lookupResults && (
        <>
          {/* Cost Summary */}
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Estimated Monthly Cost</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    ${lookupResults.total_estimated_monthly_cost_min} - ${lookupResults.total_estimated_monthly_cost_max}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Individual Drug Results */}
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Coverage Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lookupResults.medications?.map((drug, idx) => {
                const tier = tierLabels[drug.tier] || tierLabels[3];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-xl border dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white">{drug.drug_name}</h4>
                        {drug.dosage && <p className="text-sm text-slate-500 dark:text-slate-400">{drug.dosage}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {drug.covered ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Covered
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                            Not Covered
                          </Badge>
                        )}
                        <Badge className={tier.color}>{tier.label}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Est. Monthly Cost</p>
                        <p className="font-medium text-slate-800 dark:text-white">
                          ${drug.estimated_cost_min} - ${drug.estimated_cost_max}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Type</p>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {drug.is_generic ? 'Generic' : 'Brand Name'}
                        </p>
                      </div>
                    </div>

                    {drug.alternatives && drug.alternatives.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                          <Info className="w-3 h-3 inline mr-1" />
                          Lower-cost alternatives:
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {drug.alternatives.join(', ')}
                        </p>
                      </div>
                    )}

                    {drug.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{drug.notes}</p>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {lookupResults.general_recommendations?.length > 0 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lookupResults.general_recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}