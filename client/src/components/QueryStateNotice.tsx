import { AlertTriangle, Loader2, Inbox } from "lucide-react";

type QueryStateNoticeProps = {
  isLoading?: boolean;
  isError?: boolean;
  empty?: boolean;
  label: string;
};

export default function QueryStateNotice({ isLoading = false, isError = false, empty = false, label }: QueryStateNoticeProps) {
  if (!isLoading && !isError && !empty) return null;
  if (isLoading) return <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#31584e] bg-[#0d2323] px-4 py-3 text-xs text-[#9fc5a9]" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#c8ff4f]" />Sincronizando {label}…</div>;
  if (isError) return <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#6b4b3c] bg-[#2a1c1b] px-4 py-3 text-xs text-[#f0b59e]" role="alert"><AlertTriangle className="h-3.5 w-3.5" />Não foi possível carregar {label}. Verifique a conexão do backend e tente novamente.</div>;
  return <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-[#31584e] bg-[#0d2323] px-4 py-3 text-xs text-[#86a99a]"><Inbox className="h-3.5 w-3.5 text-[#9ad384]" />Nenhum registro de {label} foi persistido ainda.</div>;
}
