import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CarrierForm from '../components/carriers/CarrierForm';
import CarrierOnboardingForm from '../components/carriers/CarrierOnboardingForm';

export default function AddCarrier() {
  const handleComplete = (result) => {
    window.location.href = createPageUrl('CarrierDetail') + `?id=${result.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl('Carriers')}>
          <Button variant="ghost" className="mb-6 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Carriers
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Add New Carrier</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Choose between quick add or full onboarding process</p>
        </div>

        <Tabs defaultValue="onboarding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-800 shadow-sm">
            <TabsTrigger value="onboarding">Full Onboarding</TabsTrigger>
            <TabsTrigger value="quick">Quick Add</TabsTrigger>
          </TabsList>
          
          <TabsContent value="onboarding">
            <CarrierOnboardingForm onComplete={handleComplete} />
          </TabsContent>
          
          <TabsContent value="quick">
            <CarrierForm
              onSubmit={handleComplete}
              onCancel={() => window.location.href = createPageUrl('Carriers')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}