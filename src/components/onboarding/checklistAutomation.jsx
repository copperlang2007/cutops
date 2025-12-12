import { differenceInDays } from 'date-fns';

// Mapping of events to checklist items they should complete
const EVENT_TO_CHECKLIST_MAP = {
  // NIPR/License events
  'nipr_verified': ['state_license'],
  'license_active': ['state_license'],
  
  // Document uploads
  'document_w9': ['w9_form'],
  'document_direct_deposit': ['direct_deposit'],
  'document_eo_certificate': ['eo_certificate'],
  'document_id_verification': ['id_verification'],
  'document_ahip_certificate': ['ahip_certification'],
  'document_background_check': ['background_check'],
  'document_compliance_training': ['compliance_training'],
  'document_carrier_certification': ['carrier_certifications'],
  
  // Contract events
  'contract_active': ['initial_contract'],
  'contract_signed': ['initial_contract'],
  
  // Background check
  'background_passed': ['background_check'],
  
  // AHIP
  'ahip_completed': ['ahip_certification'],
  
  // Compliance training
  'compliance_completed': ['compliance_training']
};

// Items that should trigger alerts if incomplete after X days
const CHECKLIST_ALERT_CONFIG = {
  'w9_form': { days: 7, severity: 'warning', priority: 1 },
  'direct_deposit': { days: 7, severity: 'info', priority: 2 },
  'eo_certificate': { days: 5, severity: 'critical', priority: 1 },
  'id_verification': { days: 7, severity: 'warning', priority: 2 },
  'ahip_certification': { days: 14, severity: 'warning', priority: 3 },
  'background_check': { days: 10, severity: 'critical', priority: 1 },
  'compliance_training': { days: 14, severity: 'warning', priority: 3 },
  'carrier_certifications': { days: 21, severity: 'info', priority: 4 },
  'initial_contract': { days: 14, severity: 'warning', priority: 2 },
  'state_license': { days: 7, severity: 'critical', priority: 1 }
};

/**
 * Automatically complete checklist items based on an event
 */
export async function triggerChecklistCompletion(
  eventType,
  agentId,
  checklistItems,
  updateChecklistItem,
  userEmail
) {
  const itemKeysToComplete = EVENT_TO_CHECKLIST_MAP[eventType];
  if (!itemKeysToComplete) return [];

  const completedItems = [];

  for (const itemKey of itemKeysToComplete) {
    const item = checklistItems.find(i => i.item_key === itemKey && !i.is_completed);
    if (item) {
      await updateChecklistItem(item.id, {
        is_completed: true,
        completed_date: new Date().toISOString(),
        completed_by: userEmail,
        notes: `Auto-completed via ${eventType.replace(/_/g, ' ')}`
      });
      completedItems.push(item);
    }
  }

  return completedItems;
}

/**
 * Map document type to event type for auto-completion
 */
export function getDocumentEventType(documentType) {
  const docTypeMap = {
    'w9': 'document_w9',
    'direct_deposit': 'document_direct_deposit',
    'eo_certificate': 'document_eo_certificate',
    'id_verification': 'document_id_verification',
    'ahip_certificate': 'document_ahip_certificate',
    'background_check': 'document_background_check',
    'compliance_training': 'document_compliance_training',
    'carrier_certification': 'document_carrier_certification'
  };
  return docTypeMap[documentType] || null;
}

/**
 * Check for incomplete checklist items that need alerts
 */
export async function checkChecklistAlerts(
  agent,
  checklistItems,
  existingAlerts,
  createAlert
) {
  if (!agent?.created_date || checklistItems.length === 0) return [];

  const agentCreatedDate = new Date(agent.created_date);
  const today = new Date();
  const daysSinceCreation = differenceInDays(today, agentCreatedDate);

  const alertsToCreate = [];

  for (const item of checklistItems) {
    if (item.is_completed) continue;

    const config = CHECKLIST_ALERT_CONFIG[item.item_key];
    if (!config) continue;

    // Check if item is overdue
    if (daysSinceCreation < config.days) continue;

    // Check if alert already exists
    const existingAlert = existingAlerts.find(
      a => a.related_entity_type === 'checklist' &&
           a.related_entity_id === item.id &&
           !a.is_resolved &&
           a.alert_type === 'onboarding_overdue'
    );

    if (existingAlert) continue;

    alertsToCreate.push({
      agent_id: agent.id,
      alert_type: 'onboarding_overdue',
      severity: config.severity,
      title: `Onboarding Item Overdue: ${item.item_name}`,
      message: `${item.item_name} has not been completed for ${daysSinceCreation} days since agent onboarding started.`,
      is_read: false,
      is_resolved: false,
      related_entity_type: 'checklist',
      related_entity_id: item.id
    });
  }

  // Sort by priority and create alerts
  alertsToCreate.sort((a, b) => {
    const configA = CHECKLIST_ALERT_CONFIG[checklistItems.find(i => i.id === a.related_entity_id)?.item_key];
    const configB = CHECKLIST_ALERT_CONFIG[checklistItems.find(i => i.id === b.related_entity_id)?.item_key];
    return (configA?.priority || 99) - (configB?.priority || 99);
  });

  const createdAlerts = [];
  for (const alertData of alertsToCreate) {
    const created = await createAlert(alertData);
    createdAlerts.push(created);
  }

  return createdAlerts;
}

/**
 * Auto-resolve checklist-related alerts when item is completed
 */
export async function resolveChecklistAlerts(
  checklistItemId,
  existingAlerts,
  updateAlert
) {
  const relatedAlerts = existingAlerts.filter(
    a => a.related_entity_type === 'checklist' &&
         a.related_entity_id === checklistItemId &&
         !a.is_resolved
  );

  for (const alert of relatedAlerts) {
    await updateAlert(alert.id, {
      is_resolved: true,
      resolved_date: new Date().toISOString()
    });
  }

  return relatedAlerts;
}