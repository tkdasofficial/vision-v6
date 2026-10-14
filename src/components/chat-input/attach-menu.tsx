import { Image as ImageIcon, Clapperboard, Paperclip, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "@/lib/router-compat";

export type AttachKind = "image" | "video" | "file";

export const ACCEPT: Record<AttachKind, string> = {
  image: "image/*",
  video: "video/*,.mp4,.webm,.avi,.mov,.mkv",
  file: ".zip,application/zip,audio/*,image/*,.txt,.pdf,.docx,.xlsx,.xlsm,.html,.htm,.md,.csv,.tsv,.json,.yaml,.yml,.xml,.log,.js,.ts,.tsx,.jsx,.py,.css,.sql,.mp3,.wav,.ogg,.aac,.flac,.m4a,.svg,.epub",
};

/** "+" button opening Image / Video / File / Plugins. */
export default function AttachMenu({ onPick, imageOnly }: { onPick: (kind: AttachKind) => void; imageOnly?: boolean }) {
  const navigate = useNavigate();
  const items = [
    { kind: "image" as const, label: "Image", icon: ImageIcon },
    ...(imageOnly ? [] : [
      { kind: "video" as const, label: "Video", icon: Clapperboard },
      { kind: "file" as const, label: "File", icon: Paperclip },
    ]),
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Add attachment" title="Add attachment"
          className="size-8 shrink-0 rounded-full p-0 border border-border text-muted-foreground hover:text-foreground hover:bg-accent [&_svg]:size-[18px]">
          <Paperclip className="w-[18px] h-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-60 rounded-[1.75rem] border-border bg-card p-2 shadow-xl">
        {items.map(({ kind, label, icon: Icon }) => (
          <DropdownMenuItem key={kind} onSelect={() => onPick(kind)} className="gap-3 rounded-2xl px-2 py-2 text-[15px] font-medium">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Icon className="size-5 text-foreground" /></span>{label}
          </DropdownMenuItem>
        ))}
        {!imageOnly && (
          <DropdownMenuItem onSelect={() => navigate("/integrations")} className="gap-3 rounded-2xl px-2 py-2 text-[15px] font-medium">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary"><AtSign className="size-5 text-foreground" /></span>Plugins
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
