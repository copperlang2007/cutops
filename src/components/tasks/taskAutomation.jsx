import { differenceInDays, addDays, format } from 'date-fns';

export async function generateAutomatedTasks(agents, licenses, contracts, checklistItems, existingTasks, assigneeEmail) {
  const newTasks = [];
  const today = new Date();

  // Helper to check if similar task exists
  const taskExists = (agentId, taskType, relatedId) => {
    return existingTasks.some(t => 
      t.agent_id === agentId && 
      t.task_type === taskType && 
      t.related_entity_id === relatedId &&
      t.status !== 'completed'
    );
  };

  for (const agent of agents) {
    // 1. Onboarding tasks for agents with incomplete checklists
    const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
    const incompleteItems = agentChecklist.filter(c => !c.is_completed);
    
    if (incompleteItems.length > 0 && agent.onboarding_status !== 'ready_to_sell') {
      const daysSinceCreation = differenceInDays(today, new Date(agent.created_date));
      
      if (daysSinceCreation > 7 && !taskExists(agent.id, 'onboarding', agent.id)) {
        newTasks.push({
          title: `Complete onboarding for ${agent.first_name} ${agent.last_name}`,
          description: `Agent has ${incompleteItems.length} incomplete onboarding items after ${daysSinceCreation} days.`,
          task_type: 'onboarding',
          status: 'pending',
          priority: daysSinceCreation > 14 ? 'high' : 'medium',
          agent_id: agent.id,
          assigned_to: assigneeEmail,
          due_date: format(addDays(today, 7), 'yyyy-MM-dd'),
          related_entity_type: 'agent',
          related_entity_id: agent.id,
          auto_generated: true
        });
      }
    }

    // 2. License renewal tasks
    const agentLicenses = licenses.filter(l => l.agent_id === agent.id);
    for (const license of agentLicenses) {
      if (!license.expiration_date) continue;
      
      const daysUntilExpiration = differenceInDays(new Date(license.expiration_date), today);
      
      if (daysUntilExpiration <= 60 && daysUntilExpiration > 0 && !taskExists(agent.id, 'license_renewal', license.id)) {
        newTasks.push({
          title: `Renew ${license.state} license for ${agent.first_name} ${agent.last_name}`,
          description: `License expires on ${license.expiration_date}. ${daysUntilExpiration} days remaining.`,
          task_type: 'license_renewal',
          status: 'pending',
          priority: daysUntilExpiration <= 30 ? 'urgent' : 'high',
          agent_id: agent.id,
          assigned_to: assigneeEmail,
          due_date: format(addDays(today, Math.min(daysUntilExpiration - 14, 30)), 'yyyy-MM-dd'),
          related_entity_type: 'license',
          related_entity_id: license.id,
          auto_generated: true
        });
      }
    }

    // 3. Contract renewal tasks
    const agentContracts = contracts.filter(c => c.agent_id === agent.id);
    for (const contract of agentContracts) {
      if (!contract.expiration_date) continue;
      
      const daysUntilExpiration = differenceInDays(new Date(contract.expiration_date), today);
      
      if (daysUntilExpiration <= 90 && daysUntilExpiration > 0 && !taskExists(agent.id, 'contract_renewal', contract.id)) {
        newTasks.push({
          title: `Review ${contract.carrier_name} contract renewal for ${agent.first_name} ${agent.last_name}`,
          description: `Contract expires on ${contract.expiration_date}. Begin renewal process.`,
          task_type: 'contract_renewal',
          status: 'pending',
          priority: daysUntilExpiration <= 30 ? 'high' : 'medium',
          agent_id: agent.id,
          assigned_to: assigneeEmail,
          due_date: format(addDays(today, Math.min(daysUntilExpiration - 30, 45)), 'yyyy-MM-dd'),
          related_entity_type: 'contract',
          related_entity_id: contract.id,
          auto_generated: true
        });
      }

      // Task for contracts requiring correction
      if (contract.contract_status === 'requires_correction' && !taskExists(agent.id, 'compliance', contract.id)) {
        newTasks.push({
          title: `Address ${contract.carrier_name} contract corrections for ${agent.first_name} ${agent.last_name}`,
          description: contract.correction_notes || 'Contract requires corrections. Review and resubmit.',
          task_type: 'compliance',
          status: 'pending',
          priority: 'urgent',
          agent_id: agent.id,
          assigned_to: assigneeEmail,
          due_date: format(addDays(today, 5), 'yyyy-MM-dd'),
          related_entity_type: 'contract',
          related_entity_id: contract.id,
          auto_generated: true
        });
      }
    }
  }

  return newTasks;
}