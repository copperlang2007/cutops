import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, DollarSign, TrendingUp, Info
} from 'lucide-react';

const COMMISSION_RATES = {
  medicare_advantage: { initial: 600, renewal: 300 },
  supplement: { initial: 400, renewal: 100 },
  pdp: { initial: 100, renewal: 50 },
  ancillary: { initial: 200, renewal: 100 }
};

export default function CommissionCalculator({ contracts }) {
  const [policyType, setPolicyType] = useState('medicare_advantage');
  const [policyCount, setPolicyCount] = useState(10);
  const [isRenewal, setIsRenewal] = useState(false);

  const calculation = useMemo(() => {
    const rates = COMMISSION_RATES[policyType] || COMMISSION_RATES.medicare_advantage;
    const perPolicy = isRenewal ? rates.renewal : rates.initial;
    const gross = perPolicy * policyCount;

    // Find relevant contract for override
    const contract = contracts?.find(c => 
      ['active', 'contract_signed'].includes(c.contract_status)
    );
    const commissionLevel = contract?.commission_level || 'standard';
    
    // Apply level multiplier
    const levelMultiplier = commissionLevel === 'premium' ? 1.15 : 
                           commissionLevel === 'elite' ? 1.25 : 1.0;
    
    const adjusted = gross * levelMultiplier;

    // Monthly projection
    const monthlyProjection = adjusted;
    const annualProjection = monthlyProjection * 12;

    return {
      perPolicy,
      gross,
      adjusted,
      levelMultiplier,
      commissionLevel,
      monthlyProjection,
      annualProjection
    };
  }, [policyType, policyCount, isRenewal, contracts]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          Commission Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Policy Type</Label>
              <Select value={policyType} onValueChange={setPolicyType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                  <SelectItem value="supplement">Supplement</SelectItem>
                  <SelectItem value="pdp">PDP</SelectItem>
                  <SelectItem value="ancillary">Ancillary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Policy Count</Label>
              <Input
                type="number"
                value={policyCount}
                onChange={(e) => setPolicyCount(Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isRenewal}
              onChange={(e) => setIsRenewal(e.target.checked)}
              className="rounded"
            />
            <Label className="text-xs">Renewal (vs Initial)</Label>
          </div>

          {/* Results */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-emerald-600">Per Policy</p>
                <p className="text-lg font-bold text-emerald-700">${calculation.perPolicy}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Gross Commission</p>
                <p className="text-lg font-bold text-emerald-700">${calculation.gross.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-2 bg-white rounded mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Level:</span>
                  <Badge variant="outline" className="capitalize">{calculation.commissionLevel}</Badge>
                </div>
                <span className="text-xs text-slate-600">×{calculation.levelMultiplier}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-emerald-700">Adjusted Commission</span>
                <span className="text-xl font-bold text-emerald-800">
                  ${calculation.adjusted.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Projections */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <TrendingUp className="w-4 h-4 mx-auto text-blue-600 mb-1" />
              <p className="text-xs text-blue-600">Monthly @ Same Pace</p>
              <p className="text-lg font-bold text-blue-700">
                ${calculation.monthlyProjection.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <DollarSign className="w-4 h-4 mx-auto text-purple-600 mb-1" />
              <p className="text-xs text-purple-600">Annual Projection</p>
              <p className="text-lg font-bold text-purple-700">
                ${calculation.annualProjection.toLocaleString()}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Estimates based on standard rates. Actual may vary by carrier.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}