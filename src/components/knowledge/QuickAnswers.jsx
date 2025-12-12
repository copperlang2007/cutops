import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const FAQ_ITEMS = [
  {
    question: "When is the Annual Enrollment Period?",
    answer: "The Annual Enrollment Period (AEP) runs from October 15 through December 7 each year. During this time, Medicare beneficiaries can make changes to their Medicare Advantage or Part D plans.",
    tags: ['AEP', 'enrollment']
  },
  {
    question: "What is the Medicare Part B premium for 2024?",
    answer: "The standard Part B premium for 2024 is $174.70 per month. However, higher-income beneficiaries may pay more based on income-related monthly adjustment amounts (IRMAA).",
    tags: ['Part B', 'premium']
  },
  {
    question: "What triggers a Special Enrollment Period?",
    answer: "Common SEP triggers include: moving to a new service area, losing employer coverage, qualifying for Medicaid, moving into or out of a skilled nursing facility, and other qualifying life events.",
    tags: ['SEP', 'enrollment']
  },
  {
    question: "What's the difference between Original Medicare and Medicare Advantage?",
    answer: "Original Medicare (Parts A & B) is the federal program covering hospital and medical insurance. Medicare Advantage (Part C) is offered by private insurers and typically includes additional benefits like dental, vision, and drug coverage.",
    tags: ['MA', 'Original Medicare']
  },
  {
    question: "How long is the Medicare Advantage Open Enrollment Period?",
    answer: "The MA Open Enrollment Period runs from January 1 through March 31. During this time, beneficiaries enrolled in a Medicare Advantage plan can switch to another MA plan or return to Original Medicare.",
    tags: ['OEP', 'enrollment']
  }
];

export default function QuickAnswers() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          Quick Answers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-1">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 pr-2">
                  {item.question}
                </span>
                {expandedIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {expandedIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-3 pb-3">
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {item.answer}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}