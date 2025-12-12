import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileCheck, CheckCircle, Clock, XCircle, RefreshCw, Plus } from "lucide-react"
import { format } from "date-fns"

const appointmentStatusConfig = {
  appointed: { label: 'Appointed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600', icon: Clock },
  terminated: { label: 'Terminated', color: 'bg-red-100 text-red-700', icon: XCircle },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const rtsStatusConfig = {
  ready_to_sell: { label: 'Ready to Sell', color: 'bg-emerald-100 text-emerald-700' },
  pending_training: { label: 'Training Required', color: 'bg-amber-100 text-amber-700' },
  pending_certification: { label: 'Cert Required', color: 'bg-amber-100 text-amber-700' },
  not_ready: { label: 'Not Ready', color: 'bg-slate-100 text-slate-600' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700' }
};

export default function AppointmentTable({ appointments, onSync, onAdd, isSyncing }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-600" />
            Carrier Appointments
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSync}
              disabled={isSyncing}
              className="text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Sunfire
            </Button>
            <Button 
              size="sm" 
              onClick={onAdd}
              className="bg-teal-600 hover:bg-teal-700 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {appointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No carrier appointments found</p>
            <p className="text-sm mt-1">Click "Sync Sunfire" to fetch appointments or add manually</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Carrier</TableHead>
                <TableHead>Appointment Status</TableHead>
                <TableHead>RTS Status</TableHead>
                <TableHead>States</TableHead>
                <TableHead>Cert Expiration</TableHead>
                <TableHead>Sunfire Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => {
                const aptStatus = appointmentStatusConfig[appointment.appointment_status] || appointmentStatusConfig.not_started;
                const rtsStatus = rtsStatusConfig[appointment.rts_status] || rtsStatusConfig.not_ready;
                const AptIcon = aptStatus.icon;

                return (
                  <TableRow key={appointment.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-800">{appointment.carrier_name}</p>
                        {appointment.writing_number && (
                          <p className="text-xs text-slate-500 font-mono">#{appointment.writing_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${aptStatus.color} border-0`}>
                        <AptIcon className="w-3 h-3 mr-1" />
                        {aptStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${rtsStatus.color} border-0`}>
                        {rtsStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {appointment.states?.slice(0, 3).map(state => (
                          <Badge key={state} variant="outline" className="text-xs bg-slate-50">
                            {state}
                          </Badge>
                        ))}
                        {appointment.states?.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-slate-50">
                            +{appointment.states.length - 3}
                          </Badge>
                        )}
                        {!appointment.states?.length && (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {appointment.product_certification_expiration ? (
                        <span className="text-sm text-slate-800">
                          {format(new Date(appointment.product_certification_expiration), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {appointment.sunfire_synced ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Synced
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0">
                          Not Synced
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}