import { Node } from '@xyflow/react';
import { BpmnNodeData } from '../types/process';

export interface LeadTimeResult {
  totalHours: number;
  businessDays: number;
  calendarDays: number;
  peremptoryDeadlinesCount: number;
}

/**
 * Calculates total process lead time / SLA across all configured tasks
 */
export function calculateTotalLeadTime(nodes: Node<BpmnNodeData>[]): LeadTimeResult {
  let totalHours = 0;
  let businessDays = 0;
  let calendarDays = 0;
  let peremptoryCount = 0;

  nodes.forEach(node => {
    const sla = node.data?.slaDuration;
    if (sla) {
      if (sla.isPeremptory) peremptoryCount++;

      switch (sla.unit) {
        case 'HOURS':
          totalHours += sla.value;
          break;
        case 'BUSINESS_DAYS':
          businessDays += sla.value;
          totalHours += sla.value * 8; // Assuming 8-hour administrative workday
          break;
        case 'CALENDAR_DAYS':
          calendarDays += sla.value;
          totalHours += sla.value * 24;
          break;
      }
    }
  });

  return {
    totalHours,
    businessDays,
    calendarDays,
    peremptoryDeadlinesCount: peremptoryCount
  };
}

/**
 * Format ISO 8601 Duration String (e.g. value: 10, unit: 'BUSINESS_DAYS' -> 'P10D')
 */
export function buildIsoDurationString(value: number, unit: string): string {
  if (unit === 'HOURS') {
    return `PT${value}H`;
  }
  return `P${value}D`;
}
