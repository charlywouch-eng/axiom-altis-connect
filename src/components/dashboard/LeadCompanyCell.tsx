import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Mail } from "lucide-react";

export interface LeadCompany {
  id: string;
  company_name: string;
  sector: string | null;
  contact_email: string | null;
  logo_url: string | null;
}

interface LeadCompanyCellProps {
  company?: LeadCompany;
  companies: LeadCompany[];
  onAssign: (companyId: string | null) => void;
  disabled?: boolean;
}

/**
 * Fiche entreprise affichée dans la ligne d'un lead :
 * logo, nom, secteur et email de contact, avec sélecteur d'association.
 */
export function LeadCompanyCell({ company, companies, onAssign, disabled }: LeadCompanyCellProps) {
  return (
    <div className="space-y-1.5 min-w-[190px]">
      {company ? (
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 shrink-0 rounded-md overflow-hidden bg-muted border border-border/60 flex items-center justify-center">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`Logo ${company.company_name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground/50" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate" title={company.company_name}>
              {company.company_name}
            </p>
            <p className="text-[10px] text-accent truncate">{company.sector ?? "Secteur non renseigné"}</p>
            {company.contact_email && (
              <a
                href={`mailto:${company.contact_email}`}
                className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 truncate max-w-[170px]"
              >
                <Mail className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{company.contact_email}</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/50">Aucune entreprise associée</p>
      )}

      <Select
        value={company?.id ?? "none"}
        onValueChange={(v) => onAssign(v === "none" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className="h-7 text-[10px] w-full">
          <SelectValue placeholder="Associer une entreprise" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— Aucune entreprise —</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
