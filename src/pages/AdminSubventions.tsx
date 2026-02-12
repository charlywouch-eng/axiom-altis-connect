import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, CheckCircle2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubventionRow {
  id: string;
  name: string;
  email: string;
  country: string;
  amount: string;
  status: "pending" | "validated";
}

const INITIAL_DATA: SubventionRow[] = [
  { id: "1", name: "Amina Diallo", email: "amina@mail.com", country: "Sénégal", amount: "2 000 €", status: "pending" },
  { id: "2", name: "Carlos Mendes", email: "carlos@mail.com", country: "Brésil", amount: "2 000 €", status: "pending" },
  { id: "3", name: "Fatou Keita", email: "fatou@mail.com", country: "Côte d'Ivoire", amount: "2 000 €", status: "validated" },
  { id: "4", name: "Youssef Benmoussa", email: "youssef@mail.com", country: "Maroc", amount: "2 000 €", status: "pending" },
  { id: "5", name: "Linh Nguyen", email: "linh@mail.com", country: "Vietnam", amount: "2 000 €", status: "validated" },
];

export default function AdminSubventions() {
  const { toast } = useToast();
  const [data, setData] = useState<SubventionRow[]>(INITIAL_DATA);
  const [search, setSearch] = useState("");

  const handleValidate = (id: string) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "validated" as const } : r))
    );
    toast({ title: "Subvention validée", description: "Le statut a été mis à jour." });
  };

  const filtered = data.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.country.toLowerCase().includes(q);
  });

  const validatedCount = data.filter((r) => r.status === "validated").length;

  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Subventions Formation</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <GraduationCap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Éligibles</p>
                <p className="text-xl font-bold">{data.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-xl font-bold">{validatedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <GraduationCap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold">{data.length - validatedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Talents éligibles — 2 000 € formation</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>{r.amount}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "validated" ? "default" : "outline"}>
                        {r.status === "validated" ? "Validée" : "En attente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => handleValidate(r.id)}
                        >
                          Valider subvention
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
