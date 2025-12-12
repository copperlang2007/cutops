import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, User, Loader2 } from 'lucide-react';

export default function NewConversationModal({ 
  open, 
  onClose, 
  users = [], 
  agents = [],
  onCreateDirect, 
  onCreateGroup,
  isLoading 
}) {
  const [tab, setTab] = useState('direct');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const allParticipants = [
    ...users.map(u => ({ email: u.email, name: u.full_name, type: 'user' })),
    ...agents.map(a => ({ email: a.email, name: `${a.first_name} ${a.last_name}`, type: 'agent' }))
  ].filter((p, i, arr) => arr.findIndex(x => x.email === p.email) === i);

  const filtered = allParticipants.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user) => {
    if (tab === 'direct') {
      onCreateDirect(user);
      handleClose();
    } else {
      setSelectedUsers(prev => 
        prev.find(u => u.email === user.email)
          ? prev.filter(u => u.email !== user.email)
          : [...prev, user]
      );
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length < 2 || !groupName.trim()) return;
    onCreateGroup(groupName.trim(), selectedUsers);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUsers([]);
    setGroupName('');
    setTab('direct');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="direct">
              <User className="w-4 h-4 mr-2" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group">
              <Users className="w-4 h-4 mr-2" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users or agents..."
              className="pl-10"
            />
          </div>

          <TabsContent value="direct" className="mt-0">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map(user => (
                <button
                  key={user.email}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-sm font-semibold">
                      {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="group" className="mt-0">
            <div className="space-y-4">
              <div>
                <Label>Group Name</Label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                />
              </div>

              <div>
                <Label>Select Members ({selectedUsers.length} selected)</Label>
                <div className="max-h-48 overflow-y-auto space-y-1 mt-2 border rounded-lg p-2 dark:border-slate-700">
                  {filtered.map(user => (
                    <label
                      key={user.email}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedUsers.some(u => u.email === user.email)}
                        onCheckedChange={() => handleSelectUser(user)}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs font-semibold">
                          {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateGroup}
                disabled={selectedUsers.length < 2 || !groupName.trim() || isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                Create Group ({selectedUsers.length} members)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}