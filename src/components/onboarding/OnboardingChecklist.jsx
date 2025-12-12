import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, Award, FileSignature, Shield, GraduationCap,
  Check, Clock, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const categoryConfig = {
  documents: { icon: FileText, label: 'Documents', color: 'text-blue-600 bg-blue-100' },
  certifications: { icon: Award, label: 'Certifications', color: 'text-purple-600 bg-purple-100' },
  contracts: { icon: FileSignature, label: 'Contracts', color: 'text-teal-600 bg-teal-100' },
  compliance: { icon: Shield, label: 'Compliance', color: 'text-amber-600 bg-amber-100' },
  training: { icon: GraduationCap, label: 'Training', color: 'text-emerald-600 bg-emerald-100' }
};

const DEFAULT_CHECKLIST_ITEMS = [
  { key: 'w9_form', name: 'W-9 Form', category: 'documents', order: 1 },
  { key: 'direct_deposit', name: 'Direct Deposit Form', category: 'documents', order: 2 },
  { key: 'eo_certificate', name: 'E&O Certificate', category: 'documents', order: 3 },
  { key: 'id_verification', name: 'ID Verification', category: 'documents', order: 4 },
  { key: 'ahip_certification', name: 'AHIP Certification', category: 'certifications', order: 5 },
  { key: 'background_check', name: 'Background Check', category: 'compliance', order: 6 },
  { key: 'compliance_training', name: 'Compliance Training', category: 'training', order: 7 },
  { key: 'carrier_certifications', name: 'Carrier Product Certifications', category: 'certifications', order: 8 },
  { key: 'initial_contract', name: 'Initial Carrier Contract', category: 'contracts', order: 9 },
  { key: 'state_license', name: 'State License Verification', category: 'compliance', order: 10 }
];

export { DEFAULT_CHECKLIST_ITEMS };

export default function OnboardingChecklist({ 
  items = [], 
  onToggle, 
  onInitialize,
  isLoading,
  isInitializing 
}) {
  const completedCount = items.filter(i => i.is_completed).length;
  const totalCount = items.length || DEFAULT_CHECKLIST_ITEMS.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Sort categories
  const categoryOrder = ['documents', 'certifications', 'compliance', 'training', 'contracts'];

  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-teal-600" />
            Onboarding Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No checklist items yet</p>
          <p className="text-sm text-slate-400 mt-1">Initialize the onboarding checklist for this agent</p>
          <Button 
            onClick={onInitialize} 
            className="mt-4 bg-teal-600 hover:bg-teal-700"
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Initialize Checklist
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-teal-600" />
            Onboarding Checklist
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={`${progressPercent === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
          >
            {completedCount}/{totalCount} Complete
          </Badge>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-500">Progress</span>
            <span className={`font-medium ${progressPercent === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categoryOrder.map(category => {
          const categoryItems = groupedItems[category];
          if (!categoryItems?.length) return null;
          
          const config = categoryConfig[category];
          const Icon = config.icon;
          const completedInCategory = categoryItems.filter(i => i.is_completed).length;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${config.color.split(' ')[1]}`}>
                  <Icon className={`w-4 h-4 ${config.color.split(' ')[0]}`} />
                </div>
                <span className="font-medium text-slate-700">{config.label}</span>
                <Badge variant="outline" className="text-xs">
                  {completedInCategory}/{categoryItems.length}
                </Badge>
              </div>
              <div className="space-y-2 ml-8">
                <AnimatePresence>
                  {categoryItems.sort((a, b) => a.sort_order - b.sort_order).map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        item.is_completed 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={() => onToggle(item)}
                          disabled={isLoading}
                        />
                        <span className={`text-sm ${item.is_completed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                          {item.item_name}
                        </span>
                      </div>
                      {item.is_completed && item.completed_date && (
                        <span className="text-xs text-slate-400">
                          {format(new Date(item.completed_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}