import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Archive,
  CalendarDays,
  Clock3,
  ChevronDown,
  CircleHelp,
  Github,
  Globe2,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MailPlus,
  MessageCircle,
  PanelLeft,
  Settings2,
  SlidersHorizontal,
  Webhook,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { LanguageSelect, useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const menuSections = [
  {
    label: "Operação",
    items: [
      { icon: LayoutDashboard, label: "Visão geral", path: "/" },
      { icon: Globe2, label: "Domínios", path: "/domains" },
      { icon: Mail, label: "Caixas postais", path: "/mailboxes" },
    ],
  },
  {
    label: "Mensageria",
    items: [
      { icon: Inbox, label: "Caixa de entrada", path: "/inbox" },
      { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp" },
      { icon: CalendarDays, label: "Agendamentos", path: "/appointments" },
      { icon: Clock3, label: "Agendados", path: "/scheduled" },
      { icon: Archive, label: "Arquivo", path: "/archive" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { icon: Webhook, label: "Integrações", path: "/integrations" },
      { icon: SlidersHorizontal, label: "Configurações", path: "/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const forgotMutation = trpc.auth.requestPasswordReset.useMutation();
  const resetMutation = trpc.auth.resetPassword.useMutation();
  const isAuthPending = loginMutation.isPending || registerMutation.isPending || forgotMutation.isPending || resetMutation.isPending;

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("authError");
    const token = params.get("reset");
    if (error) setAuthError(error);
    if (token) {
      setResetToken(token);
      setAuthMode("reset");
    }
  }, []);

  const updateAuthField = (field: keyof typeof authForm, value: string) => {
    setAuthForm(current => ({ ...current, [field]: value }));
    setAuthError(null);
    setAuthNotice(null);
  };

  const startSocialLogin = (provider: "google" | "github") => {
    window.location.href = `/api/auth/${provider}`;
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    try {
      if (authMode === "login") {
        await loginMutation.mutateAsync({ email: authForm.email, password: authForm.password });
        await utils.auth.me.invalidate();
        return;
      }
      if (authMode === "register") {
        if (authForm.password !== authForm.confirmPassword) throw new Error("As senhas não coincidem");
        await registerMutation.mutateAsync({ name: authForm.name, email: authForm.email, password: authForm.password });
        await utils.auth.me.invalidate();
        return;
      }
      if (authMode === "forgot") {
        await forgotMutation.mutateAsync({ email: authForm.email });
        setAuthNotice("Se existir uma conta com este e-mail, enviaremos um link de recuperação. Verifique sua caixa de entrada.");
        return;
      }
      if (!resetToken) throw new Error("O link de recuperação está incompleto");
      if (authForm.password !== authForm.confirmPassword) throw new Error("As senhas não coincidem");
      await resetMutation.mutateAsync({ token: resetToken, password: authForm.password });
      window.history.replaceState({}, "", window.location.pathname);
      setResetToken(null);
      setAuthForm(current => ({ ...current, password: "", confirmPassword: "" }));
      setAuthMode("login");
      setAuthNotice("Senha alterada com sucesso. Agora você já pode entrar.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível concluir a operação");
    }
  };

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    const title = authMode === "register" ? "Crie seu acesso ao AltxCRM." : authMode === "forgot" ? "Recupere seu acesso." : authMode === "reset" ? "Defina uma nova senha." : "Entre para cuidar da sua operação.";
    const description = authMode === "register" ? "Cadastre seu e-mail e uma senha segura para criar seu workspace." : authMode === "forgot" ? "Informe seu e-mail e enviaremos as instruções para redefinir a senha." : authMode === "reset" ? "Escolha uma senha nova com pelo menos 8 caracteres." : "O painel centraliza domínios, caixas postais, mensagens e integrações da sua infraestrutura.";

    return (
      <div className="editorial-grid editorial-glow flex min-h-screen items-center justify-center bg-[#071013] px-6 py-8 text-[#f4f5eb]">
        <div className="w-full max-w-md rounded-2xl border border-[#87bc9e]/25 bg-[#0b1b1e]/90 p-8 shadow-2xl shadow-black/30">
          <div className="mb-8 flex items-center justify-between gap-3"><div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#c8ff4f] text-[#102017]"><MailPlus className="h-5 w-5" /></div>
            <div><div className="text-sm font-bold tracking-[0.2em]">ALTXCRM</div><div className="micro-label mt-1 text-[#7ea692]">{t("Workspace de e-mail")}</div></div></div><LanguageSelect />
          </div>
          <div className="micro-label mb-3 text-[#c8ff4f]">{t("Acesso restrito · 01")}</div>
          <h1 className="display-font text-4xl leading-none">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-[#91ada0]">{description}</p>

          {authMode === "login" && <>
            <div className="mt-7 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => startSocialLogin("google")} className="h-11 border-[#31584e] bg-transparent text-xs text-[#abd398] hover:bg-[#183b38] hover:text-[#c8ff4f]"><span className="mr-2 grid h-5 w-5 place-items-center rounded bg-white font-bold text-[#4285f4]">G</span>Google</Button>
              <Button type="button" variant="outline" onClick={() => startSocialLogin("github")} className="h-11 border-[#31584e] bg-transparent text-xs text-[#abd398] hover:bg-[#183b38] hover:text-[#c8ff4f]"><Github className="mr-2 h-4 w-4" />GitHub</Button>
            </div>
            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[#55776d]"><div className="h-px flex-1 bg-[#24483f]" />ou entre com e-mail<div className="h-px flex-1 bg-[#24483f]" /></div>
          </>}

          <form onSubmit={submitAuth} className="space-y-3">
            {authMode === "register" && <Input required value={authForm.name} onChange={event => updateAuthField("name", event.target.value)} placeholder="Nome completo" autoComplete="name" className="h-11 border-[#31584e] bg-[#081719] text-[#eaf5e8] placeholder:text-[#638277]" />}
            {(authMode === "login" || authMode === "register" || authMode === "forgot") && <Input required type="email" value={authForm.email} onChange={event => updateAuthField("email", event.target.value)} placeholder="seu@email.com" autoComplete="email" className="h-11 border-[#31584e] bg-[#081719] text-[#eaf5e8] placeholder:text-[#638277]" />}
            {(authMode === "login" || authMode === "register" || authMode === "reset") && <Input required type="password" minLength={8} value={authForm.password} onChange={event => updateAuthField("password", event.target.value)} placeholder="Senha (mínimo de 8 caracteres)" autoComplete={authMode === "login" ? "current-password" : "new-password"} className="h-11 border-[#31584e] bg-[#081719] text-[#eaf5e8] placeholder:text-[#638277]" />}
            {(authMode === "register" || authMode === "reset") && <Input required type="password" minLength={8} value={authForm.confirmPassword} onChange={event => updateAuthField("confirmPassword", event.target.value)} placeholder="Confirme sua senha" autoComplete="new-password" className="h-11 border-[#31584e] bg-[#081719] text-[#eaf5e8] placeholder:text-[#638277]" />}
            <Button type="submit" disabled={isAuthPending} className="action-button h-12 w-full rounded-lg bg-[#c8ff4f] font-bold text-[#112119] hover:bg-[#d9ff80] disabled:cursor-not-allowed disabled:opacity-60">{isAuthPending ? "Aguarde…" : authMode === "register" ? "Criar conta" : authMode === "forgot" ? "Enviar link de recuperação" : authMode === "reset" ? "Salvar nova senha" : "Entrar"}</Button>
          </form>

          {authError && <div role="alert" className="mt-4 rounded-lg border border-[#a83c45]/50 bg-[#3a171d] px-3 py-2 text-xs leading-5 text-[#ffb7b2]">{authError}</div>}
          {authNotice && <div role="status" className="mt-4 rounded-lg border border-[#5d9b68]/50 bg-[#153323] px-3 py-2 text-xs leading-5 text-[#bfe8bb]">{authNotice}</div>}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-[#86a99a]">
            {authMode !== "login" && <button type="button" onClick={() => { setAuthMode("login"); setAuthError(null); setAuthNotice(null); }} className="hover:text-[#c8ff4f]">Voltar para entrar</button>}
            {authMode === "login" && <><button type="button" onClick={() => { setAuthMode("register"); setAuthError(null); }} className="hover:text-[#c8ff4f]">Criar conta</button><span className="text-[#31584e]">·</span><button type="button" onClick={() => { setAuthMode("forgot"); setAuthError(null); }} className="hover:text-[#c8ff4f]">Esqueci a senha</button></>}
            {authMode === "register" && <button type="button" onClick={() => { setAuthMode("login"); setAuthError(null); }} className="hover:text-[#c8ff4f]">Já tenho uma conta</button>}
          </div>
          <p className="mt-5 text-center text-[11px] leading-5 text-[#638277]">Ao continuar, sua sessão será protegida e os dados ficarão isolados por workspace.</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#638277]"><ShieldCheck className="h-4 w-4 text-[#92cf8e]" /> Sessão protegida por cookie seguro.</div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = { children: React.ReactNode; setSidebarWidth: (width: number) => void };

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { t } = useLanguage();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = event.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-[#20403e] bg-[#091517]" disableTransition={isResizing}>
          <SidebarHeader className="h-20 justify-center border-b border-[#20403e] px-4">
            <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#c8ff4f] text-[#112119] transition-colors hover:bg-[#d9ff80] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4f]" aria-label="Alternar navegação"><MailPlus className="h-5 w-5" /></button>
              {!isCollapsed && <div className="min-w-0"><div className="text-sm font-bold tracking-[0.22em] text-[#e8f2e6]">ALTXCRM</div><div className="micro-label mt-1 text-[#6b8d80]">Mail operations</div></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="scroll-thin px-3 py-5">
            {menuSections.map((section) => (
              <div key={t(section.label)} className="mb-6">
                {!isCollapsed && <div className="micro-label mb-2 px-3 text-[#55776d]">{t(section.label)}</div>}
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={t(item.label)} className={`h-10 rounded-lg text-sm transition-all ${isActive ? "bg-[#183b38] text-[#c8ff4f] shadow-[inset_3px_0_0_#c8ff4f]" : "text-[#89a79a] hover:bg-[#112a2a] hover:text-[#eaf5e8]"}`}>
                          <item.icon aria-hidden="true" strokeWidth={1.65} className={`h-[17px] w-[17px] shrink-0 ${isActive ? "text-[#c8ff4f]" : ""}`} /><span>{t(item.label)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
            {!isCollapsed && <div className="mt-auto rounded-xl border border-dashed border-[#3d6957] bg-[#0d2423] p-3"><div className="mb-2 flex items-center gap-2 text-[#c8ff4f]"><CircleHelp className="h-4 w-4" /><span className="micro-label">Precisa de ajuda?</span></div><p className="text-xs leading-5 text-[#80a797]">Conecte a API da sua VPS para ativar a operação real.</p></div>}
          </SidebarContent>
          <SidebarFooter className="border-t border-[#20403e] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#112a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4f] group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 shrink-0 border border-[#5e8e74] bg-[#1b3d38]"><AvatarFallback className="bg-[#1b3d38] text-xs font-bold text-[#c8ff4f]">{user?.name?.charAt(0).toUpperCase() || "A"}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium text-[#eaf5e8]">{user?.name || "Administrador"}</p><p className="mt-1 truncate text-xs text-[#6d9181]">{user?.email || "Workspace"}</p></div>
                  <ChevronDown className="h-4 w-4 text-[#6d9181] group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-[#2a4c48] bg-[#102523] text-[#eaf5e8]">
                <DropdownMenuItem className="focus:bg-[#183b38]"><UsersRound className="mr-2 h-4 w-4" /> Minha conta</DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-[#183b38]"><Settings2 className="mr-2 h-4 w-4" /> Preferências</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a4c48]" />
                <DropdownMenuItem onClick={logout} className="text-[#ff978d] focus:bg-[#3a2528] focus:text-[#ffb6ae]"><LogOut className="mr-2 h-4 w-4" /> Sair do painel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-[#c8ff4f]/30 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} style={{ zIndex: 50 }} />
      </div>
      <SidebarInset className="bg-[#071013]">
        {isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#20403e] bg-[#091517]/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-lg bg-[#102523] text-[#c8ff4f]" /><span className="text-sm font-semibold text-[#eaf5e8]">{t(menuSections.flatMap(section => section.items).find(item => item.path === location)?.label || "AltxCRM")}</span></div>}
        <main className="min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
