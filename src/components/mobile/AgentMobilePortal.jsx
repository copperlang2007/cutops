import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, QrCode, CheckCircle, FileText, DollarSign,
  Bell, User, Shield, Calendar, Upload
} from 'lucide-react';

export default function AgentMobilePortal({ agent, checklistItems, commissions, licenses }) {
  const [showQR, setShowQR] = useState(false);

  const completedItems = checklistItems?.filter(c => c.is_completed).length || 0;
  const totalItems = checklistItems?.length || 1;
  const progress = Math.round((completedItems / totalItems) * 100);
  const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const activeLicenses = licenses?.filter(l => l.status === 'active').length || 0;

  // Generate mock QR code URL (in production, this would be a real QR code)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://app.agenthub.com/mobile/${agent?.id || 'demo'}`)}`;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600" />
          Agent Mobile Portal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* QR Code for Mobile Access */}
        <div className="text-center mb-6">
          {showQR ? (
            <div className="p-4 bg-white border rounded-lg inline-block">
              <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Scan to access mobile portal</p>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowQR(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              Show QR Code for Mobile Access
            </Button>
          )}
        </div>

        {/* Mobile Preview */}
        <div className="border-4 border-slate-800 rounded-3xl p-2 bg-slate-800 max-w-xs mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Status Bar */}
            <div className="bg-slate-900 text-white text-xs py-1 px-4 flex justify-between">
              <span>9:41</span>
              <span>📶 🔋</span>
            </div>

            {/* App Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-700 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">{agent?.first_name || 'Agent'} {agent?.last_name || ''}</p>
                  <Badge className="bg-white/20 text-white text-xs">
                    {agent?.onboarding_status || 'Active'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 space-y-4">
              {/* Onboarding Progress */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Onboarding</span>
                  <span className="text-xs text-teal-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-center">
                  <DollarSign className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-xs font-medium text-emerald-700">${(totalCommission / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-emerald-600">Earned</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-center">
                  <Shield className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-xs font-medium text-blue-700">{activeLicenses}</p>
                  <p className="text-[10px] text-blue-600">Licenses</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg text-center">
                  <CheckCircle className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                  <p className="text-xs font-medium text-purple-700">{completedItems}</p>
                  <p className="text-[10px] text-purple-600">Tasks Done</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button className="w-full h-9 text-xs bg-teal-600">
                  <Upload className="w-3 h-3 mr-2" />
                  Upload Document
                </Button>
                <Button variant="outline" className="w-full h-9 text-xs">
                  <FileText className="w-3 h-3 mr-2" />
                  View Checklist
                </Button>
                <Button variant="outline" className="w-full h-9 text-xs">
                  <Calendar className="w-3 h-3 mr-2" />
                  Training Schedule
                </Button>
              </div>

              {/* Notifications */}
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-700">2 pending tasks</span>
                </div>
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="border-t flex justify-around py-2">
              <div className="text-center">
                <User className="w-5 h-5 mx-auto text-teal-600" />
                <span className="text-[10px] text-teal-600">Home</span>
              </div>
              <div className="text-center">
                <FileText className="w-5 h-5 mx-auto text-slate-400" />
                <span className="text-[10px] text-slate-400">Docs</span>
              </div>
              <div className="text-center">
                <DollarSign className="w-5 h-5 mx-auto text-slate-400" />
                <span className="text-[10px] text-slate-400">Earnings</span>
              </div>
              <div className="text-center">
                <Bell className="w-5 h-5 mx-auto text-slate-400" />
                <span className="text-[10px] text-slate-400">Alerts</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          Native iOS/Android app with push notifications
        </p>
      </CardContent>
    </Card>
  );
}