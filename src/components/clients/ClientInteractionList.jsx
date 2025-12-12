import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, Mail, Video, MessageSquare, Calendar, 
  FileText, Plus, ChevronRight 
} from 'lucide-react';
import { format } from 'date-fns';
import ClientInteractionModal from './ClientInteractionModal';

const interactionIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  text_message: MessageSquare,
  video_call: Video,
  note: FileText,
  follow_up: ChevronRight
};

const outcomeColors = {
  successful: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  issue_resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  sale_closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  follow_up_needed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  callback_requested: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  no_answer: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400',
  voicemail: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400',
  not_interested: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export default function ClientInteractionList({ clientId, interactions, onAddNew }) {
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (interaction) => {
    setSelectedInteraction(interaction);
    setShowModal(true);
  };

  return (
    <>
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Interaction History</CardTitle>
          <Button onClick={onAddNew} size="sm" className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-1" />
            Log Interaction
          </Button>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No interactions logged yet
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.map((interaction) => {
                const Icon = interactionIcons[interaction.interaction_type] || FileText;
                
                return (
                  <div
                    key={interaction.id}
                    className="p-4 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors cursor-pointer"
                    onClick={() => handleEdit(interaction)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                        <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {interaction.subject}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {interaction.interaction_type.replace(/_/g, ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {interaction.direction}
                              </Badge>
                              {interaction.outcome && (
                                <Badge className={`text-xs ${outcomeColors[interaction.outcome] || 'bg-slate-100'}`}>
                                  {interaction.outcome.replace(/_/g, ' ')}
                                </Badge>
                              )}
                              {interaction.sentiment && interaction.sentiment !== 'neutral' && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    interaction.sentiment === 'positive' ? 'border-green-300 text-green-700' :
                                    interaction.sentiment === 'negative' ? 'border-red-300 text-red-700' : ''
                                  }`}
                                >
                                  {interaction.sentiment}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {format(new Date(interaction.interaction_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {format(new Date(interaction.interaction_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        
                        {interaction.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                            {interaction.notes}
                          </p>
                        )}

                        {interaction.duration_minutes > 0 && (
                          <p className="text-xs text-slate-500 mt-2">
                            Duration: {interaction.duration_minutes} minutes
                          </p>
                        )}

                        {interaction.follow_up_required && interaction.follow_up_date && (
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                            <span className="text-amber-700 dark:text-amber-400">
                              Follow-up needed: {format(new Date(interaction.follow_up_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <ClientInteractionModal
          clientId={clientId}
          interaction={selectedInteraction}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedInteraction(null);
          }}
        />
      )}
    </>
  );
}