import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = "https://axiom-talents.com";
// Demo mode: use Resend test domain (no DNS verification needed)
const FROM_EMAIL_DEMO = "AXIOM & ALTIS <delivered@resend.dev>";
const FROM_EMAIL_PROD = "AXIOM ALTIS <notify@axiom-talents.com>";

// ─── Email wrapper ──────────────────────────────────────────
function wrapEmail(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%);padding:32px;text-align:center;">
  <h1 style="color:#ffffff;font-size:22px;margin:0 0 4px;">AXIOM × ALTIS</h1>
  <p style="color:#94a3b8;font-size:12px;margin:0;">TIaaS — Talent Infrastructure as a Service</p>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px;">
  ${body}
</td></tr>
<!-- Footer -->
<tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:11px;margin:0 0 4px;">
    <a href="${SITE_URL}" style="color:#1E40AF;text-decoration:none;">axiom-talents.com</a> · 
    <a href="mailto:contact@axiom-talents.com" style="color:#1E40AF;text-decoration:none;">contact@axiom-talents.com</a>
  </p>
  <p style="color:#cbd5e1;font-size:10px;margin:0;">© ${new Date().getFullYear()} AXIOM ALTIS – Recrutement international certifié</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Notification templates ─────────────────────────────────

function matchTalentEmail(talentName: string, offerTitle: string, company: string) {
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonjour <strong>${talentName}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonne nouvelle ! Votre profil correspond à une nouvelle opportunité :
    </p>
    <div style="background:#f0f9ff;border-left:4px solid #1E40AF;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-weight:700;color:#0F172A;font-size:15px;">${offerTitle}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">${company}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="${SITE_URL}/dashboard-talent?tab=opportunites" style="display:inline-block;background:#1E40AF;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Voir l'offre →
      </a>
    </td></tr></table>`;
  return {
    subject: `🎯 Nouvelle offre compatible : ${offerTitle}`,
    html: wrapEmail("Nouveau match", `Votre profil correspond à l'offre "${offerTitle}"`, body),
  };
}

function matchEntrepriseEmail(companyName: string, talentName: string, score: number) {
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonjour <strong>${companyName}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Un nouveau talent vérifié correspond à vos critères de recrutement :
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-weight:700;color:#0F172A;font-size:15px;">${talentName}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">Score de conformité : <strong style="color:#16a34a;">${score}/100</strong></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="${SITE_URL}/dashboard-entreprise?tab=talents" style="display:inline-block;background:#1E40AF;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Voir le profil →
      </a>
    </td></tr></table>`;
  return {
    subject: `✅ Nouveau talent compatible : ${talentName}`,
    html: wrapEmail("Nouveau match", `${talentName} correspond à vos critères`, body),
  };
}

function visaStatusEmail(talentName: string, oldStatus: string, newStatus: string) {
  const statusLabels: Record<string, string> = {
    en_attente: "En attente",
    en_cours: "Visa en cours de traitement",
    apostille: "Dossier apostillé ✓",
    pret_j1: "Prêt pour le Jour 1 en France 🇫🇷",
  };
  const label = statusLabels[newStatus] || newStatus;
  const color = newStatus === "pret_j1" ? "#16a34a" : newStatus === "apostille" ? "#06B6D4" : "#1E40AF";

  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonjour <strong>${talentName}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Le statut de votre dossier visa vient d'être mis à jour :
    </p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Nouveau statut</p>
      <p style="color:${color};font-size:20px;font-weight:700;margin:0;">${label}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="${SITE_URL}/dashboard-talent" style="display:inline-block;background:#1E40AF;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Mon tableau de bord →
      </a>
    </td></tr></table>`;
  return {
    subject: `📋 Statut visa mis à jour : ${label}`,
    html: wrapEmail("Mise à jour visa", `Votre statut visa est maintenant : ${label}`, body),
  };
}

function diplomaVerifiedEmail(talentName: string, diplomaName: string, status: "verifie" | "refuse") {
  const isVerified = status === "verifie";
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonjour <strong>${talentName}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      La vérification de votre diplôme est terminée :
    </p>
    <div style="background:${isVerified ? "#f0fdf4" : "#fef2f2"};border-left:4px solid ${isVerified ? "#16a34a" : "#ef4444"};padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-weight:700;color:#0F172A;font-size:15px;">${diplomaName}</p>
      <p style="margin:0;color:${isVerified ? "#16a34a" : "#ef4444"};font-size:14px;font-weight:600;">
        ${isVerified ? "✅ Vérifié — Conforme MINEFOP/Apostille" : "❌ Non conforme — Vérification échouée"}
      </p>
    </div>
    ${!isVerified ? `<p style="color:#64748b;font-size:13px;margin:0 0 24px;">Vous pouvez soumettre à nouveau votre document depuis votre tableau de bord.</p>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="${SITE_URL}/dashboard-talent" style="display:inline-block;background:#1E40AF;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Mon tableau de bord →
      </a>
    </td></tr></table>`;
  return {
    subject: isVerified ? `✅ Diplôme vérifié : ${diplomaName}` : `❌ Diplôme non conforme : ${diplomaName}`,
    html: wrapEmail("Vérification diplôme", `Votre diplôme "${diplomaName}" a été ${isVerified ? "vérifié" : "refusé"}`, body),
  };
}

function incompleteProfileEmail(talentName: string, _email: string) {
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonjour <strong>${talentName || "Talent"}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Votre profil AXIOM × ALTIS est encore incomplet. Complétez-le pour augmenter vos chances d'être repéré par les recruteurs français :
    </p>
    <ul style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
      <li>Ajoutez vos compétences et votre niveau de français</li>
      <li>Téléchargez vos diplômes pour la vérification MINEFOP</li>
      <li>Précisez votre code métier ROME</li>
    </ul>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="${SITE_URL}/dashboard-talent?tab=profil" style="display:inline-block;background:#1E40AF;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Compléter mon profil →
      </a>
    </td></tr></table>`;
  return {
    subject: "⚡ Complétez votre profil AXIOM × ALTIS",
    html: wrapEmail("Profil incomplet", "Complétez votre profil pour maximiser vos chances", body),
  };
}

// ─── NEW: Profile viewed by recruiter ───────────────────────
function profileViewedEmail(talentName: string) {
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonjour <strong>${talentName}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonne nouvelle ! <strong>Un recruteur français vient de consulter votre profil complet</strong> sur AXIOM × ALTIS.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      C'est un signal très positif : cela signifie que votre parcours, vos compétences et vos qualifications ont retenu son attention parmi notre vivier de talents certifiés.
    </p>
    <div style="background:#f0f9ff;border-left:4px solid #1E40AF;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#0F172A;font-size:15px;">💡 Nos conseils pour maximiser vos chances :</p>
      <ul style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
        <li>Vérifiez que votre profil est <strong>100 % complet</strong> (photo, diplômes, compétences)</li>
        <li>Ajoutez vos <strong>certifications MINEFOP</strong> si ce n'est pas encore fait</li>
        <li>Précisez votre <strong>disponibilité</strong> et votre <strong>mobilité</strong></li>
      </ul>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="${SITE_URL}/dashboard-talent?tab=profil" style="display:inline-block;background:linear-gradient(135deg,#1E40AF,#06B6D4);color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">
        Optimiser mon profil →
      </a>
    </td></tr></table>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      Pour des raisons de confidentialité, nous ne communiquons pas l'identité du recruteur.
    </p>`;
  return {
    subject: "👀 Un recruteur a consulté votre profil AXIOM × ALTIS",
    html: wrapEmail("Profil consulté", "Un recruteur vient de consulter votre profil complet", body),
  };
}

// ─── NEW: Sector match (score IA > 80%) ─────────────────────
function sectorMatchEmail(talentName: string, matchCount: number, topSector: string) {
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Bonjour <strong>${talentName}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Notre algorithme de matching vient de détecter <strong>${matchCount} nouvelle${matchCount > 1 ? 's' : ''} opportunité${matchCount > 1 ? 's' : ''}</strong> avec un score de compatibilité supérieur à 80 % dans le secteur <strong>${topSector}</strong>.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#0F172A;font-size:15px;">🎯 Votre profil correspond à de nouvelles opportunités</p>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
        Ces offres ont été sélectionnées par notre IA en fonction de vos compétences, votre expérience et votre niveau de qualification. Les recruteurs recherchent activement des profils comme le vôtre.
      </p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Score de compatibilité</p>
      <p style="color:#16a34a;font-size:32px;font-weight:700;margin:0;">80%+</p>
      <p style="color:#64748b;font-size:13px;margin:4px 0 0;">sur ${matchCount} offre${matchCount > 1 ? 's' : ''} active${matchCount > 1 ? 's' : ''}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="${SITE_URL}/dashboard-talent?tab=opportunites" style="display:inline-block;background:linear-gradient(135deg,#1E40AF,#06B6D4);color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">
        Voir mes opportunités →
      </a>
    </td></tr></table>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      Vous recevez cet email car les notifications sont activées. Vous pouvez les désactiver dans les paramètres de votre profil.
    </p>`;
  return {
    subject: `🎯 ${matchCount} nouvelle${matchCount > 1 ? 's' : ''} opportunité${matchCount > 1 ? 's' : ''} compatible${matchCount > 1 ? 's' : ''} – Score IA > 80 %`,
    html: wrapEmail("Nouvelles opportunités", `${matchCount} offre(s) avec un score > 80% dans ${topSector}`, body),
  };
}

// ─── Anti-spam: check if talent received this type today ─────
async function canSendNotification(supabase: any, talentUserId: string, notificationType: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("talent_notification_log")
    .select("id")
    .eq("talent_user_id", talentUserId)
    .eq("notification_type", notificationType)
    .gte("created_at", today.toISOString())
    .limit(1);
  return !data || data.length === 0;
}

async function logNotification(supabase: any, talentUserId: string, notificationType: string) {
  await supabase.from("talent_notification_log").insert({
    talent_user_id: talentUserId,
    notification_type: notificationType,
  });
}

// ─── Insert in-app push notification ─────────────────────────
async function insertPushNotification(
  supabase: any,
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link: link || null,
    read: false,
  });
}

// ─── Check if talent has notifications enabled ───────────────
async function isNotificationEnabled(supabase: any, talentUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from("talent_profiles")
    .select("email_notifications_enabled")
    .eq("user_id", talentUserId)
    .limit(1)
    .single();
  return data?.email_notifications_enabled !== false;
}

/** Send via Resend using demo domain (delivered@resend.dev) — no DNS needed */
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  // Use demo domain (no DNS verification required)
  const fromAddr = FROM_EMAIL_DEMO;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: fromAddr,
      to: [to],
      subject,
      html,
      reply_to: "charly@axiom-talents.com",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);
  console.log(`[DEMO-SEND] ✅ Sent "${subject}" → ${to} (from ${fromAddr})`, data);
  return data;
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { type, payload } = await req.json();

    console.log(`[NOTIFICATION] type=${type}`, JSON.stringify(payload).slice(0, 200));

    switch (type) {
      case "match_talent": {
        const { talent_user_id, offer_title, company_name } = payload;
        let recipientEmail: string | null = null;
        let recipientName = "Talent";

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", talent_user_id)
          .single();

        if (profile?.email) {
          recipientEmail = profile.email;
          recipientName = profile.full_name || "Talent";
        } else {
          const { data: tp } = await supabase
            .from("talent_profiles")
            .select("full_name")
            .eq("user_id", talent_user_id)
            .single();
          console.log(`[NOTIFICATION] Talent ${talent_user_id} has no email (CSV import: ${tp?.full_name}). Skipping.`);
          break;
        }

        const email = matchTalentEmail(recipientName, offer_title, company_name);
        await sendEmail(profile.email, email.subject, email.html);
        break;
      }

      case "match_entreprise": {
        const { entreprise_user_id, talent_name, score } = payload;
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", entreprise_user_id)
          .single();
        if (!profile?.email) throw new Error("Entreprise profile not found");
        const { data: company } = await supabase
          .from("company_profiles")
          .select("company_name")
          .eq("user_id", entreprise_user_id)
          .single();
        const email = matchEntrepriseEmail(company?.company_name || profile.full_name || "Entreprise", talent_name, score);
        await sendEmail(profile.email, email.subject, email.html);
        break;
      }

      case "visa_status": {
        const { talent_user_id, old_status, new_status, talent_name } = payload;
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", talent_user_id)
          .single();
        if (!profile?.email) throw new Error("Profile not found");
        const email = visaStatusEmail(talent_name || "Talent", old_status, new_status);
        await sendEmail(profile.email, email.subject, email.html);
        break;
      }

      case "diploma_status": {
        const { talent_user_id, diploma_name, status } = payload;
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", talent_user_id)
          .single();
        if (!profile?.email) throw new Error("Profile not found");
        const email = diplomaVerifiedEmail(profile.full_name || "Talent", diploma_name, status);
        await sendEmail(profile.email, email.subject, email.html);
        break;
      }

      case "incomplete_reminder": {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: talents } = await supabase
          .from("talent_profiles")
          .select("user_id, full_name, compliance_score, created_at")
          .lt("compliance_score", 40)
          .lt("created_at", cutoff);

        if (!talents?.length) {
          console.log("[NOTIFICATION] No incomplete profiles to remind");
          break;
        }

        let sent = 0;
        for (const talent of talents) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", talent.user_id)
            .single();
          if (!profile?.email) continue;

          try {
            const email = incompleteProfileEmail(talent.full_name, profile.email);
            await sendEmail(profile.email, email.subject, email.html);
            sent++;
          } catch (e) {
            console.error(`[NOTIFICATION] Failed for ${profile.email}:`, e);
          }
        }
        console.log(`[NOTIFICATION] Sent ${sent} incomplete profile reminders`);
        break;
      }

      case "security_alert": {
        const { user_id, action, details, created_at } = payload;
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");
        if (!admins?.length) break;
        for (const admin of admins) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", admin.user_id)
            .single();
          if (!profile?.email) continue;
          const body = `
            <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
              <strong>⚠️ Alerte sécurité détectée</strong>
            </p>
            <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px;">
              <p style="margin:0 0 8px;font-weight:700;color:#991b1b;font-size:14px;">${action}</p>
              <pre style="margin:0;color:#64748b;font-size:12px;white-space:pre-wrap;">${JSON.stringify(details, null, 2)}</pre>
            </div>
            <p style="color:#64748b;font-size:13px;margin:0;">User ID: ${user_id}<br/>Date: ${created_at}</p>`;
          await sendEmail(profile.email, `🚨 Alerte sécurité AXIOM : ${action}`, wrapEmail("Alerte sécurité", action, body));
        }
        break;
      }

      // ── Demo test: send a test email to verify Gmail works ──
      case "demo_test": {
        const testHtml = wrapEmail(
          "Test démo AXIOM",
          "Email de test pour la présentation",
          `<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
            ✅ <strong>Fallback Gmail actif</strong> — Cet email confirme que le système d'envoi fonctionne correctement pour la démo du 17 mars 2026.
          </p>
          <p style="color:#64748b;font-size:13px;">Envoyé le ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>`
        );
        await sendEmail(
          payload?.to || GMAIL_USER,
          "✅ Test démo AXIOM – Fallback Gmail OK",
          testHtml
        );
        break;
      }

      case "profile_viewed": {
        const { talent_user_id, recruiter_name } = payload;
        // Check notifications enabled + anti-spam
        const pvEnabled = await isNotificationEnabled(supabase, talent_user_id);
        if (!pvEnabled) { console.log(`[NOTIFICATION] Notifications disabled for ${talent_user_id}`); break; }
        const pvCanSend = await canSendNotification(supabase, talent_user_id, "profile_viewed");
        if (!pvCanSend) { console.log(`[NOTIFICATION] Anti-spam: profile_viewed already sent today for ${talent_user_id}`); break; }

        const { data: pvProfile } = await supabase.from("profiles").select("email, full_name").eq("id", talent_user_id).single();
        if (!pvProfile?.email) { console.log(`[NOTIFICATION] No email for talent ${talent_user_id}`); break; }

        // Send email
        const pvEmail = profileViewedEmail(pvProfile.full_name || "Talent");
        await sendEmail(pvProfile.email, pvEmail.subject, pvEmail.html);
        // Insert in-app push notification
        await insertPushNotification(
          supabase,
          talent_user_id,
          "Un recruteur a consulté votre profil",
          "Un recruteur vient de voir votre profil ! C'est un signal très positif. Optimisez votre profil pour maximiser vos chances.",
          "profile_viewed",
          "/dashboard-talent?tab=profil"
        );
        await logNotification(supabase, talent_user_id, "profile_viewed");
        break;
      }

      case "sector_match": {
        const { talent_user_id, match_count, top_sector } = payload;
        const smEnabled = await isNotificationEnabled(supabase, talent_user_id);
        if (!smEnabled) { console.log(`[NOTIFICATION] Notifications disabled for ${talent_user_id}`); break; }
        const smCanSend = await canSendNotification(supabase, talent_user_id, "sector_match");
        if (!smCanSend) { console.log(`[NOTIFICATION] Anti-spam: sector_match already sent today for ${talent_user_id}`); break; }

        const { data: smProfile } = await supabase.from("profiles").select("email, full_name").eq("id", talent_user_id).single();
        if (!smProfile?.email) { console.log(`[NOTIFICATION] No email for talent ${talent_user_id}`); break; }

        const smEmail = sectorMatchEmail(smProfile.full_name || "Talent", match_count || 1, top_sector || "BTP");
        await sendEmail(smProfile.email, smEmail.subject, smEmail.html);
        await logNotification(supabase, talent_user_id, "sector_match");
        break;
      }

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[NOTIFICATION] ERROR: ${msg}`);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
