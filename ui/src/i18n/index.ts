import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enAgents from "./locales/en/agents.json";
import enIssues from "./locales/en/issues.json";
import enApprovals from "./locales/en/approvals.json";
import enSettings from "./locales/en/settings.json";
import enAdapters from "./locales/en/adapters.json";
import enDashboard from "./locales/en/dashboard.json";

import zhCommon from "./locales/zh/common.json";
import zhNavigation from "./locales/zh/navigation.json";
import zhAgents from "./locales/zh/agents.json";
import zhIssues from "./locales/zh/issues.json";
import zhApprovals from "./locales/zh/approvals.json";
import zhSettings from "./locales/zh/settings.json";
import zhAdapters from "./locales/zh/adapters.json";
import zhDashboard from "./locales/zh/dashboard.json";

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    agents: enAgents,
    issues: enIssues,
    approvals: enApprovals,
    settings: enSettings,
    adapters: enAdapters,
    dashboard: enDashboard,
  },
  zh: {
    common: zhCommon,
    navigation: zhNavigation,
    agents: zhAgents,
    issues: zhIssues,
    approvals: zhApprovals,
    settings: zhSettings,
    adapters: zhAdapters,
    dashboard: zhDashboard,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "paperclip.locale",
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
