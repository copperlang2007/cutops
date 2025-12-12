import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, HelpCircle } from 'lucide-react';
import InteractiveDemoSystem from './InteractiveDemoSystem';

export default function DemoButton({ feature, variant = 'default', size = 'sm', className = '' }) {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDemo(true)}
        className={className}
      >
        {feature ? <HelpCircle className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
        {feature ? 'Demo' : 'Interactive Demo'}
      </Button>

      <InteractiveDemoSystem
        isOpen={showDemo}
        onClose={() => setShowDemo(false)}
        initialFeature={feature}
      />
    </>
  );
}