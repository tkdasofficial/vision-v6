import { RefreshCw, CircleHelp } from "lucide-react";
import { useMemo, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import FloatingWorkspacePage from "@/components/floating-workspace-page";
import { Button } from "@/components/ui/button";
import { PLUGINS as services } from "@/lib/plugins";

export default function Plugins() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => services.filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <FloatingWorkspacePage title="Plugins" query={query} onQueryChange={setQuery} menu={[{ label: "Refresh", icon: RefreshCw, onSelect: () => window.location.reload() }, { label: "Help & FAQ", icon: CircleHelp, onSelect: () => window.location.assign("/help/faq") }]}>
    <h2 className="mb-3 flex items-center gap-1 text-lg font-semibold text-muted-foreground">Popular <ChevronRight className="size-5" /></h2>
    <div className="space-y-1">
      {filtered.map(({ name, description, icon: Icon }) => <div key={name} className="flex items-center gap-3 py-2">
        <span className="drawer-floating flex size-11 shrink-0 items-center justify-center rounded-full"><Icon className="size-5 text-foreground" /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{name}</p><p className="truncate text-xs text-muted-foreground">{description}</p></div>
        <Button variant="floating" size="icon" type="button" aria-label={`Add ${name}`} title={`Add ${name}`} onClick={() => toast.error(`${name} isn't available yet.`)} className="size-11 shrink-0 rounded-full"><Plus className="size-5" /></Button>
      </div>)}
    </div>
    {filtered.length === 0 && <p className="py-16 text-center text-muted-foreground">No plugins found</p>}
  </FloatingWorkspacePage>;
}
