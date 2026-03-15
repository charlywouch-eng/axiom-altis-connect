# Système de paiement Stripe — Vue complète

## Architecture Edge Functions

| Function | Cible | Auth requise | Tiers supportés |
|---|---|---|---|
| `create-payment-lead` | Leads (non connectés) | Non | `test` (4,99 €) / `full` (29 €) |
| `create-payment-talent` | Talents (connectés) | Oui (JWT) | `test` (4,99 €) / `full` (29 €) |
| `create-checkout-entreprise` | Entreprises | Oui (JWT) | Premium SaaS (499 €/mois) |
| `create-payment` | Success fee offres | Oui (JWT) | One-off |
| `stripe-webhook` | Activation backend | — | Gère tous les `payment_type` |

## Price IDs Stripe

| Produit | Price ID | Montant |
|---|---|---|
| Test d'éligibilité (lead) | `price_1TAcRuLLoCKfmmI1JCKUqUey` | 4,99 € |
| Déblocage complet (lead) | `price_1TAcSgLLoCKfmmI1jy4TZp8h` | 29 € |
| Test d'éligibilité (talent) | `price_1TAcRuLLoCKfmmI1JCKUqUey` | 4,99 € |
| Déblocage complet (talent) | `price_1TAcSgLLoCKfmmI1jy4TZp8h` | 29 € |

## Payment Types (metadata webhook)

| `payment_type` | Action webhook |
|---|---|
| `analyse_complete` | `talent_profiles.is_premium = true` |
| `analyse_complete_lead` | `talent_profiles.is_premium = true` (ou `leads.status = "premium_paid"` si pas de `user_id`) |
| `deblocage_complet` | `talent_profiles.is_premium = true` + `premium_unlocked_at` |
| `deblocage_complet_lead` | Idem lead |
| `entreprise_premium` | `company_profiles.is_subscribed = true` |

## Pages avec boutons de paiement

| Page | Route | Bouton 4,99 € | Bouton 29 € | Function appelée |
|---|---|---|---|---|
| Leads | `/leads` | ✅ | ✅ | `create-payment-lead` |
| SignupLight | `/signup-light` | ✅ | ✅ | `create-payment-lead` |
| PaymentSuccess | `/payment-success` | — | ✅ (upgrade) | `create-payment-talent` |
| DashboardTalent | `/dashboard/talent` | ✅ | ✅ | `create-payment-talent` |

## Flux utilisateur type

1. **Landing** (`/`) → teaser form → redirige vers `/leads`
2. **Leads** (`/leads`) → score IA → CTA 4,99 € ou 29 € → Stripe Checkout
3. **PaymentSuccess** (`/payment-success`) → confirmation + upgrade 29 € si test + CTA inscription
4. **SignupLight** (`/signup-light`) → formulaire + score → CTA 4,99 € ou 29 € → Stripe Checkout
5. **DashboardTalent** → premium gate → CTA 4,99 € ou 29 € (authentifié)
