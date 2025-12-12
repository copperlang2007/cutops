import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, Phone, Mail, MapPin, Calendar, FileText, Edit, 
  MessageSquare, Clock, DollarSign, Star, ArrowLeft, Trash2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns'

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  prospect: 'bg-blue-100 text-blue-700 border-blue-300',
  inactive: 'bg-slate-100 text-slate-600 border-slate-300',
  churned: 'bg-red-100 text-red-700 border-red-300'
};

export default function ClientDetail({ 
  client, 
  interactions,
  onBack, 
  onEdit, 
  onDelete,
  onLogInteraction,
  onSendEmail
}) {
  if (!client) return null;

  const recentInteractions = interactions.slice(0, 5);
  const daysSinceContact = client.last_contact_date 
    ? differenceInDays(new Date(), new Date(client.last_contact_date))
    : null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-red-600" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6 pt-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xl">
              {client.first_name?.[0]}{client.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-slate-800">
                {client.first_name} {client.last_name}
              </h2>
              <Badge variant="outline" className={statusColors[client.status]}>
                {client.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {client.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-slate-600 truncate">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {client.email}
                </div>
              )}
              {client.city && client.state && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {client.city}, {client.state}
                </div>
              )}
              {client.satisfaction_score && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Star className="w-4 h-4 text-amber-500" />
                  {client.satisfaction_score}/10 Satisfaction
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-teal-600">{interactions.length}</p>
            <p className="text-xs text-slate-500">Interactions</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">
              {daysSinceContact !== null ? daysSinceContact : '-'}
            </p>
            <p className="text-xs text-slate-500">Days Since Contact</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${client.premium?.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-slate-500">Premium</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">
              {client.renewal_date ? differenceInDays(new Date(client.renewal_date), new Date()) : '-'}
            </p>
            <p className="text-xs text-slate-500">Days to Renewal</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button size="sm" onClick={onLogInteraction} className="bg-teal-600 hover:bg-teal-700">
            <MessageSquare className="w-4 h-4 mr-1" />
            Log Interaction
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSendEmail(client)}>
            <Mail className="w-4 h-4 mr-1" />
            Send Email
          </Button>
          {client.phone && (
            <Button size="sm" variant="outline" onClick={() => window.open(`tel:${client.phone}`)}>
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
          )}
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Date of Birth</p>
                <p className="text-sm font-medium">
                  {client.date_of_birth ? format(new Date(client.date_of_birth), 'MMM d, yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Medicare ID</p>
                <p className="text-sm font-medium">{client.medicare_id || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Lead Source</p>
                <p className="text-sm font-medium capitalize">{client.lead_source?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Next Follow-up</p>
                <p className="text-sm font-medium">
                  {client.next_follow_up ? format(new Date(client.next_follow_up), 'MMM d, yyyy') : '-'}
                </p>
              </div>
            </div>
            {client.notes && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
            {client.tags?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {client.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="policy" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Carrier</p>
                <p className="text-sm font-medium">{client.carrier || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Plan Type</p>
                <p className="text-sm font-medium capitalize">{client.plan_type?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Current Plan</p>
                <p className="text-sm font-medium">{client.current_plan || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Premium</p>
                <p className="text-sm font-medium">${client.premium?.toLocaleString() || '0'}/mo</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Effective Date</p>
                <p className="text-sm font-medium">
                  {client.effective_date ? format(new Date(client.effective_date), 'MMM d, yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Renewal Date</p>
                <p className="text-sm font-medium">
                  {client.renewal_date ? format(new Date(client.renewal_date), 'MMM d, yyyy') : '-'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-3">
              {recentInteractions.length === 0 ? (
                <p className="text-center text-slate-400 py-4">No interactions recorded</p>
              ) : (
                recentInteractions.map(interaction => (
                  <div key={interaction.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {interaction.interaction_type}
                        </Badge>
                        <Badge variant="outline" className={
                          interaction.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                          interaction.sentiment === 'negative' ? 'bg-red-50 text-red-700' :
                          'bg-slate-50 text-slate-600'
                        }>
                          {interaction.sentiment}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(new Date(interaction.created_date), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    {interaction.subject && (
                      <p className="text-sm font-medium text-slate-700">{interaction.subject}</p>
                    )}
                    {interaction.notes && (
                      <p className="text-sm text-slate-600 mt-1">{interaction.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}