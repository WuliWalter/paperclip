import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyPatternIcon } from "@/components/CompanyPatternIcon";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Clock3,
  ExternalLink,
  FlaskConical,
  KeyRound,
  Link2,
  Loader2,
  MailPlus,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

const fieldClassName =
  "w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500";
const panelClassName = "border border-zinc-800 bg-zinc-950/95 p-6";

function LabSection({
  eyebrow,
  title,
  description,
  accentClassName,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accentClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-border/70 bg-background/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-5",
        accentClassName,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusCard({
  icon,
  title,
  body,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  tone?: "default" | "warn" | "success" | "error";
}) {
  const toneClassName = {
    default: "border-border/70 bg-background/85",
    warn: "border-amber-400/40 bg-amber-500/[0.08]",
    success: "border-emerald-400/40 bg-emerald-500/[0.08]",
    error: "border-rose-400/40 bg-rose-500/[0.08]",
  }[tone];

  return (
    <Card className={cn("rounded-[24px] shadow-none", toneClassName)}>
      <CardHeader className="space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-current/10 bg-background/70 text-muted-foreground">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">{body}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function InviteLandingShell({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
      <div className="grid gap-px bg-zinc-800 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className={cn(panelClassName, "space-y-6 bg-zinc-950")}>{left}</section>
        <section className={cn(panelClassName, "h-full bg-zinc-950")}>{right}</section>
      </div>
    </div>
  );
}

function InviteSummaryPanel({
  title,
  description,
  inviteMessage,
  requestedAccess,
  signedInLabel,
}: {
  title: string;
  description: string;
  inviteMessage?: string;
  requestedAccess: string;
  signedInLabel?: string;
}) {
  const { t } = useTranslation("invites");
  return (
    <>
      <div className="flex items-start gap-4">
        <CompanyPatternIcon
          companyName="Acme Robotics"
          logoUrl="/api/invites/pcp_invite_test/logo"
          brandColor="#114488"
          className="h-16 w-16 rounded-none border border-zinc-800"
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t("uxLab.inviteSummary.invitedToJoin")}</p>
          <h3 className="mt-2 text-2xl font-semibold text-zinc-100">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">{description}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetaCard label={t("uxLab.inviteSummary.company")} value="Acme Robotics" />
        <MetaCard label={t("uxLab.inviteSummary.invitedBy")} value="Board User" />
        <MetaCard label={t("uxLab.inviteSummary.requestedAccess")} value={requestedAccess} />
        <MetaCard label={t("uxLab.inviteSummary.inviteExpires")} value="Mar 7, 2027" />
      </div>

      {inviteMessage ? (
        <div className="border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">{t("uxLab.inviteSummary.messageFromInviter")}</div>
          <p className="mt-2 text-sm leading-6 text-amber-50">{inviteMessage}</p>
        </div>
      ) : null}

      {signedInLabel ? (
        <div className="border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-50">
          {t("uxLab.inviteSummary.signedInAs", { label: signedInLabel })}
        </div>
      ) : null}
    </>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 p-3">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm text-zinc-100">{value}</div>
    </div>
  );
}

function InlineAuthPreview({
  mode,
  feedback,
  working,
}: {
  mode: "sign_up" | "sign_in";
  feedback?: { tone: "info" | "error"; text: string };
  working?: boolean;
}) {
  const { t } = useTranslation("invites");
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">
          {mode === "sign_up" ? t("uxLab.inlineAuth.createAccount") : t("uxLab.inlineAuth.signInToContinue")}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === "sign_up"
            ? t("uxLab.inlineAuth.createAccountDescription", { companyName: "Acme Robotics" })
            : t("uxLab.inlineAuth.signInDescription")}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "flex-1 border px-3 py-2 text-sm transition-colors",
            mode === "sign_up"
              ? "border-zinc-100 bg-zinc-100 text-zinc-950"
              : "border-zinc-800 text-zinc-300 hover:border-zinc-600",
          )}
        >
          {t("uxLab.inlineAuth.createAccountButton")}
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 border px-3 py-2 text-sm transition-colors",
            mode === "sign_in"
              ? "border-zinc-100 bg-zinc-100 text-zinc-950"
              : "border-zinc-800 text-zinc-300 hover:border-zinc-600",
          )}
        >
          {t("uxLab.inlineAuth.alreadyHaveAccount")}
        </button>
      </div>

      <form className="space-y-4">
        {mode === "sign_up" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">{t("uxLab.inlineAuth.name")}</span>
            <input name="name" className={fieldClassName} defaultValue="Jane Example" readOnly />
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">{t("uxLab.inlineAuth.email")}</span>
          <input name="email" type="email" className={fieldClassName} defaultValue="jane@example.com" readOnly />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">{t("uxLab.inlineAuth.password")}</span>
          <input name="password" type="password" className={fieldClassName} defaultValue="supersecret" readOnly />
        </label>
        {feedback ? (
          <p className={cn("text-xs", feedback.tone === "info" ? "text-amber-300" : "text-red-400")}>
            {feedback.text}
          </p>
        ) : null}
        <Button type="button" className="w-full rounded-none" disabled={working}>
          {working ? t("uxLab.agentRequest.submitRequest") : mode === "sign_in" ? t("uxLab.inlineAuth.signInAndContinue") : t("uxLab.inlineAuth.createAccountAndContinue")}
        </Button>
      </form>

      <p className="text-xs leading-5 text-zinc-500">
        {mode === "sign_up"
          ? t("uxLab.inlineAuth.alreadySignedUpHint")
          : t("uxLab.inlineAuth.noAccountHint")}
      </p>
    </div>
  );
}

function AgentRequestPreview() {
  const { t } = useTranslation("invites");
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">{t("uxLab.agentRequest.title")}</h3>
        <p className="mt-1 text-sm text-zinc-400">
          {t("uxLab.agentRequest.description", { companyName: "Acme Robotics" })}
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">{t("uxLab.agentRequest.agentName")}</span>
        <input className={fieldClassName} defaultValue="Acme Ops Agent" readOnly />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">{t("uxLab.agentRequest.adapterType")}</span>
        <select className={fieldClassName} defaultValue="codex_local" disabled>
          <option value="codex_local">Codex</option>
          <option value="claude_local">Claude Code</option>
          <option value="cursor">Cursor</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">{t("uxLab.agentRequest.capabilities")}</span>
        <textarea
          className={fieldClassName}
          rows={4}
          defaultValue="Reviews invites, triages requests, and keeps the board queue moving."
          readOnly
        />
      </label>
      <Button type="button" className="w-full rounded-none">
        {t("uxLab.agentRequest.submitRequest")}
      </Button>
    </div>
  );
}

function AcceptInvitePreview({
  autoAccept,
  isCurrentMember,
  error,
}: {
  autoAccept?: boolean;
  isCurrentMember?: boolean;
  error?: string;
}) {
  const { t } = useTranslation("invites");
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">{t("uxLab.acceptInvite.title")}</h3>
        <p className="mt-1 text-sm text-zinc-400">
          {autoAccept
            ? t("uxLab.acceptInvite.submittingDescription", { companyName: "Acme Robotics" })
            : isCurrentMember
              ? t("uxLab.acceptInvite.alreadyMemberDescription", { companyName: "Acme Robotics" })
              : t("uxLab.acceptInvite.submitOrCompleteDescription", { companyName: "Acme Robotics" })}
        </p>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {autoAccept ? (
        <div className="text-sm text-zinc-400">{t("uxLab.acceptInvite.submittingRequest")}</div>
      ) : (
        <Button type="button" className="w-full rounded-none" disabled={isCurrentMember}>
          {t("uxLab.acceptInvite.acceptInvite")}
        </Button>
      )}
    </div>
  );
}

function InviteResultPreview({
  title,
  description,
  claimSecret,
  onboardingTextUrl,
  joinedNow = false,
}: {
  title: string;
  description: string;
  claimSecret?: string;
  onboardingTextUrl?: string;
  joinedNow?: boolean;
}) {
  const { t } = useTranslation("invites");
  return (
    <div className="mx-auto max-w-md border border-zinc-800 bg-zinc-950 p-6 text-zinc-100">
      <div className="flex items-center gap-3">
        <CompanyPatternIcon
          companyName="Acme Robotics"
          logoUrl="/api/invites/pcp_invite_test/logo"
          brandColor="#114488"
          className="h-12 w-12 rounded-none border border-zinc-800"
        />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        <p className="text-sm text-zinc-400">{description}</p>
        {joinedNow ? (
          <Button type="button" className="w-full rounded-none">
            {t("uxLab.inviteResult.openBoard")}
          </Button>
        ) : (
          <>
            <div className="border border-zinc-800 p-3">
              <p className="mb-1 text-xs text-zinc-500">{t("uxLab.inviteResult.approvalPage")}</p>
              <a className="text-sm text-zinc-200 underline underline-offset-2" href="/company/settings/access">
                {t("uxLab.inviteResult.companySettingsAccess")}
              </a>
            </div>
            <p className="text-xs text-zinc-500">
              {t("uxLab.inviteResult.refreshHint")}
            </p>
          </>
        )}
        {claimSecret ? (
          <div className="space-y-1 border border-zinc-800 p-3 text-xs text-zinc-400">
            <div className="text-zinc-200">{t("uxLab.inviteResult.claimSecret")}</div>
            <div className="font-mono break-all">{claimSecret}</div>
            <div className="font-mono break-all">POST /api/agents/claim-api-key</div>
          </div>
        ) : null}
        {onboardingTextUrl ? (
          <div className="text-xs text-zinc-400">
            {t("uxLab.inviteResult.onboarding")} <span className="font-mono break-all">{onboardingTextUrl}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AuthScreenPreview({ mode, error }: { mode: "sign_in" | "sign_up"; error?: string }) {
  const { t } = useTranslation("invites");
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-px bg-border/60 md:grid-cols-2">
        <div className="flex min-h-[420px] flex-col justify-center bg-background px-8 py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("uxLab.authScreen.paperclip")}</span>
            </div>
            <h3 className="text-xl font-semibold">
              {mode === "sign_in" ? t("uxLab.authScreen.signInTitle") : t("uxLab.authScreen.signUpTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "sign_in"
                ? t("uxLab.authScreen.signInDescription")
                : t("uxLab.authScreen.signUpDescription")}
            </p>
            <div className="mt-6 space-y-4">
              {mode === "sign_up" ? (
                <label className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">{t("uxLab.authScreen.name")}</span>
                  <input
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                    defaultValue="Jane Example"
                    readOnly
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">{t("uxLab.authScreen.email")}</span>
                <input
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  defaultValue="jane@example.com"
                  readOnly
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">{t("uxLab.authScreen.password")}</span>
                <input
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  defaultValue="supersecret"
                  readOnly
                />
              </label>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <Button type="button" className="w-full">
                {mode === "sign_in" ? t("uxLab.authScreen.signInButton") : t("uxLab.authScreen.createAccountButton")}
              </Button>
            </div>
            <div className="mt-5 text-sm text-muted-foreground">
              {mode === "sign_in" ? t("uxLab.authScreen.needAccount") : t("uxLab.authScreen.alreadyHaveAccount")}{" "}
              <span className="font-medium text-foreground underline underline-offset-2">
                {mode === "sign_in" ? t("uxLab.authScreen.createOne") : t("uxLab.authScreen.signInLink")}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden min-h-[420px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.18),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,1))] px-8 py-10 md:flex">
          <div className="max-w-sm space-y-4 text-zinc-200">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200">
              {t("uxLab.authPreview.badge")}
            </div>
            <div className="text-2xl font-semibold">{t("uxLab.authPreview.title")}</div>
            <p className="text-sm leading-6 text-zinc-400">
              {t("uxLab.authPreview.description")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyInvitesPreview() {
  const { t } = useTranslation("invites");

  const inviteRoleOptions = [
    {
      value: "viewer",
      label: t("companyInvites.role.viewer.label"),
      description: t("companyInvites.role.viewer.description"),
      gets: t("companyInvites.role.viewer.gets"),
    },
    {
      value: "operator",
      label: t("companyInvites.role.operator.label"),
      description: t("companyInvites.role.operator.description"),
      gets: t("companyInvites.role.operator.gets"),
    },
    {
      value: "admin",
      label: t("companyInvites.role.admin.label"),
      description: t("companyInvites.role.admin.description"),
      gets: t("companyInvites.role.admin.gets"),
    },
    {
      value: "owner",
      label: t("companyInvites.role.owner.label"),
      description: t("companyInvites.role.owner.description"),
      gets: t("companyInvites.role.owner.gets"),
    },
  ] as const;

  const inviteHistory = [
    {
      id: "invite-active",
      state: "Active",
      humanRole: "operator",
      invitedBy: "Board User 25",
      email: "board25@paperclip.local",
      createdAt: "Apr 25, 2026, 9:00 AM",
      action: "Revoke",
      relatedLabel: "Review request",
    },
    {
      id: "invite-accepted",
      state: "Accepted",
      humanRole: "viewer",
      invitedBy: "Board User 24",
      email: "board24@paperclip.local",
      createdAt: "Apr 24, 2026, 8:15 AM",
      action: "Inactive",
      relatedLabel: "—",
    },
    {
      id: "invite-revoked",
      state: "Revoked",
      humanRole: "admin",
      invitedBy: "Board User 20",
      email: "board20@paperclip.local",
      createdAt: "Apr 20, 2026, 2:45 PM",
      action: "Inactive",
      relatedLabel: "—",
    },
    {
      id: "invite-expired",
      state: "Expired",
      humanRole: "owner",
      invitedBy: "Board User 19",
      email: "board19@paperclip.local",
      createdAt: "Apr 19, 2026, 7:10 PM",
      action: "Inactive",
      relatedLabel: "—",
    },
  ] as const;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <Card className="rounded-[28px] shadow-none">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MailPlus className="h-4 w-4" />
            {t("uxLab.companyInvitesPreview.title")}
          </div>
          <div>
            <CardTitle>{t("uxLab.companyInvitesPreview.createInvite")}</CardTitle>
            <CardDescription className="mt-2">
              {t("uxLab.companyInvitesPreview.createInviteDescription")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t("uxLab.companyInvitesPreview.chooseRole")}</legend>
            <div className="rounded-2xl border border-border">
              {inviteRoleOptions.map((option, index) => (
                <label
                  key={option.value}
                  className={cn("flex cursor-default gap-3 px-4 py-4", index > 0 && "border-t border-border")}
                >
                  <input
                    type="radio"
                    readOnly
                    checked={option.value === "operator"}
                    className="mt-1 h-4 w-4 border-border text-foreground"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.value === "operator" ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          {t("companyInvites.role.operator.defaultBadge")}
                        </span>
                      ) : null}
                    </span>
                    <span className="block max-w-2xl text-sm text-muted-foreground">{option.description}</span>
                    <span className="block text-sm text-foreground">{option.gets}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
            {t("uxLab.companyInvitesPreview.singleUseNote")}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button">{t("uxLab.companyInvitesPreview.createButton")}</Button>
            <span className="text-sm text-muted-foreground">{t("uxLab.companyInvitesPreview.historyNote")}</span>
          </div>

          <div className="space-y-3 rounded-2xl border border-border px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{t("uxLab.companyInvitesPreview.latestInvite")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("uxLab.companyInvitesPreview.domainNote")}
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                <Check className="h-3.5 w-3.5" />
                {t("uxLab.companyInvitesPreview.copied")}
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-md border border-border bg-muted/60 px-3 py-2 text-left text-sm break-all"
            >
              https://paperclip.local/invite/new-token
            </button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline">
                <ExternalLink className="h-4 w-4" />
                {t("uxLab.companyInvitesPreview.openInvite")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] shadow-none">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t("uxLab.companyInvitesPreview.inviteHistory")}</CardTitle>
              <CardDescription className="mt-2">
                {t("uxLab.companyInvitesPreview.historyDescription")}
              </CardDescription>
            </div>
            <a href="/inbox/requests" className="text-sm underline underline-offset-4">
              {t("uxLab.companyInvitesPreview.openQueue")}
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("companyInvites.history.columns.state")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("companyInvites.history.columns.role")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("companyInvites.history.columns.invitedBy")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("companyInvites.history.columns.created")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("companyInvites.history.columns.joinRequest")}</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t("companyInvites.history.columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {inviteHistory.map((invite) => (
                  <tr key={invite.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-3 align-top">
                      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {invite.state}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-top">{invite.humanRole}</td>
                    <td className="px-5 py-3 align-top">
                      <div>{invite.invitedBy}</div>
                      <div className="text-xs text-muted-foreground">{invite.email}</div>
                    </td>
                    <td className="px-5 py-3 align-top text-muted-foreground">{invite.createdAt}</td>
                    <td className="px-5 py-3 align-top">
                      {invite.relatedLabel === "Review request" ? (
                        <a href="/inbox/requests" className="underline underline-offset-4">
                          {invite.relatedLabel}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{invite.relatedLabel}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right align-top">
                      {invite.action === "Revoke" ? (
                        <Button type="button" size="sm" variant="outline">
                          {t("companyInvites.history.revoke")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("companyInvites.history.inactive")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-4">
              <div className="text-sm font-medium">{t("uxLab.companyInvitesPreview.emptyHistory")}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {t("uxLab.companyInvitesPreview.emptyHistoryDescription")}
              </div>
            </div>
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/[0.07] p-4">
              <div className="text-sm font-medium text-foreground">{t("uxLab.companyInvitesPreview.permissionError")}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {t("uxLab.companyInvitesPreview.permissionErrorDescription")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InviteUxLab() {
  const { t } = useTranslation("invites");

  const coveredStates = [
    t("uxLab.coveredStates.items.0"),
    t("uxLab.coveredStates.items.1"),
    t("uxLab.coveredStates.items.2"),
    t("uxLab.coveredStates.items.3"),
    t("uxLab.coveredStates.items.4"),
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,rgba(8,145,178,0.10),transparent_28%),linear-gradient(180deg,rgba(245,158,11,0.10),transparent_44%),var(--background)] shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="p-6 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
              <FlaskConical className="h-3.5 w-3.5" />
              {t("uxLab.badge")}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("uxLab.title")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t("uxLab.description")}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                {t("uxLab.tags.route")}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                {t("uxLab.tags.signupInvite")}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                {t("uxLab.tags.fixture")}
              </Badge>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-background/70 p-6 lg:border-l lg:border-t-0">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("uxLab.coveredStates.title")}
            </div>
            <div className="space-y-3">
              {coveredStates.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <LabSection
        eyebrow={t("uxLab.topLevelStates.eyebrow")}
        title={t("uxLab.topLevelStates.title")}
        description={t("uxLab.topLevelStates.description")}
        accentClassName="bg-[linear-gradient(180deg,rgba(59,130,246,0.05),transparent_30%),var(--background)]"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            icon={<Loader2 className="h-4 w-4 animate-spin" />}
            title={t("uxLab.statusCards.loadingInvite.title")}
            body={t("uxLab.statusCards.loadingInvite.body")}
          />
          <StatusCard
            icon={<Clock3 className="h-4 w-4" />}
            title={t("uxLab.statusCards.checkingAccess.title")}
            body={t("uxLab.statusCards.checkingAccess.body")}
          />
          <StatusCard
            icon={<KeyRound className="h-4 w-4" />}
            title={t("uxLab.statusCards.invalidToken.title")}
            body={t("uxLab.statusCards.invalidToken.body")}
            tone="error"
          />
          <StatusCard
            icon={<Link2 className="h-4 w-4" />}
            title={t("uxLab.statusCards.notAvailable.title")}
            body={t("uxLab.statusCards.notAvailable.body")}
            tone="warn"
          />
          <StatusCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title={t("uxLab.statusCards.bootstrapComplete.title")}
            body={t("uxLab.statusCards.bootstrapComplete.body")}
            tone="success"
          />
          <StatusCard
            icon={<ArrowRight className="h-4 w-4" />}
            title={t("uxLab.statusCards.autoAccept.title")}
            body={t("uxLab.statusCards.autoAccept.body")}
          />
          <StatusCard
            icon={<Users className="h-4 w-4" />}
            title={t("uxLab.statusCards.alreadyMember.title")}
            body={t("uxLab.statusCards.alreadyMember.body")}
          />
          <StatusCard
            icon={<UserPlus className="h-4 w-4" />}
            title={t("uxLab.statusCards.resultSurfaces.title")}
            body={t("uxLab.statusCards.resultSurfaces.body")}
            tone="success"
          />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLab.inviteLanding.eyebrow")}
        title={t("uxLab.inviteLanding.title")}
        description={t("uxLab.inviteLanding.description")}
        accentClassName="bg-[linear-gradient(180deg,rgba(234,179,8,0.06),transparent_28%),var(--background)]"
      >
        <div className="space-y-5">
          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLab.inviteSummary.joinCompany", { companyName: "Acme Robotics" })}
                description={t("uxLab.inviteSummary.createAccountDescription")}
                inviteMessage="Welcome aboard."
                requestedAccess="Operator"
              />
            }
            right={<InlineAuthPreview mode="sign_up" />}
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLab.inviteSummary.joinCompany", { companyName: "Acme Robotics" })}
                description={t("uxLab.inviteSummary.createAccountDescription")}
                inviteMessage="Welcome aboard."
                requestedAccess="Operator"
              />
            }
            right={
              <InlineAuthPreview
                mode="sign_in"
                feedback={{
                  tone: "info",
                  text: "An account already exists for jane@example.com. Sign in below to continue with this invite.",
                }}
              />
            }
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLab.inviteSummary.joinCompany", { companyName: "Acme Robotics" })}
                description={t("uxLab.inviteSummary.readyDescription")}
                inviteMessage="Welcome aboard."
                requestedAccess="Operator"
                signedInLabel="Jane Example"
              />
            }
            right={<AcceptInvitePreview autoAccept />}
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLab.inviteSummary.joinCompany", { companyName: "Acme Robotics" })}
                description={t("uxLab.inviteSummary.reviewAgentDescription")}
                requestedAccess="Agent join request"
              />
            }
            right={<AgentRequestPreview />}
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLab.inviteSummary.joinCompany", { companyName: "Acme Robotics" })}
                description={t("uxLab.inviteSummary.readyDescription")}
                requestedAccess="Operator"
                signedInLabel="Jane Example"
              />
            }
            right={<AcceptInvitePreview error="This account already belongs to the company." isCurrentMember />}
          />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLab.resultStates.eyebrow")}
        title={t("uxLab.resultStates.title")}
        description={t("uxLab.resultStates.description")}
        accentClassName="bg-[linear-gradient(180deg,rgba(16,185,129,0.06),transparent_30%),var(--background)]"
      >
        <div className="grid gap-5 xl:grid-cols-3">
          <InviteResultPreview
            title={t("uxLab.inviteResult.requestToJoin", { companyName: "Acme Robotics" })}
            description={t("uxLab.inviteResult.approverMustApprove", { inviter: "Board User" })}
            claimSecret="pcp_claim_secret_demo"
            onboardingTextUrl="/api/invites/pcp_invite_test/onboarding.txt"
          />
          <InviteResultPreview
            title={t("uxLab.inviteResult.joinedNow")}
            description={t("uxLab.inviteResult.joinedNowDescription")}
            joinedNow
          />
          <InviteResultPreview
            title={t("uxLab.inviteResult.requestToJoin", { companyName: "Acme Robotics" })}
            description={t("uxLab.inviteResult.askToVisit")}
          />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLab.standaloneAuth.eyebrow")}
        title={t("uxLab.standaloneAuth.title")}
        description={t("uxLab.standaloneAuth.description")}
        accentClassName="bg-[linear-gradient(180deg,rgba(168,85,247,0.06),transparent_28%),var(--background)]"
      >
        <div className="space-y-5">
          <AuthScreenPreview mode="sign_in" error="Invalid email or password" />
          <AuthScreenPreview mode="sign_up" />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLab.companySettings.eyebrow")}
        title={t("uxLab.companySettings.title")}
        description={t("uxLab.companySettings.description")}
        accentClassName="bg-[linear-gradient(180deg,rgba(244,114,182,0.06),transparent_28%),var(--background)]"
      >
        <CompanyInvitesPreview />
      </LabSection>
    </div>
  );
}
