export function codeLanguageLabel(language?: string): string {
  const key = language?.toLowerCase() ?? "";
  const names: Record<string, string> = { html: "HTML", htm: "HTML", xml: "XML", svg: "SVG", css: "CSS", scss: "SCSS", javascript: "JavaScript", js: "JavaScript", typescript: "TypeScript", ts: "TypeScript", jsx: "JSX", tsx: "TSX", java: "Java", cpp: "C++", "c++": "C++", c: "C", csharp: "C#", python: "Python", py: "Python", json: "JSON", bash: "Bash", shell: "Shell", sql: "SQL", rust: "Rust", go: "Go", php: "PHP", ruby: "Ruby", swift: "Swift", kotlin: "Kotlin" };
  return names[key] ?? (key ? key[0].toUpperCase() + key.slice(1) : "Code");
}