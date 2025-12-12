import { base44 } from '@/api/base44Client';

const BADGE_DEFINITIONS = {
  quick_starter: {
    name: 'Quick Starter',
    description: 'Completed first checklist item within 24 hours',
    points: 50,
    check: (data) => {
      const { checklistItems, agent } = data;
      if (!agent?.created_date || !checklistItems?.length) return false;
      const firstCompleted = checklistItems.find(c => c.is_completed);
      if (!firstCompleted?.completed_date) return false;
      const hoursSinceCreation = (new Date(firstCompleted.completed_date) - new Date(agent.created_date)) / (1000 * 60 * 60);
      return hoursSinceCreation <= 24;
    }
  },
  document_master: {
    name: 'Document Master',
    description: 'Uploaded all required documents',
    points: 100,
    check: (data) => {
      const { documents } = data;
      const requiredTypes = ['w9', 'direct_deposit', 'eo_certificate', 'id_verification'];
      const uploadedTypes = new Set(documents?.map(d => d.document_type) || []);
      return requiredTypes.every(type => uploadedTypes.has(type));
    }
  },
  license_verified: {
    name: 'License Verified',
    description: 'State license verified successfully',
    points: 75,
    check: (data) => {
      const { licenses } = data;
      return licenses?.some(l => l.status === 'active' && l.nipr_verified);
    }
  },
  nipr_verified: {
    name: 'NIPR Verified',
    description: 'Completed NIPR verification',
    points: 100,
    check: (data) => {
      const { agent, licenses } = data;
      return agent?.nipr_status === 'verified' || licenses?.some(l => l.nipr_verified);
    }
  },
  ahip_certified: {
    name: 'AHIP Certified',
    description: 'Completed AHIP certification',
    points: 150,
    check: (data) => {
      const { agent, checklistItems } = data;
      const ahipItem = checklistItems?.find(c => c.item_key?.includes('ahip'));
      return ahipItem?.is_completed || !!agent?.ahip_completion_date;
    }
  },
  compliance_champion: {
    name: 'Compliance Champion',
    description: 'Passed background check and compliance training',
    points: 100,
    check: (data) => {
      const { agent, checklistItems } = data;
      const bgCheck = checklistItems?.find(c => c.item_key?.includes('background'));
      const compliance = checklistItems?.find(c => c.item_key?.includes('compliance_training'));
      return (bgCheck?.is_completed && compliance?.is_completed) || agent?.background_check_status === 'passed';
    }
  },
  first_carrier: {
    name: 'First Carrier',
    description: 'Completed first carrier appointment',
    points: 125,
    check: (data) => {
      const { appointments } = data;
      return appointments?.some(a => a.appointment_status === 'appointed');
    }
  },
  multi_carrier: {
    name: 'Multi-Carrier Pro',
    description: 'Appointed with 3+ carriers',
    points: 200,
    check: (data) => {
      const { appointments } = data;
      const appointedCount = appointments?.filter(a => a.appointment_status === 'appointed').length || 0;
      return appointedCount >= 3;
    }
  },
  speed_demon: {
    name: 'Speed Demon',
    description: 'Completed onboarding in under 7 days',
    points: 250,
    check: (data) => {
      const { agent, checklistItems } = data;
      if (agent?.onboarding_status !== 'ready_to_sell') return false;
      const allCompleted = checklistItems?.every(c => c.is_completed);
      if (!allCompleted || !checklistItems?.length) return false;
      const lastCompleted = checklistItems.reduce((latest, c) => {
        if (!c.completed_date) return latest;
        return new Date(c.completed_date) > new Date(latest) ? c.completed_date : latest;
      }, agent.created_date);
      const days = (new Date(lastCompleted) - new Date(agent.created_date)) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }
  },
  onboarding_complete: {
    name: 'Onboarding Champion',
    description: 'Successfully completed all onboarding steps',
    points: 500,
    check: (data) => {
      const { agent, checklistItems } = data;
      return agent?.onboarding_status === 'ready_to_sell' && 
             checklistItems?.length > 0 && 
             checklistItems.every(c => c.is_completed);
    }
  }
};

export async function checkAndAwardBadges(agentId, data, existingBadges = []) {
  const newBadges = [];
  const earnedTypes = new Set(existingBadges.map(b => b.badge_type));

  for (const [badgeType, definition] of Object.entries(BADGE_DEFINITIONS)) {
    if (earnedTypes.has(badgeType)) continue;
    
    try {
      if (definition.check(data)) {
        const badge = await base44.entities.OnboardingBadge.create({
          agent_id: agentId,
          badge_type: badgeType,
          badge_name: definition.name,
          badge_description: definition.description,
          points: definition.points,
          earned_date: new Date().toISOString()
        });
        newBadges.push(badge);
      }
    } catch (err) {
      console.error(`Error checking badge ${badgeType}:`, err);
    }
  }

  return newBadges;
}

export { BADGE_DEFINITIONS };