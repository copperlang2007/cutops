import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, Eye, Copy, CheckCircle, Upload, Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhiteLabelPortal() {
  const [config, setConfig] = useState({
    companyName: 'Your Insurance Agency',
    primaryColor: '#0d9488',
    logoUrl: '',
    customDomain: 'agents.youragency.com',
    welcomeMessage: 'Welcome to our agent portal!'
  });
  const [showPreview, setShowPreview] = useState(false);

  const copyPortalLink = () => {
    navigator.clipboard.writeText(`https://${config.customDomain}`);
    toast.success('Portal link copied');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-600" />
          White-Label Agent Portal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={config.companyName}
                onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-16 h-9 p-1"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={config.logoUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://youragency.com/logo.png"
              />
            </div>
            <div>
              <Label>Custom Domain</Label>
              <div className="flex gap-2">
                <Input
                  value={config.customDomain}
                  onChange={(e) => setConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                />
                <Button variant="outline" onClick={copyPortalLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Welcome Message</Label>
              <Input
                value={config.welcomeMessage}
                onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={() => toast.success('Portal settings saved')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>

          {/* Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="p-4 text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="h-8" />
                ) : (
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{config.companyName}</h3>
                  <p className="text-xs opacity-80">Agent Portal</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50">
              <p className="text-sm text-slate-600 mb-4">{config.welcomeMessage}</p>
              <div className="space-y-2">
                <Button 
                  className="w-full h-9 text-sm"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Start Onboarding
                </Button>
                <Button variant="outline" className="w-full h-9 text-sm">
                  View My Progress
                </Button>
                <Button variant="outline" className="w-full h-9 text-sm">
                  Upload Documents
                </Button>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <p className="text-xs text-slate-500">Your Onboarding Progress</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ width: '45%', backgroundColor: config.primaryColor }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">45% Complete</p>
              </div>
            </div>
            <div className="p-2 bg-slate-100 text-center">
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                {config.customDomain}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Portal Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
            <span>✓ Self-service onboarding</span>
            <span>✓ Document uploads</span>
            <span>✓ Progress tracking</span>
            <span>✓ Commission viewing</span>
            <span>✓ Training access</span>
            <span>✓ License status</span>
            <span>✓ Support chat</span>
            <span>✓ Custom branding</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}