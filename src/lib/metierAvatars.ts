// Métier avatars – WebP via vite-imagetools, with JPG fallback
import talentAvatar1Webp from "@/assets/talent-avatar-1.jpg?format=webp";
import talentAvatar2Webp from "@/assets/talent-avatar-2.jpg?format=webp";
import talentAvatar3Webp from "@/assets/talent-avatar-3.jpg?format=webp";
import talentAvatar4Webp from "@/assets/talent-avatar-4.jpg?format=webp";
import talentAvatar5Webp from "@/assets/talent-avatar-5.jpg?format=webp";
import talentAvatar6Webp from "@/assets/talent-avatar-6.jpg?format=webp";

import metierInfirmier from "@/assets/metier-infirmier.jpg?format=webp";
import metierAideSoignant from "@/assets/metier-aide-soignant.jpg?format=webp";
import metierAuxPuer from "@/assets/metier-auxiliaire-puericulture.jpg?format=webp";
import metierCariste from "@/assets/metier-cariste.jpg?format=webp";
import metierCarreleur from "@/assets/metier-carreleur.jpg?format=webp";
import metierChauffeur from "@/assets/metier-chauffeur-routier.jpg?format=webp";
import metierCouvreur from "@/assets/metier-couvreur.jpg?format=webp";
import metierCuisinier from "@/assets/metier-cuisinier.jpg?format=webp";
import metierInfirmierBloc from "@/assets/metier-infirmier-bloc.jpg?format=webp";
import metierMacon from "@/assets/metier-macon.jpg?format=webp";
import metierOuvrierAgricole from "@/assets/metier-ouvrier-agricole.jpg?format=webp";
import metierPeintre from "@/assets/metier-peintre-batiment.jpg?format=webp";
import metierPlombier from "@/assets/metier-plombier.jpg?format=webp";
import metierServeur from "@/assets/metier-serveur.jpg?format=webp";
import metierTechnicien from "@/assets/metier-technicien-maintenance.jpg?format=webp";
import metierAgentRestauration from "@/assets/metier-agent-restauration.jpg?format=webp";

export const TALENT_PHOTOS_WEBP = [
  talentAvatar1Webp, talentAvatar2Webp, talentAvatar3Webp,
  talentAvatar4Webp, talentAvatar5Webp, talentAvatar6Webp,
];

const ROME_AVATAR_MAP: Record<string, string> = {
  "J1506": metierInfirmier, "J1505": metierInfirmier,
  "J1501": metierAideSoignant,
  "J1403": metierAuxPuer,
  "N1101": metierCariste,
  "F1603": metierCarreleur,
  "N4101": metierChauffeur,
  "F1702": metierCouvreur,
  "G1602": metierCuisinier,
  "J1103": metierInfirmierBloc,
  "F1703": metierMacon, "F1701": metierMacon,
  "A1101": metierOuvrierAgricole,
  "F1502": metierPeintre,
  "F1605": metierPlombier,
  "G1603": metierServeur,
  "I1308": metierTechnicien, "I1304": metierTechnicien,
  "G1501": metierAgentRestauration,
};

/** Returns WebP avatar matching a talent's ROME code, with sector fallback */
export function getAvatarForTalent(romeCode: string | null, index: number): string {
  if (romeCode) {
    const code = romeCode.toUpperCase().trim();
    if (ROME_AVATAR_MAP[code]) return ROME_AVATAR_MAP[code];
    const prefix = code.substring(0, 1);
    if (prefix === "J") return metierInfirmier;
    if (prefix === "F") return metierMacon;
    if (prefix === "G") return metierCuisinier;
    if (prefix === "N") return metierChauffeur;
    if (prefix === "I") return metierTechnicien;
    if (prefix === "A") return metierOuvrierAgricole;
  }
  return TALENT_PHOTOS_WEBP[index % TALENT_PHOTOS_WEBP.length];
}

// Export individual métier avatars for fiche pages
export {
  metierInfirmier, metierAideSoignant, metierAuxPuer, metierCariste,
  metierCarreleur, metierChauffeur, metierCouvreur, metierCuisinier,
  metierInfirmierBloc, metierMacon, metierOuvrierAgricole, metierPeintre,
  metierPlombier, metierServeur, metierTechnicien, metierAgentRestauration,
};
