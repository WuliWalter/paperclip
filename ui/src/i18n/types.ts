import "react-i18next";
import type enCommon from "./locales/en/common.json";
import type enNavigation from "./locales/en/navigation.json";
import type enAgents from "./locales/en/agents.json";
import type enIssues from "./locales/en/issues.json";
import type enApprovals from "./locales/en/approvals.json";
import type enSettings from "./locales/en/settings.json";
import type enAdapters from "./locales/en/adapters.json";
import type enDashboard from "./locales/en/dashboard.json";
import type enInbox from "./locales/en/inbox.json";
import type enActivity from "./locales/en/activity.json";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof enCommon;
      navigation: typeof enNavigation;
      agents: typeof enAgents;
      issues: typeof enIssues;
      approvals: typeof enApprovals;
      settings: typeof enSettings;
      adapters: typeof enAdapters;
      dashboard: typeof enDashboard;
      inbox: typeof enInbox;
      activity: typeof enActivity;
    };
  }
}
