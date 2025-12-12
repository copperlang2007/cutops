import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, CheckCircle, Loader2, ArrowRight, 
  Pill, Stethoscope, DollarSign, Calendar, FileText, Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

const features = [
  { icon: Pill, title: 'Drug Lookup & Interactions', desc: 'Check medication coverage and safety' },
  { icon: Stethoscope, title: 'Find Doctors', desc: 'Search in-network providers' },
  { icon: DollarSign, title: 'Benefits Assistance', desc: 'Find programs to reduce costs' },
  { icon: Calendar, title: 'Appointment Scheduling', desc: 'Book time with a licensed agent' },
  { icon: FileText, title: 'Plan Comparison', desc: 'Compare Medicare plans in your area' },
  { icon: Heart, title: 'Benefit Tracking', desc: 'Monitor your healthcare usage' },
];

export default function PortalSignup() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    zip_code: '',
    date_of_birth: '',
    has_medicare: 'unknown',
    current_carrier: '',
    interests: [],
    agree_terms: false
  });

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      const portalUser = await base44.entities.PortalUser.create({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        zip_code: data.zip_code,
        date_of_birth: data.date_of_birth,
        current_carrier: data.current_carrier,
        plan_type: data.has_medicare === 'yes' ? 'unknown' : 'none',
        user_type: 'lead',
        lead_source: 'portal_signup',
        interests: data.interests,
        conversion_status: 'new_lead'
      });
      return portalUser;
    },
    onSuccess: (portalUser) => {
      toast.success('Account created! Welcome to the portal.');
      window.location.href = createPageUrl('ClientPortal') + `?userId=${portalUser.id}`;
    },
    onError: (error) => {
      toast.error('Something went wrong. Please try again.');
      console.error(error);
    }
  });

  const handleSubmit = () => {
    if (!formData.agree_terms) {
      toast.error('Please agree to the terms to continue');
      return;
    }
    signupMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Medicare Benefits Portal</h1>
          </div>
          <p className="text-teal-100 text-lg max-w-2xl mx-auto">
            Your free resource for Medicare information, plan comparison, and benefits assistance.
            No obligation, no pressure.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 -mt-8">
        {step === 0 ? (
          <>
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-0 shadow-sm dark:bg-slate-800 h-full">
                    <CardContent className="p-4">
                      <feature.icon className="w-8 h-8 text-teal-600 mb-3" />
                      <h3 className="font-semibold text-slate-800 dark:text-white">{feature.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Sign Up CTA */}
            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                  Get Started Free
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                  Create your free account to access all tools. Compare plans, find benefits you may qualify for, and connect with licensed agents when you're ready.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setStep(1)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-slate-400 mt-4">
                  Already have an account? <a href={createPageUrl('ClientPortal')} className="text-teal-600 hover:underline">Sign in</a>
                </p>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                100% Free
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No Obligation
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Licensed Agents
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Secure & Private
              </span>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg dark:bg-slate-800 max-w-xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="w-6 h-6 text-teal-600" />
                  Create Your Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ZIP Code *</Label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => updateField('zip_code', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => updateField('date_of_birth', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Are you currently enrolled in Medicare?</Label>
                  <Select 
                    value={formData.has_medicare} 
                    onValueChange={(v) => updateField('has_medicare', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, I have Medicare</SelectItem>
                      <SelectItem value="no">No, but I&apos;m eligible soon</SelectItem>
                      <SelectItem value="unknown">I&apos;m not sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.has_medicare === 'yes' && (
                  <div>
                    <Label>Current Insurance Carrier (Optional)</Label>
                    <Input
                      value={formData.current_carrier}
                      onChange={(e) => updateField('current_carrier', e.target.value)}
                      placeholder="e.g., Humana, Aetna, UnitedHealthcare"
                    />
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">What are you most interested in?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Plan Comparison',
                      'Drug Coverage',
                      'Finding Doctors',
                      'Cost Assistance',
                      'Benefits Help',
                      'Talk to Agent'
                    ].map(interest => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={() => toggleInterest(interest)}
                        />
                        <Label htmlFor={interest} className="text-sm">{interest}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agree_terms}
                    onCheckedChange={(c) => updateField('agree_terms', c)}
                  />
                  <Label htmlFor="terms" className="text-xs text-slate-500 leading-tight">
                    I agree to the Terms of Service and Privacy Policy. I understand that a licensed agent may contact me about Medicare options.
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.first_name || !formData.last_name || !formData.email || !formData.zip_code || signupMutation.isPending}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}