import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const RatingScale = ({ label, value, onChange, icon: Icon }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-teal-600" />}
        {label}
      </Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
              value === rating
                ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white scale-110 shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Not Satisfied</span>
        <span>Very Satisfied</span>
      </div>
    </div>
  );
};

export default function ClientSatisfactionSurvey({ surveyId, onComplete }) {
  const [responses, setResponses] = useState({
    overall_satisfaction: null,
    agent_rating: null,
    communication_rating: null,
    service_speed_rating: null,
    policy_clarity_rating: null,
    likelihood_to_recommend: null,
    feedback_comments: '',
    areas_of_concern: [],
    positive_highlights: []
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('automatedSurveyEngine', {
        action: 'submit_response',
        surveyId,
        responses
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      if (onComplete) onComplete(data);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit survey');
    }
  });

  const concernOptions = [
    'Communication speed',
    'Policy explanation',
    'Pricing concerns',
    'Coverage questions',
    'Claims process',
    'Customer service'
  ];

  const positiveOptions = [
    'Excellent communication',
    'Quick response time',
    'Clear explanations',
    'Professional service',
    'Great value',
    'Helpful guidance'
  ];

  const toggleArrayItem = (array, item, setFunc) => {
    const key = setFunc === 'concerns' ? 'areas_of_concern' : 'positive_highlights';
    if (array.includes(item)) {
      setResponses({ ...responses, [key]: array.filter(i => i !== item) });
    } else {
      setResponses({ ...responses, [key]: [...array, item] });
    }
  };

  const isValid = responses.overall_satisfaction && 
                  responses.agent_rating && 
                  responses.likelihood_to_recommend;

  if (submitted) {
    return (
      <Card className="clay-morphism border-0 max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Thank You!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Your feedback helps us serve you better.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="clay-morphism border-0 max-w-3xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">How Was Your Experience?</CardTitle>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Your feedback helps us improve our service
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <RatingScale
          label="Overall Satisfaction"
          value={responses.overall_satisfaction}
          onChange={(val) => setResponses({ ...responses, overall_satisfaction: val })}
          icon={ThumbsUp}
        />

        <RatingScale
          label="Agent Performance"
          value={responses.agent_rating}
          onChange={(val) => setResponses({ ...responses, agent_rating: val })}
          icon={Star}
        />

        <RatingScale
          label="Communication Quality"
          value={responses.communication_rating}
          onChange={(val) => setResponses({ ...responses, communication_rating: val })}
          icon={MessageSquare}
        />

        <RatingScale
          label="Service Speed"
          value={responses.service_speed_rating}
          onChange={(val) => setResponses({ ...responses, service_speed_rating: val })}
        />

        <RatingScale
          label="Policy Clarity"
          value={responses.policy_clarity_rating}
          onChange={(val) => setResponses({ ...responses, policy_clarity_rating: val })}
        />

        <RatingScale
          label="How Likely Are You to Recommend Us?"
          value={responses.likelihood_to_recommend}
          onChange={(val) => setResponses({ ...responses, likelihood_to_recommend: val })}
        />

        <div className="space-y-3">
          <Label className="text-sm font-medium">What Could Be Improved?</Label>
          <div className="grid grid-cols-2 gap-2">
            {concernOptions.map((option) => (
              <div key={option} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <Checkbox
                  id={`concern-${option}`}
                  checked={responses.areas_of_concern.includes(option)}
                  onCheckedChange={() => toggleArrayItem(responses.areas_of_concern, option, 'concerns')}
                />
                <Label htmlFor={`concern-${option}`} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">What Did You Appreciate Most?</Label>
          <div className="grid grid-cols-2 gap-2">
            {positiveOptions.map((option) => (
              <div key={option} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <Checkbox
                  id={`positive-${option}`}
                  checked={responses.positive_highlights.includes(option)}
                  onCheckedChange={() => toggleArrayItem(responses.positive_highlights, option, 'highlights')}
                />
                <Label htmlFor={`positive-${option}`} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Additional Comments</Label>
          <Textarea
            placeholder="Share your thoughts, suggestions, or any additional feedback..."
            value={responses.feedback_comments}
            onChange={(e) => setResponses({ ...responses, feedback_comments: e.target.value })}
            className="min-h-24"
          />
        </div>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={!isValid || submitMutation.isPending}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold py-6 text-lg"
        >
          {submitMutation.isPending ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}