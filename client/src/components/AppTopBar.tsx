import { Bell, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { LanguageSelect, useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

export default function AppTopBar({ eyebrow, title, description, actionLabel, onAction, actionDisabled = false }: { eyebrow: string; title: ReactNode; description?: string; actionLabel?: string; onAction?: () => void; actionDisabled?: boolean }) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const activityFeedQuery = trpc.workspace.activityFeed.useQuery({ limit: 10 }, { refetchInterval: 15000, staleTime: 5000 });
  const activityCount = activityFeedQuery.data?.length ?? 0;
  return (
    <header className="flex flex-col gap-6 border-b border-[#20403e] px-5 py-6 sm:px-8 lg:flex-row lg:items-start lg:justify-between lg:px-12">
      <div>
        <div className="micro-label mb-3 flex items-center gap-2 text-[#a4d595]"><span className="h-1.5 w-1.5 rounded-full bg-[#c8ff4f] shadow-[0_0_14px_#c8ff4f]" />{t(eyebrow)}</div>
        <h1 className="display-font max-w-2xl text-4xl leading-[0.95] tracking-tight text-[#f2f4eb] sm:text-5xl">{typeof title === "string" ? t(title) : title}</h1>
        {description && <p className="mt-4 max-w-xl text-sm leading-6 text-[#7fa194]">{t(description)}</p>}
      </div>
      <div className="flex items-center gap-2 lg:pt-1"><LanguageSelect />
        <Button variant="ghost" size="icon" className="action-button h-10 w-10 rounded-lg text-[#8eafa1] hover:bg-[#112a2a] hover:text-[#c8ff4f]" aria-label="Pesquisar"><Search className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setLocation("/archive")} className="action-button relative h-10 w-10 rounded-lg text-[#8eafa1] hover:bg-[#112a2a] hover:text-[#c8ff4f]" aria-label={`${t("Notificações")}: ${activityCount}`} title={t("Abrir atividades recentes")}><Bell className="h-4 w-4" />{activityCount > 0 && <span className="absolute right-1.5 top-1.5 grid min-h-1.5 min-w-1.5 place-items-center rounded-full bg-[#c8ff4f] px-1 text-[8px] font-bold text-[#112119]">{activityCount > 9 ? "9+" : activityCount}</span>}</Button>
        {actionLabel && <Button onClick={onAction} disabled={actionDisabled} className="action-button ml-2 h-10 rounded-lg bg-[#c8ff4f] px-4 text-xs font-bold text-[#112119] hover:bg-[#ddff8b]"><Sparkles className="mr-2 h-3.5 w-3.5" />{actionDisabled ? t("Processando…") : t(actionLabel)}</Button>}
      </div>
    </header>
  );
}
