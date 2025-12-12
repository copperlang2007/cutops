import Layout from "./Layout.jsx";

import Home from "./Home";

import AIContentCreator from "./AIContentCreator";

import AddAgent from "./AddAgent";

import AddCarrier from "./AddCarrier";

import AdminDashboard from "./AdminDashboard";

import AgencyAgreements from "./AgencyAgreements";

import AgencyCommissions from "./AgencyCommissions";

import AgencyHierarchy from "./AgencyHierarchy";

import AgencyManagement from "./AgencyManagement";

import AgentDetail from "./AgentDetail";

import AgentTraining from "./AgentTraining";

import Agents from "./Agents";

import AgreementCompliance from "./AgreementCompliance";

import Alerts from "./Alerts";

import Analytics from "./Analytics";

import Automation from "./Automation";

import CRM from "./CRM";

import CampaignManager from "./CampaignManager";

import CarrierDetail from "./CarrierDetail";

import Carriers from "./Carriers";

import ClientDetail from "./ClientDetail";

import ClientManagement from "./ClientManagement";

import ClientOnboarding from "./ClientOnboarding";

import ClientPortal from "./ClientPortal";

import Coaching from "./Coaching";

import Commissions from "./Commissions";

import Compliance from "./Compliance";

import ContentCreator from "./ContentCreator";

import Contracts from "./Contracts";

import Dashboard from "./Dashboard";

import Documents from "./Documents";

import FollowUpAutomation from "./FollowUpAutomation";

import KnowledgeBase from "./KnowledgeBase";

import LandingPage from "./LandingPage";

import Leaderboard from "./Leaderboard";

import Leads from "./Leads";

import Messages from "./Messages";

import PortalLanding from "./PortalLanding";

import PortalSignup from "./PortalSignup";

import Renewals from "./Renewals";

import Reports from "./Reports";

import StaffManagement from "./StaffManagement";

import SuperAdminPanel from "./SuperAdminPanel";

import Survey from "./Survey";

import Tasks from "./Tasks";

import Training from "./Training";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    AIContentCreator: AIContentCreator,
    
    AddAgent: AddAgent,
    
    AddCarrier: AddCarrier,
    
    AdminDashboard: AdminDashboard,
    
    AgencyAgreements: AgencyAgreements,
    
    AgencyCommissions: AgencyCommissions,
    
    AgencyHierarchy: AgencyHierarchy,
    
    AgencyManagement: AgencyManagement,
    
    AgentDetail: AgentDetail,
    
    AgentTraining: AgentTraining,
    
    Agents: Agents,
    
    AgreementCompliance: AgreementCompliance,
    
    Alerts: Alerts,
    
    Analytics: Analytics,
    
    Automation: Automation,
    
    CRM: CRM,
    
    CampaignManager: CampaignManager,
    
    CarrierDetail: CarrierDetail,
    
    Carriers: Carriers,
    
    ClientDetail: ClientDetail,
    
    ClientManagement: ClientManagement,
    
    ClientOnboarding: ClientOnboarding,
    
    ClientPortal: ClientPortal,
    
    Coaching: Coaching,
    
    Commissions: Commissions,
    
    Compliance: Compliance,
    
    ContentCreator: ContentCreator,
    
    Contracts: Contracts,
    
    Dashboard: Dashboard,
    
    Documents: Documents,
    
    FollowUpAutomation: FollowUpAutomation,
    
    KnowledgeBase: KnowledgeBase,
    
    LandingPage: LandingPage,
    
    Leaderboard: Leaderboard,
    
    Leads: Leads,
    
    Messages: Messages,
    
    PortalLanding: PortalLanding,
    
    PortalSignup: PortalSignup,
    
    Renewals: Renewals,
    
    Reports: Reports,
    
    StaffManagement: StaffManagement,
    
    SuperAdminPanel: SuperAdminPanel,
    
    Survey: Survey,
    
    Tasks: Tasks,
    
    Training: Training,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/AIContentCreator" element={<AIContentCreator />} />
                
                <Route path="/AddAgent" element={<AddAgent />} />
                
                <Route path="/AddCarrier" element={<AddCarrier />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AgencyAgreements" element={<AgencyAgreements />} />
                
                <Route path="/AgencyCommissions" element={<AgencyCommissions />} />
                
                <Route path="/AgencyHierarchy" element={<AgencyHierarchy />} />
                
                <Route path="/AgencyManagement" element={<AgencyManagement />} />
                
                <Route path="/AgentDetail" element={<AgentDetail />} />
                
                <Route path="/AgentTraining" element={<AgentTraining />} />
                
                <Route path="/Agents" element={<Agents />} />
                
                <Route path="/AgreementCompliance" element={<AgreementCompliance />} />
                
                <Route path="/Alerts" element={<Alerts />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Automation" element={<Automation />} />
                
                <Route path="/CRM" element={<CRM />} />
                
                <Route path="/CampaignManager" element={<CampaignManager />} />
                
                <Route path="/CarrierDetail" element={<CarrierDetail />} />
                
                <Route path="/Carriers" element={<Carriers />} />
                
                <Route path="/ClientDetail" element={<ClientDetail />} />
                
                <Route path="/ClientManagement" element={<ClientManagement />} />
                
                <Route path="/ClientOnboarding" element={<ClientOnboarding />} />
                
                <Route path="/ClientPortal" element={<ClientPortal />} />
                
                <Route path="/Coaching" element={<Coaching />} />
                
                <Route path="/Commissions" element={<Commissions />} />
                
                <Route path="/Compliance" element={<Compliance />} />
                
                <Route path="/ContentCreator" element={<ContentCreator />} />
                
                <Route path="/Contracts" element={<Contracts />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Documents" element={<Documents />} />
                
                <Route path="/FollowUpAutomation" element={<FollowUpAutomation />} />
                
                <Route path="/KnowledgeBase" element={<KnowledgeBase />} />
                
                <Route path="/LandingPage" element={<LandingPage />} />
                
                <Route path="/Leaderboard" element={<Leaderboard />} />
                
                <Route path="/Leads" element={<Leads />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/PortalLanding" element={<PortalLanding />} />
                
                <Route path="/PortalSignup" element={<PortalSignup />} />
                
                <Route path="/Renewals" element={<Renewals />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/StaffManagement" element={<StaffManagement />} />
                
                <Route path="/SuperAdminPanel" element={<SuperAdminPanel />} />
                
                <Route path="/Survey" element={<Survey />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Training" element={<Training />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}