import { differenceInDays } from 'date-fns';
import { ALERT_THRESHOLDS } from './constants';

/**
 * Checks licenses for expiration and creates alerts for licenses
 * within the warning/critical thresholds
 */
export async function checkLicenseExpirations(licenses, existingAlerts, createAlert) {
  const today = new Date();
  const alertsToCreate = [];

  for (const license of licenses) {
    if (!license.expiration_date || license.status === 'expired' || license.status === 'revoked') {
      continue;
    }

    const expirationDate = new Date(license.expiration_date);
    const daysUntilExpiration = differenceInDays(expirationDate, today);

    // Skip if already expired (handled separately) or too far out
    if (daysUntilExpiration < 0 || daysUntilExpiration > ALERT_THRESHOLDS.warningDays) {
      continue;
    }

    // Check if alert already exists for this license
    const existingAlert = existingAlerts.find(
      a => a.related_entity_type === 'license' && 
           a.related_entity_id === license.id && 
           !a.is_resolved &&
           (a.alert_type === 'license_expiring' || a.alert_type === 'license_expired')
    );

    if (existingAlert) {
      continue; // Alert already exists
    }

    const severity = daysUntilExpiration <= ALERT_THRESHOLDS.criticalDays ? 'critical' : 'warning';
    const alertType = daysUntilExpiration <= 0 ? 'license_expired' : 'license_expiring';

    alertsToCreate.push({
      agent_id: license.agent_id,
      alert_type: alertType,
      severity: severity,
      title: `${license.state} License ${daysUntilExpiration <= 0 ? 'Expired' : 'Expiring Soon'}`,
      message: daysUntilExpiration <= 0 
        ? `The ${license.state} ${license.license_type || 'health'} license (${license.license_number}) has expired.`
        : `The ${license.state} ${license.license_type || 'health'} license (${license.license_number}) expires in ${daysUntilExpiration} days on ${license.expiration_date}.`,
      due_date: license.expiration_date,
      is_read: false,
      is_resolved: false,
      related_entity_type: 'license',
      related_entity_id: license.id
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
 * Gets license expiration status summary
 */
export function getLicenseExpirationSummary(licenses) {
  const today = new Date();
  
  const summary = {
    total: licenses.length,
    active: 0,
    expiring_critical: 0,
    expiring_warning: 0,
    expired: 0
  };

  for (const license of licenses) {
    if (!license.expiration_date) {
      summary.active++;
      continue;
    }

    const daysUntilExpiration = differenceInDays(new Date(license.expiration_date), today);

    if (daysUntilExpiration < 0) {
      summary.expired++;
    } else if (daysUntilExpiration <= ALERT_THRESHOLDS.criticalDays) {
      summary.expiring_critical++;
    } else if (daysUntilExpiration <= ALERT_THRESHOLDS.warningDays) {
      summary.expiring_warning++;
    } else {
      summary.active++;
    }
  }

  return summary;
}