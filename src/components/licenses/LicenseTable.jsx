import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Plus } from "lucide-react"
import { format, differenceInDays } from "date-fns"

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  revoked: { label: 'Revoked', color: 'bg-red-100 text-red-700', icon: XCircle },
  suspended: { label: 'Suspended', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle }
};

export default function LicenseTable({ licenses, onSync, onAdd, isSyncing }) {
  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return null;
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days < 0) return { label: 'Expired', color: 'text-red-600' };
    if (days <= 30) return { label: `${days}d left`, color: 'text-red-500' };
    if (days <= 60) return { label: `${days}d left`, color: 'text-amber-500' };
    return { label: `${days}d left`, color: 'text-slate-500' };
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            State Licenses
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
              Sync NIPR
            </Button>
            <Button 
              size="sm" 
              onClick={onAdd}
              className="bg-teal-600 hover:bg-teal-700 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add License
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {licenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No licenses found</p>
            <p className="text-sm mt-1">Click "Sync NIPR" to fetch licenses or add manually</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>State</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>NIPR Verified</TableHead>
                <TableHead>Adverse Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const status = statusConfig[license.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const expStatus = getExpirationStatus(license.expiration_date);

                return (
                  <TableRow key={license.id} className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-800">
                      {license.state}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {license.license_number}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 capitalize">
                      {license.license_type?.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${status.color} border-0`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-800">
                          {license.expiration_date 
                            ? format(new Date(license.expiration_date), 'MMM d, yyyy')
                            : '—'}
                        </span>
                        {expStatus && (
                          <span className={`text-xs font-medium ${expStatus.color}`}>
                            {expStatus.label}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.nipr_verified ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0">
                          Not Verified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.adverse_actions ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 border-0">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Found
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">None</span>
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