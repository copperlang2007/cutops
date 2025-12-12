import { differenceInDays } from 'date-fns';
import { ALERT_THRESHOLDS } from './constants';

/**
 * Checks contracts for expiration and action required statuses
 * Creates alerts for contracts within the warning/critical thresholds
 */
export async function checkContractAlerts(contracts, existingAlerts, createAlert) {
  const today = new Date();
  const alertsToCreate = [];

  for (const contract of contracts) {
    // Check for contracts requiring correction
    if (contract.contract_status === 'requires_correction') {
      const existingActionAlert = existingAlerts.find(
        a => a.related_entity_type === 'contract' && 
             a.related_entity_id === contract.id && 
             !a.is_resolved &&
             a.alert_type === 'contract_action_required'
      );

      if (!existingActionAlert) {
        alertsToCreate.push({
          agent_id: contract.agent_id,
          alert_type: 'contract_action_required',
          severity: 'warning',
          title: `${contract.carrier_name} Contract Requires Correction`,
          message: contract.correction_notes || 'The carrier has requested corrections to the contract.',
          is_read: false,
          is_resolved: false,
          related_entity_type: 'contract',
          related_entity_id: contract.id
        });
      }
    }

    // Check for expiring contracts
    if (!contract.expiration_date || 
        !['active', 'contract_signed'].includes(contract.contract_status)) {
      continue;
    }

    const expirationDate = new Date(contract.expiration_date);
    const daysUntilExpiration = differenceInDays(expirationDate, today);

    // Skip if already expired or too far out
    if (daysUntilExpiration < 0 || daysUntilExpiration > ALERT_THRESHOLDS.warningDays) {
      continue;
    }

    // Check if alert already exists for this contract
    const existingAlert = existingAlerts.find(
      a => a.related_entity_type === 'contract' && 
           a.related_entity_id === contract.id && 
           !a.is_resolved &&
           a.alert_type === 'contract_expiring'
    );

    if (existingAlert) {
      continue;
    }

    const severity = daysUntilExpiration <= ALERT_THRESHOLDS.criticalDays ? 'critical' : 'warning';

    alertsToCreate.push({
      agent_id: contract.agent_id,
      alert_type: 'contract_expiring',
      severity: severity,
      title: `${contract.carrier_name} Contract Expiring Soon`,
      message: `The ${contract.carrier_name} contract expires in ${daysUntilExpiration} days on ${contract.expiration_date}.`,
      due_date: contract.expiration_date,
      is_read: false,
      is_resolved: false,
      related_entity_type: 'contract',
      related_entity_id: contract.id
    });
  }

  // Create all new alerts
  const createdAlerts = [];
  for (const alertData of alertsToCreate) {
    const created = await createAlert(alertData);
    createdAlerts.push(created);
  }

  return createdAlerts;
}

/**
 * Gets contract status summary
 */
export function getContractStatusSummary(contracts) {
  return {
    total: contracts.length,
    active: contracts.filter(c => c.contract_status === 'active').length,
    signed: contracts.filter(c => c.contract_status === 'contract_signed').length,
    pending: contracts.filter(c => 
      ['pending_submission', 'submitted', 'pending_carrier_review', 'contract_sent'].includes(c.contract_status)
    ).length,
    action_required: contracts.filter(c => c.contract_status === 'requires_correction').length,
    expired: contracts.filter(c => c.contract_status === 'expired').length
  };
}