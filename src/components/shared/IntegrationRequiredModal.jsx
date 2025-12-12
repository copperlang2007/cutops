import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Link2, ExternalLink, Key, Settings, CheckCircle, 
  AlertTriangle, ArrowRight, Copy, Info
} from 'lucide-react';
import { toast } from 'sonner'
import { createPageUrl } from '@/utils'

const INTEGRATION_CONFIGS = {
  nipr: {
    name: 'NIPR Gateway',
    description: 'National Insurance Producer Registry integration for license verification',
    steps: [
      'Register for NIPR Gateway API access at nipr.com',
      'Obtain your API Key and Secret from the developer portal',
      'Configure webhook endpoints for real-time updates',
      'Add credentials in Admin Dashboard → System Settings'
    ],
    website: 'https://nipr.com/products-and-services/nipr-gateway',
    credentials: ['NIPR_API_KEY', 'NIPR_API_SECRET']
  },
  sunfire: {
    name: 'Sunfire',
    description: 'Agent appointment and carrier management platform',
    steps: [
      'Contact Sunfire support for API integration access',
      'Request API credentials for your agency',
      'Configure SSO settings if required',
      'Add API token in Admin Dashboard → System Settings'
    ],
    website: 'https://sunfire.com',
    credentials: ['SUNFIRE_API_TOKEN', 'SUNFIRE_AGENCY_ID']
  },
  docusign: {
    name: 'DocuSign',
    description: 'Electronic signature integration for contracts',
    steps: [
      'Create a DocuSign developer account',
      'Generate API Integration Key',
      'Configure OAuth consent and redirect URIs',
      'Add credentials in Admin Dashboard → System Settings'
    ],
    website: 'https://developers.docusign.com',
    credentials: ['DOCUSIGN_INTEGRATION_KEY', 'DOCUSIGN_SECRET_KEY']
  },
  crm: {
    name: 'CRM Integration',
    description: 'Connect with Salesforce, HubSpot, or other CRM platforms',
    steps: [
      'Choose your CRM platform and enable API access',
      'Generate API credentials or OAuth tokens',
      'Map fields between systems',
      'Configure sync settings in Admin Dashboard'
    ],
    website: null,
    credentials: ['CRM_API_KEY', 'CRM_INSTANCE_URL']
  },
  carrier: {
    name: 'Carrier API',
    description: 'Direct carrier integrations for real-time data',
    steps: [
      'Contact your carrier representative for API access',
      'Complete carrier API agreement and security review',
      'Obtain production API credentials',
      'Configure carrier-specific settings in Admin Dashboard'
    ],
    website: null,
    credentials: ['CARRIER_API_KEY', 'CARRIER_AGENT_ID']
  },
  email: {
    name: 'Email Service',
    description: 'Email sending integration (SendGrid, Mailgun, etc.)',
    steps: [
      'Create account with email service provider',
      'Verify your sending domain',
      'Generate API key with sending permissions',
      'Add credentials in Admin Dashboard → System Settings'
    ],
    website: null,
    credentials: ['EMAIL_API_KEY', 'EMAIL_FROM_ADDRESS']
  }
};

export default function IntegrationRequiredModal({ 
  open, 
  onClose, 
  integrationType = 'nipr',
  featureName = 'This feature'
}) {
  const config = INTEGRATION_CONFIGS[integrationType] || INTEGRATION_CONFIGS.nipr;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const goToSettings = () => {
    onClose();
    window.location.href = createPageUrl('AdminDashboard') + '?tab=system';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Integration Required</DialogTitle>
              <DialogDescription className="text-sm">
                {featureName} requires {config.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Feature Description */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{config.name}</p>
                  <p className="text-xs text-amber-700 mt-1">{config.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Steps */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Setup Instructions
            </h4>
            <div className="space-y-2">
              {config.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Required Credentials */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Required Credentials
            </h4>
            <div className="flex flex-wrap gap-2">
              {config.credentials.map((cred) => (
                <button
                  key={cred}
                  onClick={() => copyToClipboard(cred)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {cred}
                  <Copy className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* External Link */}
          {config.website && (
            <a
              href={config.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-slate-700">Visit {config.name} Developer Portal</span>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={goToSettings} className="flex-1 bg-teal-600 hover:bg-teal-700">
            <Settings className="w-4 h-4 mr-2" />
            Go to Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy integration checking
export function useIntegrationCheck() {
  const [showModal, setShowModal] = React.useState(false);
  const [modalProps, setModalProps] = React.useState({});

  const requireIntegration = (integrationType, featureName) => {
    setModalProps({ integrationType, featureName });
    setShowModal(true);
    return false;
  };

  const IntegrationModal = () => (
    <IntegrationRequiredModal
      open={showModal}
      onClose={() => setShowModal(false)}
      {...modalProps}
    />
  );

  return { requireIntegration, IntegrationModal };
}