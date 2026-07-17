import type { MissionTaskCategory } from "@prisma/client";

/**
 * Checklist par défaut appliquée automatiquement à chaque mission de ménage générée.
 * Modifiable manuellement mission par mission une fois créée (pas encore de gestion
 * de templates personnalisés par logement — prévu en évolution future).
 */
export const DEFAULT_CLEANING_CHECKLIST: Array<{
  category: MissionTaskCategory;
  label: string;
  required: boolean;
  photoRequired: boolean;
}> = [
  { category: "ENTREE", label: "Entrée dégagée, sol propre", required: true, photoRequired: false },
  { category: "CUISINE", label: "Cuisine nettoyée, vaisselle rangée, four/plaques dégraissés", required: true, photoRequired: true },
  { category: "SALON", label: "Salon rangé, poussière faite, sol aspiré/lavé", required: true, photoRequired: true },
  { category: "CHAMBRES", label: "Lits refaits avec linge propre", required: true, photoRequired: true },
  { category: "SALLE_DE_BAIN", label: "Salle de bain désinfectée, serviettes propres en place", required: true, photoRequired: true },
  { category: "TOILETTES", label: "Toilettes nettoyées et désinfectées", required: true, photoRequired: false },
  { category: "TERRASSE", label: "Terrasse/balcon rangé si applicable", required: false, photoRequired: false },
  { category: "LINGE", label: "Linge sale collecté, linge propre installé", required: true, photoRequired: false },
  { category: "CONSOMMABLES", label: "Consommables réapprovisionnés (papier toilette, savon, café...)", required: true, photoRequired: false },
  { category: "EQUIPEMENTS", label: "Équipements vérifiés (TV, wifi, chauffage/clim)", required: false, photoRequired: false },
  { category: "SECURITE", label: "Portes/fenêtres fermées, poubelles descendues", required: true, photoRequired: false },
];
