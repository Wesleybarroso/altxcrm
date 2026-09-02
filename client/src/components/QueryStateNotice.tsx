import React from "react";
import { AlertTriangle, Loader2, Inbox } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type QueryStateNoticeProps = {
  isLoading?: boolean;
  isError?: boolean;
  empty?: boolean;
  label: string;
};

export default function QueryStateNotice({ isLoading = false, isError = false, empty = false, label }: QueryStateNoticeProps) {
  const { language, t } = useLanguage();
  const translatedLabel = language === "pt-BR" ? label : t(label.charAt(0).toUpperCase() + label.slice(1));
  if (!isLoading && !isError && !empty) return null;
  if (isLoading) return <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#31584e] bg-[#0d2323] px-4 py-3 text-xs text-[#9fc5a9]" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#c8ff4f]" />{t("Sincronizando")} {translatedLabel}…</div>;
  if (isError) return <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#6b4b3c] bg-[#2a1c1b] px-4 py-3 text-xs text-[#f0b59e]" role="alert"><AlertTriangle className="h-3.5 w-3.5" />{t("Não foi possível carregar")} {translatedLabel}. {t("Verifique a conexão do backend e tente novamente.")}</div>;
  return <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-[#31584e] bg-[#0d2323] px-4 py-3 text-xs text-[#86a99a]"><Inbox className="h-3.5 w-3.5 text-[#9ad384]" />{t("Nenhum registro de")} {translatedLabel} {t("foi persistido ainda.")}</div>;
}
