import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertTriangle, Shield, FileText, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, differenceInDays } from 'date-fns'

export default function RegulatoryCalendar({ licenses, contracts, alerts, agents }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarEvents = useMemo(() => {
    const events = [];

    // License expirations
    licenses.forEach(l => {
      if (l.expiration_date) {
        const agent = agents.find(a => a.id === l.agent_id);
        events.push({
          date: new Date(l.expiration_date),
          type: 'license',
          title: `${l.state} License Expires`,
          agent: agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown',
          severity: differenceInDays(new Date(l.expiration_date), new Date()) <= 30 ? 'high' : 'medium'
        });
      }
    });

    // Contract expirations
    contracts.forEach(c => {
      if (c.expiration_date) {
        const agent = agents.find(a => a.id === c.agent_id);
        events.push({
          date: new Date(c.expiration_date),
          type: 'contract',
          title: `${c.carrier_name} Contract Expires`,
          agent: agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown',
          severity: differenceInDays(new Date(c.expiration_date), new Date()) <= 30 ? 'high' : 'medium'
        });
      }
    });

    // Add recurring compliance dates (demo)
    const now = new Date();
    events.push({
      date: new Date(now.getFullYear(), now.getMonth(), 15),
      type: 'compliance',
      title: 'AEP Preparation Check',
      agent: 'All Agents',
      severity: 'low'
    });
    events.push({
      date: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      type: 'training',
      title: 'Quarterly Training Due',
      agent: 'All Agents',
      severity: 'medium'
    });

    return events;
  }, [licenses, contracts, agents]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day) => {
    return calendarEvents.filter(e => isSameDay(e.date, day));
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return calendarEvents
      .filter(e => e.date >= now)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);
  }, [calendarEvents]);

  const eventTypeColors = {
    license: 'bg-red-100 border-red-300',
    contract: 'bg-blue-100 border-blue-300',
    compliance: 'bg-amber-100 border-amber-300',
    training: 'bg-purple-100 border-purple-300'
  };

  const eventTypeIcons = {
    license: Shield,
    contract: FileText,
    compliance: AlertTriangle,
    training: Clock
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Regulatory Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mini Calendar */}
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs text-slate-500 font-medium">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Padding for first week */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} className="h-8" />
            ))}
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDay(day);
              const hasHighPriority = dayEvents.some(e => e.severity === 'high');
              return (
                <div 
                  key={day.toISOString()} 
                  className={`h-8 rounded flex flex-col items-center justify-center text-xs relative ${
                    isToday(day) ? 'bg-teal-100 font-bold' : ''
                  } ${!isSameMonth(day, currentMonth) ? 'text-slate-300' : ''}`}
                >
                  {format(day, 'd')}
                  {dayEvents.length > 0 && (
                    <div className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${
                      hasHighPriority ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Upcoming Deadlines</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {upcomingEvents.map((event, i) => {
              const Icon = eventTypeIcons[event.type] || Calendar;
              const daysUntil = differenceInDays(event.date, new Date());
              return (
                <div key={i} className={`p-2 rounded-lg border ${eventTypeColors[event.type]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{event.title}</span>
                    </div>
                    <Badge variant="outline" className={
                      daysUntil <= 7 ? 'bg-red-100 text-red-700' :
                      daysUntil <= 30 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }>
                      {daysUntil} days
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{event.agent}</span>
                    <span>{format(event.date, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              );
            })}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No upcoming deadlines</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-4 pt-3 border-t flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            <span>Licenses</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
            <span>Contracts</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
            <span>Compliance</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
            <span>Training</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}