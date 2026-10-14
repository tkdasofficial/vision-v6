import { Mail, Youtube, Cloud, Calendar, Github, MessageSquare, FileText, Globe, type LucideIcon } from "lucide-react";

export type Plugin = { name: string; description: string; icon: LucideIcon };

/** Single plugin list shared by the Plugins page and the chat "@" picker. */
export const PLUGINS: Plugin[] = [
  { name: "Web Search", description: "Search the web for current info", icon: Globe },
  { name: "Gmail", description: "Read and manage email", icon: Mail },
  { name: "YouTube", description: "Videos and channels", icon: Youtube },
  { name: "Google Drive", description: "Drive, Docs, Sheets or Slides", icon: Cloud },
  { name: "Google Calendar", description: "Events and schedules", icon: Calendar },
  { name: "GitHub", description: "Repositories, issues and code", icon: Github },
  { name: "Slack", description: "Channels and messages", icon: MessageSquare },
  { name: "Notion", description: "Pages and workspaces", icon: FileText },
];

/** Finds an active "@query" right before the caret (start of text or after whitespace). */
export function findMention(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const m = /(^|\s)@([^@\n]{0,30})$/.exec(before);
  if (!m) return null;
  const query = m[2];
  if (/\s{2,}/.test(query)) return null;
  return { start: before.length - query.length - 1, query };
}

export function filterPlugins(query: string): Plugin[] {
  const q = query.trim().toLowerCase();
  return PLUGINS.filter((p) => p.name.toLowerCase().includes(q));
}

/** Replaces the "@query" at start..caret with "@Name ". */
export function insertMention(text: string, start: number, caret: number, name: string) {
  const insert = `@${name} `;
  return { text: text.slice(0, start) + insert + text.slice(caret), caret: start + insert.length };
}
