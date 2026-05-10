import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  CompanySkillDetail,
  CompanySkillFileDetail,
  CompanySkillListItem,
} from "@paperclipai/shared";

import type { SkillTranslation, SkillTranslationMap } from "./types";
import { zhSkillTranslations } from "./zh";

const ZH_EMPHASIS = `> **使用中文作为工作语言**
>
> 在与人类沟通、撰写文档、PR 描述、提交说明、issue 评论以及任何面向用户的产出物时,请使用简体中文。代码标识符、命令、API 端点、环境变量等技术符号保持英文,不要硬翻译。`;

function splitFrontmatter(markdown: string): { frontmatter: string | null; body: string } {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: null, body: normalized };
  }
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) {
    return { frontmatter: null, body: normalized };
  }
  return {
    frontmatter: normalized.slice(4, closing).trim(),
    body: normalized.slice(closing + 5).trimStart(),
  };
}

function rebuildContent(frontmatter: string | null, body: string) {
  if (!frontmatter) return body;
  return `---\n${frontmatter}\n---\n\n${body}`;
}

function getMap(language: string): SkillTranslationMap | null {
  if (language.startsWith("zh")) return zhSkillTranslations;
  return null;
}

function lookup(map: SkillTranslationMap | null, slug: string | null | undefined): SkillTranslation | undefined {
  if (!map || !slug) return undefined;
  return map[slug];
}

export function useSkillContentTranslator() {
  const { i18n } = useTranslation();
  const language = i18n.language ?? "en";
  const isZh = language.startsWith("zh");
  const map = useMemo(() => getMap(language), [language]);

  return useMemo(
    () => ({
      isZh,
      translateListItem<T extends CompanySkillListItem>(item: T): T {
        if (!map) return item;
        const t = lookup(map, item.slug);
        if (!t) return item;
        return {
          ...item,
          name: t.name ?? item.name,
          description: t.description ?? item.description,
        };
      },
      translateDetail<T extends CompanySkillDetail | null | undefined>(detail: T): T {
        if (!map || !detail) return detail;
        const t = lookup(map, detail.slug);
        if (!t) return detail;
        return {
          ...detail,
          name: t.name ?? detail.name,
          description: t.description ?? detail.description,
        };
      },
      translateFile(
        file: CompanySkillFileDetail | null | undefined,
        skillSlug: string | null | undefined,
      ): CompanySkillFileDetail | null | undefined {
        if (!isZh || !file || !file.markdown) return file;
        if (file.path !== "SKILL.md") return file;
        const t = lookup(map, skillSlug);
        const { frontmatter, body: originalBody } = splitFrontmatter(file.content);
        const baseBody = t?.body ?? originalBody;
        const newBody = `${ZH_EMPHASIS}\n\n${baseBody}`;
        return {
          ...file,
          content: rebuildContent(frontmatter, newBody),
        };
      },
    }),
    [isZh, map],
  );
}
