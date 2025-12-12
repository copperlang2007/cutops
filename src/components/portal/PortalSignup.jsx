import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Shield, User, Mail, Phone, MapPin, Calendar,
  CheckCircle, Loader2, ArrowRight, Star
} from 'lucide-react';
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const features = [
  { icon: Shield, title: 'Plan Comparison', desc: 'Compare Medicare plans side by side' },
  { icon: Star, title: 'Benefits Check', desc: 'See if you qualify for extra help' },
  { icon: Calendar, title: 'Appointment Booking', desc: 'Schedule time with an agent' },
  { icon: CheckCircle, title: 'Free Resources', desc: 'Access guides and tools' }
];

export default function PortalSignup({ onSignupComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    zip_code: '',
    date_of_birth: '',
    interests: [],
    has_medicare: null,
    consent: false
  });

  const interestOptions = [
    'Compare Medicare Advantage Plans',
    'Find Extra Help / LIS Benefits',
    'Check Prescription Drug Costs',
    'Find In-Network Doctors',
    'Understand My Current Plan',
    'Speak with an Agent'
  ];

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      // Create portal user
      const portalUser = await base44.entities.PortalUser.create({
        user_type: 'lead',
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        zip_code: data.zip_code,
        date_of_birth: data.date_of_birth,
        interests: data.interests,
        lead_source: 'portal_signup',
        conversion_status: 'new_lead'
      });
      return portalUser;
    },
    onSuccess: (data) => {
      toast.success('Account created successfully!');
      if (onSignupComplete) {
        onSignupComplete(data);
      }
    },
    onError: (error) => {
      toast.error('Failed to create account. Please try again.');
      console.error(error);
    }
  });

  const handleSubmit = () => {
    if (!formData.consent) {
      toast.error('Please agree to the terms to continue');
      return;
    }
    signupMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Medicare Benefits Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Free tools to help you find the best Medicare coverage
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
              What You'll Get Access To
            </h2>
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}

            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
              <p className="font-semibold mb-1">100% Free • No Obligation</p>
              <p className="text-teal-100 text-sm">
                Get personalized recommendations with no pressure to enroll.
              </p>
            </div>
          </motion.div>

          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create Your Free Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name *</Label>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                          placeholder="Smith"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>ZIP Code *</Label>
                        <Input
                          value={formData.zip_code}
                          onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                          placeholder="12345"
                        />
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => setStep(2)}
                      disabled={!formData.first_name || !formData.last_name || !formData.email || !formData.zip_code}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <Label className="text-base">What are you interested in?</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Select all that apply</p>
                      <div className="space-y-2">
                        {interestOptions.map((interest) => (
                          <label 
                            key={interest}
                            className="flex items-center gap-3 p-3 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={formData.interests.includes(interest)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({...formData, interests: [...formData.interests, interest]});
                                } else {
                                  setFormData({...formData, interests: formData.interests.filter(i => i !== interest)});
                                }
                              }}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base">Do you currently have Medicare?</Label>
                      <div className="flex gap-3 mt-2">
                        <Button
                          type="button"
                          variant={formData.has_medicare === true ? 'default' : 'outline'}
                          onClick={() => setFormData({...formData, has_medicare: true})}
                          className={formData.has_medicare === true ? 'bg-teal-600' : ''}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={formData.has_medicare === false ? 'default' : 'outline'}
                          onClick={() => setFormData({...formData, has_medicare: false})}
                          className={formData.has_medicare === false ? 'bg-teal-600' : ''}
                        >
                          No
                        </Button>
                        <Button
                          type="button"
                          variant={formData.has_medicare === 'soon' ? 'default' : 'outline'}
                          onClick={() => setFormData({...formData, has_medicare: 'soon'})}
                          className={formData.has_medicare === 'soon' ? 'bg-teal-600' : ''}
                        >
                          Turning 65 Soon
                        </Button>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <Checkbox
                        checked={formData.consent}
                        onCheckedChange={(checked) => setFormData({...formData, consent: checked})}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        I agree to receive communications about Medicare plans and benefits. 
                        I understand my information will be handled according to the privacy policy. 
                        I can unsubscribe at any time.
                      </span>
                    </label>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={!formData.consent || signupMutation.isPending}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        {signupMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Create Free Account
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                <p className="text-xs text-slate-400 text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}