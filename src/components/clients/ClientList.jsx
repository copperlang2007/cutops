import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Plus, Search, Phone, Mail, Calendar, Star, 
  ChevronRight, Filter, AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  prospect: 'bg-blue-100 text-blue-700',
  inactive: 'bg-slate-100 text-slate-600',
  churned: 'bg-red-100 text-red-700'
};

export default function ClientList({ 
  clients, 
  onSelectClient, 
  onAddClient,
  isLoading 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const filteredClients = clients
    .filter(c => {
      const matchesSearch = `${c.first_name} ${c.last_name} ${c.email || ''} ${c.phone || ''}`
        .toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.last_contact_date || b.created_date) - new Date(a.last_contact_date || a.created_date);
      }
      if (sortBy === 'name') {
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      }
      if (sortBy === 'follow_up') {
        if (!a.next_follow_up) return 1;
        if (!b.next_follow_up) return -1;
        return new Date(a.next_follow_up) - new Date(b.next_follow_up);
      }
      return 0;
    });

  const needsFollowUp = (client) => {
    if (!client.next_follow_up) return false;
    return differenceInDays(new Date(client.next_follow_up), new Date()) <= 0;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Clients
            <Badge variant="secondary" className="ml-2">{clients.length}</Badge>
          </CardTitle>
          <Button size="sm" onClick={onAddClient} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-1" />
            Add Client
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="follow_up">Follow-up Due</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No clients found</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredClients.map((client, idx) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => onSelectClient(client)}
                  className="p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm">
                        {client.first_name?.[0]}{client.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 truncate">
                          {client.first_name} {client.last_name}
                        </p>
                        <Badge variant="outline" className={statusColors[client.status]}>
                          {client.status}
                        </Badge>
                        {needsFollowUp(client) && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Follow-up
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </span>
                        )}
                        {client.satisfaction_score && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" />
                            {client.satisfaction_score}/10
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      {client.carrier && (
                        <p className="text-xs font-medium text-slate-600">{client.carrier}</p>
                      )}
                      {client.last_contact_date && (
                        <p className="text-xs text-slate-400">
                          Last: {format(new Date(client.last_contact_date), 'MMM d')}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}