import AppTopBar from "@/components/AppTopBar";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, AtSign, ChevronRight, FolderArchive, Globe2, Inbox, MoreHorizontal, PlugZap, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const avatarColors = ["#b8e86c", "#7bd6c0", "#e2bf70", "#80bce3"];

export default function Home() {
  const [, setLocation] = useLocation();
  const [range, setRange] = useState("7 dias");
  const snapshotQuery = trpc.workspace.snapshot.useQuery();
  const liveDomains = snapshotQuery.data?.domains ?? [];
  const liveMailboxes = snapshotQuery.data?.mailboxes ?? [];
  const liveMessages = snapshotQuery.data?.messages ?? [];
  const liveActivities = snapshotQuery.data?.activities ?? [];
  const recentMessagesView = useMemo(() => liveMessages.slice(0, 4).map((message, index) => ({ initials: (message.senderName || message.senderEmail).slice(0, 2).toUpperCase(), name: message.senderName || message.senderEmail, subject: message.subject, mailbox: message.senderEmail, time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "agora", color: avatarColors[index % avatarColors.length] })), [liveMessages]);
  const activityItems = useMemo(() => liveActivities.slice(0, 4).map((item) => ({ title: item.action, detail: item.detail || item.resourceType, time: item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "agora", Icon: item.resourceType === "domain" ? Globe2 : item.resourceType === "webhook" ? PlugZap : item.resourceType === "message" ? Inbox : AtSign })), [liveActivities]);
  const usageBuckets = useMemo(() => {
    const periodDays = range === "30 dias" ? 30 : 7;
    const now = Date.now();
    const bucketSpan = periodDays / 7;
    const counts = Array.from({ length: 7 }, () => 0);
    liveMessages.forEach((message) => {
      const timestamp = new Date(message.createdAt).getTime();
      const ageInDays = (now - timestamp) / 86_400_000;
      if (!Number.isFinite(ageInDays) || ageInDays < 0 || ageInDays >= periodDays) return;
      const bucket = Math.min(6, Math.floor((periodDays - ageInDays) / bucketSpan));
      counts[bucket] += 1;
    });
    const max = Math.max(...counts, 1);
    const labels = range === "30 dias" ? ["1–4", "5–8", "9–12", "13–16", "17–20", "21–24", "25–30"] : ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
    return counts.map((count, index) => ({ count, label: labels[index], height: count ? Math.max(12, Math.round((count / max) * 100)) : 0 }));
  }, [liveMessages, range]);
  const chartTotal = usageBuckets.reduce((total, bucket) => total + bucket.count, 0);
  const domainCount = liveDomains.length;
  const mailboxCount = liveMailboxes.length;
  const unreadCount = liveMessages.filter((message) => !message.isRead).length;
  const usedStorage = liveMailboxes.reduce((total, mailbox) => total + (mailbox.usedGb || 0), 0);
  const storageLimit = snapshotQuery.data?.settings?.storageLimitGb ?? 0;
  const storagePercent = storageLimit > 0 ? Math.min(100, Math.round((usedStorage / storageLimit) * 100)) : null;
  const workspaceStatus = snapshotQuery.isLoading ? "…" : snapshotQuery.isError ? "!" : "OK";
  return (
    <div className="editorial-grid editorial-glow min-h-screen bg-[#071013] text-[#f0f4eb]">
      <AppTopBar eyebrow="Workspace / visão geral" title={<>Infraestrutura clara para <em className="text-[#c8ff4f]">mensagens que importam.</em></>} description="Um centro de comando para os domínios, caixas postais e integrações da sua operação de e-mail corporativo." actionLabel="Nova caixa postal" onAction={() => setLocation("/mailboxes")} />
      <div className="px-5 py-7 sm:px-8 lg:px-12">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="micro-label mb-2 text-[#567d70]">01 / Sinal da operação</div><p className="text-sm text-[#89a99b]">{snapshotQuery.isFetching ? "Sincronizando o workspace..." : snapshotQuery.isError ? "Não foi possível consultar o workspace. Verifique a conexão da VPS." : "Dados do workspace carregados."}</p></div><div className="flex items-center gap-2 rounded-lg border border-[#2a4d47] bg-[#0c1e20] p-1"><button onClick={() => setRange("7 dias")} className={`rounded-md px-3 py-1.5 text-xs ${range === "7 dias" ? "bg-[#c8ff4f] font-bold text-[#112119]" : "text-[#87a89a]"}`}>7 dias</button><button onClick={() => setRange("30 dias")} className={`rounded-md px-3 py-1.5 text-xs ${range === "30 dias" ? "bg-[#c8ff4f] font-bold text-[#112119]" : "text-[#87a89a]"}`}>30 dias</button></div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Domínios cadastrados" value={domainCount.toString().padStart(2, "0")} detail={domainCount ? `${liveDomains.filter((item) => item.status === "verified").length} verificados` : "Nenhum domínio cadastrado"} icon={Globe2} /><MetricCard label="Caixas postais" value={mailboxCount.toString().padStart(2, "0")} detail={mailboxCount ? `${liveMailboxes.filter((item) => item.status === "active").length} ativas` : "Nenhuma caixa cadastrada"} icon={AtSign} tone="teal" /><MetricCard label="Mensagens no workspace" value={liveMessages.length.toLocaleString("pt-BR")} detail={unreadCount ? `${unreadCount} não lidas` : "Nenhuma mensagem não lida"} icon={Inbox} tone="blue" /><MetricCard label="Status da consulta" value={workspaceStatus} detail={snapshotQuery.isError ? "Não foi possível consultar os dados" : "Snapshot do workspace"} icon={ShieldCheck} tone="amber" /></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="soft-card rounded-2xl border hairline p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="micro-label text-[#6d9184]">02 / Volume de mensagens</div><h2 className="mt-3 text-xl font-medium text-[#edf3e9]">Movimento do workspace</h2></div><button className="grid h-9 w-9 place-items-center rounded-lg text-[#6c9382] transition-colors hover:bg-[#183b38] hover:text-[#c8ff4f]" aria-label="Mais opções"><MoreHorizontal className="h-4 w-4" /></button></div><div className="mt-7 flex h-44 items-end gap-2 sm:gap-4">{usageBuckets.map(({ height, label, count }, index) => <div key={label} className="group flex flex-1 flex-col items-center gap-2" title={`${count} mensagens`}><div className="relative flex h-full w-full items-end"><div className={`w-full rounded-t-md transition-all duration-300 ${index === usageBuckets.length - 1 ? "bg-[#c8ff4f] shadow-[0_0_22px_rgba(200,255,79,.17)]" : "bg-[#24534b] group-hover:bg-[#39766a]"}`} style={{ height: `${height}%` }} /></div><span className="micro-label text-[9px] text-[#5f8277]">{label}</span></div>)}</div><div className="mt-5 flex items-center justify-between border-t border-[#25443f] pt-4 text-xs text-[#719286]"><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#c8ff4f]" />{chartTotal} mensagens no período selecionado</span><span className="text-[#a1d590]">{range}</span></div></section>
          <section className="rounded-2xl border border-[#274b47] bg-[#0d2323] p-5 sm:p-6"><div className="micro-label text-[#6d9184]">03 / Capacidade</div><h2 className="mt-3 text-xl font-medium text-[#edf3e9]">Armazenamento</h2><div className="mt-9 flex items-end gap-3"><span className="display-font text-5xl text-[#f0f4eb]">{storagePercent === null ? "—" : storagePercent}</span>{storagePercent !== null && <span className="mb-2 text-lg text-[#72998a]">%</span>}</div><Progress value={storagePercent ?? 0} className="mt-4 h-2 bg-[#1c3b37] [&>div]:bg-[#c8ff4f]" /><div className="mt-3 flex justify-between text-xs text-[#73978b]"><span>{storageLimit > 0 ? `${usedStorage} GB usados` : "Limite não configurado"}</span><span>{storageLimit > 0 ? `${storageLimit} GB total` : "Configure em Ajustes"}</span></div><div className="mt-8 border-t border-[#284b45] pt-5"><div className="mb-3 flex items-center justify-between"><span className="text-sm text-[#bdd0c5]">Limite do workspace</span><span className="micro-label text-[#c8ff4f]">{storageLimit > 0 ? "Configurado" : "Pendente"}</span></div><Button onClick={() => setLocation("/settings")} variant="outline" className="action-button h-10 w-full border-[#3c6955] bg-transparent text-xs text-[#abd398] hover:bg-[#183b38] hover:text-[#c8ff4f]">Ajustar capacidade <ChevronRight className="ml-2 h-3.5 w-3.5" /></Button></div></section>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="soft-card overflow-hidden rounded-2xl border hairline"><div className="flex items-center justify-between border-b border-[#25443f] px-5 py-5 sm:px-6"><div><div className="micro-label text-[#6d9184]">04 / Caixa de entrada</div><h2 className="mt-2 text-xl font-medium">Mensagens recentes</h2></div><Button onClick={() => setLocation("/inbox")} variant="ghost" className="h-9 text-xs text-[#a9d49a] hover:bg-[#183b38] hover:text-[#c8ff4f]">Ver caixa completa <ChevronRight className="ml-1.5 h-3.5 w-3.5" /></Button></div><div>{recentMessagesView.length ? recentMessagesView.map((message) => <button key={message.subject} onClick={() => setLocation("/inbox")} className="group flex w-full items-center gap-3 border-b border-[#193633] px-5 py-4 text-left transition-colors last:border-0 hover:bg-[#102b29] sm:px-6"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ backgroundColor: `${message.color}22`, color: message.color }}>{message.initials}</div><div className="min-w-0 flex-1"><div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2"><span className="truncate text-sm font-medium text-[#eaf2e8]">{message.name}</span><span className="micro-label text-[9px] text-[#63877a]">{message.mailbox}</span></div><div className="truncate text-xs text-[#7b9d91]">{message.subject}</div></div><span className="shrink-0 text-xs text-[#698d80]">{message.time}</span><ChevronRight className="h-3.5 w-3.5 text-[#486f63] opacity-0 transition-opacity group-hover:opacity-100" /></button>) : <div className="px-5 py-10 text-center text-sm text-[#719286] sm:px-6">Nenhuma mensagem recente neste workspace.</div>}</div></section>
          <section className="rounded-2xl border border-[#274b47] bg-[#0d2323] p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="micro-label text-[#6d9184]">05 / Atividade</div><h2 className="mt-2 text-xl font-medium">Últimos eventos</h2></div><Activity className="h-4 w-4 text-[#c8ff4f]" /></div><div className="mt-6 space-y-5">{activityItems.length ? activityItems.map(({ title, detail, time, Icon }) => <div className="flex gap-3" key={`${title}-${time}`}><div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#19372f] text-[#9bda8b]"><Icon className="h-3.5 w-3.5" /></div><div className="min-w-0"><div className="text-sm text-[#d8e8dc]">{title}</div><div className="mt-1 truncate text-xs text-[#6f9287]">{detail}</div></div><span className="ml-auto shrink-0 text-[10px] text-[#608378]">{time}</span></div>) : <div className="rounded-xl border border-dashed border-[#31584e] px-4 py-8 text-center text-sm text-[#719286]">Nenhuma atividade registrada neste workspace.</div>}</div><Button onClick={() => setLocation("/archive")} variant="ghost" className="mt-6 h-9 w-full text-xs text-[#86ab9c] hover:bg-[#183b38] hover:text-[#c8ff4f]">Ver histórico de atividades <ChevronRight className="ml-2 h-3.5 w-3.5" /></Button></section>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[#20403e] pt-5 text-[10px] uppercase tracking-[0.16em] text-[#52746a] sm:flex-row"><span>AltxCRM · Mail operations workspace</span><span className="flex items-center gap-2"><FolderArchive className="h-3 w-3" /> Fonte: workspace atual</span></div>
      </div>
    </div>
  );
}

