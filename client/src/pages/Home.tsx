import AppTopBar from "@/components/AppTopBar";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, AtSign, ChevronRight, Clock3, FolderArchive, Globe2, Inbox, MoreHorizontal, PlugZap, ShieldCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const weeklyUsage = [42, 58, 51, 72, 63, 80, 68];
const recentMessages = [
  { initials: "MC", name: "Marina Costa", subject: "Briefing da campanha de setembro", mailbox: "marina@altx.io", time: "09:42", color: "#b8e86c" },
  { initials: "NF", name: "Núcleo Financeiro", subject: "Documentos fiscais — fechamento mensal", mailbox: "financeiro@altx.io", time: "08:17", color: "#7bd6c0" },
  { initials: "JP", name: "João Pedro", subject: "Re: Acesso ao ambiente de homologação", mailbox: "joao@altx.io", time: "Ontem", color: "#e2bf70" },
  { initials: "AS", name: "Ana Souza", subject: "Convite: reunião de operação", mailbox: "ana@altx.io", time: "Ontem", color: "#80bce3" },
];
const demoActivityItems: { title: string; detail: string; time: string; Icon: LucideIcon }[] = [
  { title: "Nova caixa postal criada", detail: "suporte@altx.io", time: "há 12 min", Icon: AtSign },
  { title: "Domínio verificado", detail: "altx.io", time: "há 46 min", Icon: Globe2 },
  { title: "Webhook testado com sucesso", detail: "n8n / inbound-mail", time: "há 1 h", Icon: PlugZap },
  { title: "E-mail agendado", detail: "newsletter@altx.io", time: "há 2 h", Icon: Clock3 },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [range, setRange] = useState("7 dias");
  const snapshotQuery = trpc.workspace.snapshot.useQuery();
  const liveDomains = snapshotQuery.data?.domains ?? [];
  const liveMailboxes = snapshotQuery.data?.mailboxes ?? [];
  const liveMessages = snapshotQuery.data?.messages ?? [];
  const liveActivities = snapshotQuery.data?.activities ?? [];
  const recentMessagesView = useMemo(() => liveMessages.length ? liveMessages.slice(0, 4).map((message, index) => ({ initials: (message.senderName || message.senderEmail).slice(0, 2).toUpperCase(), name: message.senderName || message.senderEmail, subject: message.subject, mailbox: message.senderEmail, time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "agora", color: ["#b8e86c", "#7bd6c0", "#e2bf70", "#80bce3"][index % 4] })) : recentMessages, [liveMessages]);
  const activityItems = useMemo(() => liveActivities.length ? liveActivities.slice(0, 4).map((item) => ({ title: item.action, detail: item.detail || item.resourceType, time: item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "agora", Icon: item.resourceType === "domain" ? Globe2 : item.resourceType === "webhook" ? PlugZap : item.resourceType === "message" ? Inbox : AtSign })) : demoActivityItems, [liveActivities]);
  const domainCount = liveDomains.length || 4;
  const mailboxCount = liveMailboxes.length || 24;
  const unreadCount = liveMessages.filter((message) => !message.isRead).length;
  const usedStorage = liveMailboxes.reduce((total, mailbox) => total + (mailbox.usedGb || 0), 0) || 136;
  const storageLimit = snapshotQuery.data?.settings?.storageLimitGb || 200;
  const storagePercent = Math.min(100, Math.round((usedStorage / storageLimit) * 100));
  return (
    <div className="editorial-grid editorial-glow min-h-screen bg-[#071013] text-[#f0f4eb]">
      <AppTopBar eyebrow="Workspace / visão geral" title={<>Infraestrutura clara para <em className="text-[#c8ff4f]">mensagens que importam.</em></>} description="Um centro de comando para os domínios, caixas postais e integrações da sua operação de e-mail corporativo." actionLabel="Nova caixa postal" onAction={() => setLocation("/mailboxes")} />
      <div className="px-5 py-7 sm:px-8 lg:px-12">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="micro-label mb-2 text-[#567d70]">01 / Sinal da operação</div><p className="text-sm text-[#89a99b]">{snapshotQuery.isFetching ? "Sincronizando o workspace..." : snapshotQuery.isError ? "Visualização inicial ativa · conecte a API da VPS em Configurações." : "Bom dia, seu workspace está funcionando dentro do esperado."}</p></div><div className="flex items-center gap-2 rounded-lg border border-[#2a4d47] bg-[#0c1e20] p-1"><button onClick={() => setRange("7 dias")} className={`rounded-md px-3 py-1.5 text-xs ${range === "7 dias" ? "bg-[#c8ff4f] font-bold text-[#112119]" : "text-[#87a89a]"}`}>7 dias</button><button onClick={() => setRange("30 dias")} className={`rounded-md px-3 py-1.5 text-xs ${range === "30 dias" ? "bg-[#c8ff4f] font-bold text-[#112119]" : "text-[#87a89a]"}`}>30 dias</button></div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Domínios ativos" value={domainCount.toString().padStart(2, "0")} detail={liveDomains.length ? `${liveDomains.filter((item) => item.status === "verified").length} verificados` : "Todos verificados"} icon={Globe2} /><MetricCard label="Caixas postais" value={mailboxCount.toString().padStart(2, "0")} detail={liveMailboxes.length ? `${liveMailboxes.filter((item) => item.status === "active").length} ativas` : "22 ativas · 2 suspensas"} icon={AtSign} tone="teal" /><MetricCard label="Mensagens recebidas" value={liveMessages.length ? liveMessages.length.toLocaleString("pt-BR") : "1.284"} detail={unreadCount ? `${unreadCount} não lidas` : "+12,8% vs. período anterior"} icon={Inbox} tone="blue" /><MetricCard label="Saúde da operação" value="99,98%" detail="Última verificação há 4 min" icon={ShieldCheck} tone="amber" /></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="soft-card rounded-2xl border hairline p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="micro-label text-[#6d9184]">02 / Volume de mensagens</div><h2 className="mt-3 text-xl font-medium text-[#edf3e9]">Movimento do workspace</h2></div><button className="grid h-9 w-9 place-items-center rounded-lg text-[#6c9382] transition-colors hover:bg-[#183b38] hover:text-[#c8ff4f]" aria-label="Mais opções"><MoreHorizontal className="h-4 w-4" /></button></div><div className="mt-7 flex h-44 items-end gap-2 sm:gap-4">{weeklyUsage.map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center gap-2"><div className="relative flex h-full w-full items-end"><div className={`w-full rounded-t-md transition-all duration-300 ${index === weeklyUsage.length - 1 ? "bg-[#c8ff4f] shadow-[0_0_22px_rgba(200,255,79,.17)]" : "bg-[#24534b] group-hover:bg-[#39766a]"}`} style={{ height: `${height}%` }} /></div><span className="micro-label text-[9px] text-[#5f8277]">{["seg", "ter", "qua", "qui", "sex", "sáb", "dom"][index]}</span></div>)}</div><div className="mt-5 flex items-center justify-between border-t border-[#25443f] pt-4 text-xs text-[#719286]"><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#c8ff4f]" />Entradas e saídas consolidadas</span><span className="flex items-center gap-1 text-[#a1d590]"><TrendingUp className="h-3.5 w-3.5" /> 18,4%</span></div></section>
          <section className="rounded-2xl border border-[#274b47] bg-[#0d2323] p-5 sm:p-6"><div className="micro-label text-[#6d9184]">03 / Capacidade</div><h2 className="mt-3 text-xl font-medium text-[#edf3e9]">Armazenamento</h2><div className="mt-9 flex items-end gap-3"><span className="display-font text-5xl text-[#f0f4eb]">{storagePercent}</span><span className="mb-2 text-lg text-[#72998a]">%</span></div><Progress value={storagePercent} className="mt-4 h-2 bg-[#1c3b37] [&>div]:bg-[#c8ff4f]" /><div className="mt-3 flex justify-between text-xs text-[#73978b]"><span>{usedStorage} GB usados</span><span>{storageLimit} GB total</span></div><div className="mt-8 border-t border-[#284b45] pt-5"><div className="mb-3 flex items-center justify-between"><span className="text-sm text-[#bdd0c5]">Plano Professional</span><span className="micro-label text-[#c8ff4f]">Ativo</span></div><Button onClick={() => setLocation("/settings")} variant="outline" className="action-button h-10 w-full border-[#3c6955] bg-transparent text-xs text-[#abd398] hover:bg-[#183b38] hover:text-[#c8ff4f]">Ajustar capacidade <ChevronRight className="ml-2 h-3.5 w-3.5" /></Button></div></section>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="soft-card overflow-hidden rounded-2xl border hairline"><div className="flex items-center justify-between border-b border-[#25443f] px-5 py-5 sm:px-6"><div><div className="micro-label text-[#6d9184]">04 / Caixa de entrada</div><h2 className="mt-2 text-xl font-medium">Mensagens recentes</h2></div><Button onClick={() => setLocation("/inbox")} variant="ghost" className="h-9 text-xs text-[#a9d49a] hover:bg-[#183b38] hover:text-[#c8ff4f]">Ver caixa completa <ChevronRight className="ml-1.5 h-3.5 w-3.5" /></Button></div><div>{recentMessagesView.map((message, index) => <button key={message.subject} onClick={() => setLocation("/inbox")} className="group flex w-full items-center gap-3 border-b border-[#193633] px-5 py-4 text-left transition-colors last:border-0 hover:bg-[#102b29] sm:px-6"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ backgroundColor: `${message.color}22`, color: message.color }}>{message.initials}</div><div className="min-w-0 flex-1"><div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2"><span className="truncate text-sm font-medium text-[#eaf2e8]">{message.name}</span><span className="micro-label text-[9px] text-[#63877a]">{message.mailbox}</span></div><div className="truncate text-xs text-[#7b9d91]">{message.subject}</div></div><span className="shrink-0 text-xs text-[#698d80]">{message.time}</span><ChevronRight className="h-3.5 w-3.5 text-[#486f63] opacity-0 transition-opacity group-hover:opacity-100" /></button>)}</div></section>
          <section className="rounded-2xl border border-[#274b47] bg-[#0d2323] p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="micro-label text-[#6d9184]">05 / Atividade</div><h2 className="mt-2 text-xl font-medium">Últimos eventos</h2></div><Activity className="h-4 w-4 text-[#c8ff4f]" /></div><div className="mt-6 space-y-5">{activityItems.map(({ title, detail, time, Icon }) => <div className="flex gap-3" key={title}><div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#19372f] text-[#9bda8b]"><Icon className="h-3.5 w-3.5" /></div><div className="min-w-0"><div className="text-sm text-[#d8e8dc]">{title}</div><div className="mt-1 truncate text-xs text-[#6f9287]">{detail}</div></div><span className="ml-auto shrink-0 text-[10px] text-[#608378]">{time}</span></div>)}</div><Button onClick={() => setLocation("/archive")} variant="ghost" className="mt-6 h-9 w-full text-xs text-[#86ab9c] hover:bg-[#183b38] hover:text-[#c8ff4f]">Ver histórico de atividades <ChevronRight className="ml-2 h-3.5 w-3.5" /></Button></section>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[#20403e] pt-5 text-[10px] uppercase tracking-[0.16em] text-[#52746a] sm:flex-row"><span>AltxCRM · Mail operations workspace</span><span className="flex items-center gap-2"><FolderArchive className="h-3 w-3" /> Dados sincronizados agora</span></div>
      </div>
    </div>
  );
}

