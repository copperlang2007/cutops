
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { 
  LayoutDashboard, Users, Building2, FileSignature, FileText, 
  BarChart3, CheckSquare, Bell, Trophy, BookOpen, MessageSquare,
  DollarSign, Settings, ChevronLeft, ChevronRight, Shield, Menu,
  Eye, UserCog, Briefcase, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserRole } from '@/components/shared/RoleGuard'
import AssistantChat from '@/components/ai/AssistantChat';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { base44 } from '@/api/base44Client'

const menuGroups = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
      { name: 'Coaching', icon: Trophy, page: 'Coaching' },
      { name: 'Agents', icon: Users, page: 'Agents' },
      { name: 'Clients', icon: Shield, page: 'ClientManagement' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { name: 'Carriers', icon: Building2, page: 'Carriers' },
      { name: 'Contracts', icon: FileSignature, page: 'Contracts' },
      { name: 'Documents', icon: FileText, page: 'Documents' },
      { name: 'Tasks', icon: CheckSquare, page: 'Tasks' },
      { name: 'Agency Commissions', icon: DollarSign, page: 'AgencyCommissions' },
    ]
  },
  {
    label: 'Insights',
    items: [
      { name: 'Reports', icon: BarChart3, page: 'Reports' },
      { name: 'Commissions', icon: DollarSign, page: 'Commissions' },
      { name: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
    ]
  },
  {
    label: 'Resources',
    items: [
      { name: 'Knowledge', icon: BookOpen, page: 'KnowledgeBase' },
      { name: 'Messages', icon: MessageSquare, page: 'Messages' },
      { name: 'Alerts', icon: Bell, page: 'Alerts' },
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const { roleType, isSuperAdmin, isAgencyAdmin, isAgent } = useUserRole();

  const showExpanded = isExpanded || isPinned;

  const toggleGroup = (groupLabel) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  // Portal pages don't show the sidebar
  const portalPages = ['ClientPortal', 'PortalSignup'];
  if (portalPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // Dynamic menu based on role
  const getDynamicMenu = () => {
    if (isSuperAdmin) {
      return [
        {
          label: 'Super Admin',
          items: [
            { name: 'Super Admin Panel', icon: Shield, page: 'SuperAdminPanel' },
            { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
          ]
        },
        {
          label: 'Management',
          items: [
            { name: 'Agents', icon: Users, page: 'Agents' },
            { name: 'Clients', icon: Shield, page: 'ClientManagement' },
            { name: 'Agencies', icon: Briefcase, page: 'AgencyManagement' },
            { name: 'Carriers', icon: Building2, page: 'Carriers' },
          ]
        },
        {
          label: 'Operations',
          items: [
            { name: 'Contracts', icon: FileSignature, page: 'Contracts' },
            { name: 'Agency Agreements', icon: FileSignature, page: 'AgencyAgreements' },
            { name: 'Compliance', icon: Shield, page: 'AgreementCompliance' },
            { name: 'Hierarchy', icon: Briefcase, page: 'AgencyHierarchy' },
            { name: 'Documents', icon: FileText, page: 'Documents' },
            { name: 'Tasks', icon: CheckSquare, page: 'Tasks' },
            { name: 'Automation', icon: Zap, page: 'Automation' },
            { name: 'Agency Commissions', icon: DollarSign, page: 'AgencyCommissions' },
          ]
        },
        {
          label: 'Insights',
          items: [
            { name: 'Reports', icon: BarChart3, page: 'Reports' },
            { name: 'Commissions', icon: DollarSign, page: 'Commissions' },
            { name: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
          ]
        },
        {
          label: 'Marketing',
          items: [
            { name: 'Campaigns', icon: Zap, page: 'CampaignManager' },
          ]
        },
        {
          label: 'Resources',
          items: [
            { name: 'Coaching', icon: Trophy, page: 'Coaching' },
            { name: 'Training', icon: BookOpen, page: 'Training' },
            { name: 'Knowledge', icon: BookOpen, page: 'KnowledgeBase' },
            { name: 'Messages', icon: MessageSquare, page: 'Messages' },
            { name: 'Alerts', icon: Bell, page: 'Alerts' },
          ]
        }
      ];
    } else if (isAgencyAdmin) {
      return [
        {
          label: 'Main',
          items: [
            { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
            { name: 'Coaching', icon: Trophy, page: 'Coaching' },
            { name: 'Staff Management', icon: UserCog, page: 'StaffManagement' },
          ]
        },
        {
          label: 'Operations',
          items: [
            { name: 'Agents', icon: Users, page: 'Agents' },
            { name: 'Clients', icon: Shield, page: 'ClientManagement' },
            { name: 'Carriers', icon: Building2, page: 'Carriers' },
            { name: 'Contracts', icon: FileSignature, page: 'Contracts' },
            { name: 'Documents', icon: FileText, page: 'Documents' },
            { name: 'Agency Commissions', icon: DollarSign, page: 'AgencyCommissions' },
          ]
        },
        {
          label: 'Insights',
          items: [
            { name: 'Reports', icon: BarChart3, page: 'Reports' },
            { name: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
          ]
        }
      ];
    } else {
      return [
        {
          label: 'Main',
          items: [
            { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
            { name: 'Coaching', icon: Trophy, page: 'Coaching' },
            { name: 'Clients', icon: Shield, page: 'ClientManagement' },
            { name: 'Staff Management', icon: UserCog, page: 'StaffManagement' },
          ]
        },
        {
          label: 'Resources',
          items: [
            { name: 'Coaching', icon: Trophy, page: 'Coaching' },
            { name: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
            { name: 'Knowledge', icon: BookOpen, page: 'KnowledgeBase' },
          ]
        }
      ];
    }
  };

  const menuGroups = getDynamicMenu();

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-300 ease-out",
          showExpanded ? "w-56" : "w-16"
        )}
        onMouseEnter={() => !isPinned && setIsExpanded(true)}
        onMouseLeave={() => !isPinned && setIsExpanded(false)}
      >
        {/* Logo & Theme Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {showExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-slate-800 dark:text-white whitespace-nowrap overflow-hidden"
                >
                  AgentHub
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {showExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <ThemeToggle />
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isPinned 
                      ? "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  )}
                  title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                >
                  {isPinned ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-4 overflow-y-auto h-[calc(100%-8rem)]">
          {menuGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.label] && !isExpanded;

            return (
              <div key={group.label}>
                <AnimatePresence>
                  {showExpanded && (
                    <motion.button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {group.label}
                      <ChevronRight className={cn(
                        "w-3 h-3 transition-transform",
                        isGroupCollapsed ? "" : "rotate-90"
                      )} />
                    </motion.button>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {!isGroupCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const isActive = currentPageName === item.page;
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                              isActive 
                                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30" 
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                          >
                            <Icon className={cn(
                              "w-5 h-5 shrink-0 transition-transform",
                              isActive ? "" : "group-hover:scale-110"
                            )} />
                            <AnimatePresence>
                              {showExpanded && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  className="text-sm font-medium whitespace-nowrap"
                                >
                                  {item.name}
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {/* Tooltip for collapsed state */}
                            {!showExpanded && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                                {item.name}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <button
            onClick={() => base44.auth.logout()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <AnimatePresence>
              {showExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
        </motion.aside>

      {/* Main Content */}
      <main 
        className={cn(
          "transition-all duration-300 ease-out h-screen overflow-y-auto",
          showExpanded ? "ml-56" : "ml-16"
        )}
      >
        <div className="min-h-full w-full">
          {children}
        </div>
      </main>

      {/* AI Assistant Chat */}
      <AssistantChat />
      </div>
      );
      }
