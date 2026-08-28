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
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Archive,
  Clock3,
  ChevronDown,
  CircleHelp,
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
import { Button } from "./ui/button";

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

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="editorial-grid editorial-glow flex min-h-screen items-center justify-center bg-[#071013] px-6 text-[#f4f5eb]">
        <div className="w-full max-w-md rounded-2xl border border-[#87bc9e]/25 bg-[#0b1b1e]/90 p-8 shadow-2xl shadow-black/30">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#c8ff4f] text-[#102017]"><MailPlus className="h-5 w-5" /></div>
            <div><div className="text-sm font-bold tracking-[0.2em]">ALTXCRM</div><div className="micro-label mt-1 text-[#7ea692]">Workspace de e-mail</div></div>
          </div>
          <div className="micro-label mb-3 text-[#c8ff4f]">Acesso restrito · 01</div>
          <h1 className="display-font text-4xl leading-none">Entre para cuidar da sua operação.</h1>
          <p className="mt-4 text-sm leading-6 text-[#91ada0]">O painel centraliza domínios, caixas postais, mensagens e integrações da sua infraestrutura.</p>
          <Button onClick={() => startLogin()} className="action-button mt-8 h-12 w-full rounded-lg bg-[#c8ff4f] font-bold text-[#112119] hover:bg-[#d9ff80]">Continuar com Google / OAuth</Button>
          <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => startLogin()} className="h-10 border-[#31584e] bg-transparent text-xs text-[#abd398] hover:bg-[#183b38] hover:text-[#c8ff4f]">Criar conta</Button><Button variant="outline" onClick={() => startLogin()} className="h-10 border-[#31584e] bg-transparent text-xs text-[#abd398] hover:bg-[#183b38] hover:text-[#c8ff4f]">Esqueci a senha</Button></div>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#638277]">A criação e a recuperação de acesso são concluídas com segurança no Google/OAuth.</p>
          <div className="mt-6 flex items-center gap-2 text-xs text-[#638277]"><ShieldCheck className="h-4 w-4 text-[#92cf8e]" /> Sessão protegida e dados isolados por workspace.</div>
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
              <div key={section.label} className="mb-6">
                {!isCollapsed && <div className="micro-label mb-2 px-3 text-[#55776d]">{section.label}</div>}
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-10 rounded-lg text-sm transition-all ${isActive ? "bg-[#183b38] text-[#c8ff4f] shadow-[inset_3px_0_0_#c8ff4f]" : "text-[#89a79a] hover:bg-[#112a2a] hover:text-[#eaf5e8]"}`}>
                          <item.icon aria-hidden="true" strokeWidth={1.65} className={`h-[17px] w-[17px] shrink-0 ${isActive ? "text-[#c8ff4f]" : ""}`} /><span>{item.label}</span>
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
        {isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#20403e] bg-[#091517]/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-lg bg-[#102523] text-[#c8ff4f]" /><span className="text-sm font-semibold text-[#eaf5e8]">{menuSections.flatMap(section => section.items).find(item => item.path === location)?.label || "AltxCRM"}</span></div>}
        <main className="min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
