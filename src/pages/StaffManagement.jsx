import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Plus, Trash2, Edit, Shield, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '../components/shared/RoleGuard';

const PERMISSION_PRESETS = {
  read_only: {
    agents: { read: true, write: false, delete: false },
    clients: { read: true, write: false, delete: false },
    carriers: { read: true, write: false, delete: false },
    contracts: { read: true, write: false, delete: false },
    documents: { read: true, write: false, delete: false },
    commissions: { read: true, write: false, delete: false },
    reports: { read: true, write: false }
  },
  standard: {
    agents: { read: true, write: true, delete: false },
    clients: { read: true, write: true, delete: false },
    carriers: { read: true, write: false, delete: false },
    contracts: { read: true, write: true, delete: false },
    documents: { read: true, write: true, delete: false },
    commissions: { read: true, write: false, delete: false },
    reports: { read: true, write: false }
  },
  full_access: {
    agents: { read: true, write: true, delete: true },
    clients: { read: true, write: true, delete: true },
    carriers: { read: true, write: true, delete: true },
    contracts: { read: true, write: true, delete: true },
    documents: { read: true, write: true, delete: true },
    commissions: { read: true, write: true, delete: true },
    reports: { read: true, write: true }
  }
};

export default function StaffManagement() {
  const queryClient = useQueryClient();
  const { user, roleType, agency, permissions: currentUserPerms } = useUserRole();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    user_email: '',
    permissions: PERMISSION_PRESETS.read_only,
    can_manage_staff: false
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staffMembers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.UserPermission.filter({
        parent_user_email: user.email,
        active: true
      });
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const staffRole = roleType === 'agency_admin' || roleType === 'agency_staff' 
        ? 'agency_staff' 
        : 'agent_staff';

      return await base44.entities.UserPermission.create({
        ...data,
        role_type: staffRole,
        agency_id: agency?.id,
        agent_id: currentUserPerms?.agent_id,
        parent_user_email: user.email,
        active: true,
        can_view_upstream: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffMembers']);
      toast.success('Staff member added successfully');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to add staff member');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.UserPermission.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffMembers']);
      toast.success('Staff permissions updated');
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.UserPermission.update(id, { active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffMembers']);
      toast.success('Staff member removed');
    }
  });

  const resetForm = () => {
    setFormData({
      user_email: '',
      permissions: PERMISSION_PRESETS.read_only,
      can_manage_staff: false
    });
    setEditingStaff(null);
  };

  const handleSubmit = () => {
    if (!formData.user_email) {
      toast.error('Please enter an email address');
      return;
    }

    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      user_email: staff.user_email,
      permissions: staff.permissions,
      can_manage_staff: staff.can_manage_staff
    });
    setShowModal(true);
  };

  const applyPreset = (presetName) => {
    setFormData({
      ...formData,
      permissions: PERMISSION_PRESETS[presetName]
    });
  };

  const togglePermission = (resource, action) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [resource]: {
          ...formData.permissions[resource],
          [action]: !formData.permissions[resource]?.[action]
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-teal-600" />
              Staff Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage staff credentials and permissions
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Staff List */}
        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Active Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            {staffMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No staff members added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {staffMembers.map(staff => (
                  <div key={staff.id} className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{staff.user_email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {staff.role_type?.replace(/_/g, ' ')}
                        </Badge>
                        {staff.can_manage_staff && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            Can Manage Staff
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(staff)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteMutation.mutate(staff.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Edit Staff Permissions' : 'Add Staff Member'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label>Email Address</Label>
                <Input
                  value={formData.user_email}
                  onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                  placeholder="staff@example.com"
                  disabled={!!editingStaff}
                />
              </div>

              <div>
                <Label className="mb-2 block">Permission Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => applyPreset('read_only')}
                    className="w-full"
                  >
                    Read Only
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => applyPreset('standard')}
                    className="w-full"
                  >
                    Standard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => applyPreset('full_access')}
                    className="w-full"
                  >
                    Full Access
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Custom Permissions</Label>
                <div className="space-y-3">
                  {Object.keys(formData.permissions).map(resource => (
                    <div key={resource} className="p-3 rounded-lg border dark:border-slate-700">
                      <p className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2 capitalize">
                        {resource.replace(/_/g, ' ')}
                      </p>
                      <div className="flex gap-4">
                        {Object.keys(formData.permissions[resource]).map(action => (
                          <label key={action} className="flex items-center gap-2 cursor-pointer">
                            <Switch
                              checked={formData.permissions[resource][action]}
                              onCheckedChange={() => togglePermission(resource, action)}
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                              {action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border dark:border-slate-700">
                <Switch
                  checked={formData.can_manage_staff}
                  onCheckedChange={(v) => setFormData({...formData, can_manage_staff: v})}
                />
                <Label>Can manage other staff members</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {editingStaff ? 'Update' : 'Add'} Staff Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}