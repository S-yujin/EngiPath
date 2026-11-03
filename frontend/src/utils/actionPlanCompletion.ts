import type { ActionPlan, MinimumRequirement, ShortTermAction, LongTermMilestone } from '../types';

/**
 * Keep a parent sprint/milestone and its sub-requirements consistent.
 *
 * - Completing a parent marks all its requirements completed.
 * - Completing the last requirement completes the parent automatically.
 * - Unchecking any requirement reopens its parent.
 * - Reopening the parent clears all its requirements.
 * The IDs and payload structure remain unchanged.
 */
export function setItemCompleted<T extends { completed?: boolean; minimumRequirements?: MinimumRequirement[] }>(
  item: T,
  completed: boolean
): T {
  return {
    ...item,
    completed,
    minimumRequirements: item.minimumRequirements?.map((req) => ({ ...req, completed }))
  };
}

export function toggleRequirement<T extends { completed?: boolean; minimumRequirements?: MinimumRequirement[] }>(
  item: T,
  index: number
): T {
  const requirements = item.minimumRequirements;
  if (!requirements || !requirements[index]) return item;

  const updated = requirements.map((req, i) =>
    i === index ? { ...req, completed: !req.completed } : req
  );

  return {
    ...item,
    minimumRequirements: updated,
    completed: updated.length > 0 && updated.every((req) => !!req.completed)
  };
}

/** Restore consistency in plans saved by older versions of the app. */
function normalizeItem<T extends { completed?: boolean; minimumRequirements?: MinimumRequirement[] }>(item: T): T {
  if (!item.minimumRequirements?.length) return item;
  if (item.completed) return setItemCompleted(item, true);
  if (item.minimumRequirements.every((req) => !!req.completed)) {
    return { ...item, completed: true };
  }
  return item;
}

export function normalizeActionPlanCompletion(plan: ActionPlan): ActionPlan {
  return {
    ...plan,
    shortTerm: (plan.shortTerm || []).map((action: ShortTermAction) => normalizeItem(action)),
    longTerm: (plan.longTerm || []).map((milestone: LongTermMilestone) => normalizeItem(milestone))
  };
}
