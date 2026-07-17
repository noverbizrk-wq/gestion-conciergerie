/** Transitions de statut autorisées pour une mission (cf. section 8 du cahier des charges). */
export const MISSION_TRANSITIONS: Record<string, string[]> = {
  TO_PLAN: ["PLANNED", "CANCELLED"],
  PLANNED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "REFUSED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED"],
  DONE: ["TO_REVIEW"],
  TO_REVIEW: ["VALIDATED", "IN_PROGRESS"],
  REFUSED: ["ASSIGNED"],
  VALIDATED: [],
  CANCELLED: [],
  LATE: ["IN_PROGRESS", "CANCELLED"],
};
