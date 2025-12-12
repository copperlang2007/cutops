import React from 'react';
import { Shield, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComplianceDashboard from '../components/compliance/ComplianceDashboard';
import AutomatedComplianceScanner from '../components/compliance/AutomatedComplianceScanner';
import ComplianceWorkflowBuilder from '../components/compliance/ComplianceWorkflowBuilder';
import RoleGuard from '../components/shared/RoleGuard';
import { motion } from 'framer-motion';

export default function Compliance() {
  return (
    <RoleGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 rounded-3xl clay-morphism bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 dark:from-purple-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Compliance Center
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg font-medium mt-1">
                  AI-powered compliance monitoring, automated workflows, and violation management
                </p>
              </div>
            </div>
          </motion.div>

          <Tabs defaultValue="scanner" className="space-y-6">
            <TabsList className="clay-morphism p-1.5 rounded-2xl">
              <TabsTrigger value="scanner" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <Shield className="w-5 h-5 mr-2" />
                Automated Scanner
              </TabsTrigger>
              <TabsTrigger value="flags" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <Shield className="w-5 h-5 mr-2" />
                Compliance Flags
              </TabsTrigger>
              <TabsTrigger value="workflows" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <Zap className="w-5 h-5 mr-2" />
                Automated Workflows
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scanner">
              <AutomatedComplianceScanner />
            </TabsContent>

            <TabsContent value="flags">
              <ComplianceDashboard />
            </TabsContent>

            <TabsContent value="workflows">
              <ComplianceWorkflowBuilder />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}