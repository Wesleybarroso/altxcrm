import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "pt-BR" | "en" | "es";

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  "pt-BR": {},
  en: {
    "Operação": "Operations", "Visão geral": "Overview", "Domínios": "Domains", "Caixas postais": "Mailboxes", "Mensageria": "Messaging", "Caixa de entrada": "Inbox", "WhatsApp": "WhatsApp", "Agendados": "Scheduled", "Agendamentos": "Bookings", "Agenda clínica": "Clinical calendar", "Operação / agenda clínica": "Operations / clinical calendar", "Operação / agendamentos": "Operations / bookings", "Arquivo": "Archive", "Sistema": "System", "Integrações": "Integrations", "Configurações": "Settings", "Workspace de e-mail": "Email workspace", "Acesso restrito · 01": "Restricted access · 01", "Entre para cuidar da sua operação.": "Sign in to manage your operation.", "O painel centraliza domínios, caixas postais, mensagens e integrações da sua infraestrutura.": "The workspace centralizes domains, mailboxes, messages, and infrastructure integrations.", "A criação e a recuperação de acesso são concluídas com segurança no Google/OAuth.": "Account creation and recovery are completed securely through Google/OAuth.", "Mail operations": "Mail operations", "Idioma": "Language", "agora": "now", "Ontem": "Yesterday", "ativas": "active", "suspensas": "suspended", "verificados": "verified", "não lidas": "unread", "período anterior": "previous period", "há": "ago", "conectada": "connected", "Pronto": "Ready", "Continuar com Google / OAuth": "Continue with Google / OAuth", "Criar conta": "Create account", "Esqueci a senha": "Forgot password", "Sessão protegida e dados isolados por workspace.": "Protected session and workspace-isolated data.", "Alternar navegação": "Toggle navigation", "Precisa de ajuda?": "Need help?", "Conecte a API da sua VPS para ativar a operação real.": "Connect your VPS API to activate live operations.", "Minha conta": "My account", "Preferências": "Preferences", "Sair do painel": "Sign out", "Pesquisar": "Search", "Notificações": "Notifications", "Processando…": "Processing…", "Salvar alterações": "Save changes", "Nova caixa postal": "New mailbox", "Workspace / visão geral": "Workspace / overview", "Infraestrutura clara para": "Clear infrastructure for", "mensagens que importam.": "messages that matter.", "Um centro de comando para os domínios, caixas postais e integrações da sua operação de e-mail corporativo.": "A command center for your corporate email domains, mailboxes, and integrations.", "Sinal da operação": "Operational signal", "Sincronizando o workspace...": "Syncing workspace...", "Bom dia, seu workspace está funcionando dentro do esperado.": "Good morning, your workspace is operating as expected.", "Domínios ativos": "Active domains", "Mensagens recebidas": "Received messages", "Saúde da operação": "Operational health", "Todos verificados": "All verified", "Última verificação há 4 min": "Last check 4 min ago", "Volume de mensagens": "Message volume", "Movimento do workspace": "Workspace activity", "Entradas e saídas consolidadas": "Consolidated inbound and outbound", "Capacidade": "Capacity", "Armazenamento": "Storage", "Ajustar capacidade": "Adjust capacity", "Mensagens recentes": "Recent messages", "Ver caixa completa": "View full inbox", "Atividade": "Activity", "Últimos eventos": "Latest events", "Ver histórico de atividades": "View activity history", "Dados sincronizados agora": "Data synced now", "Armazenamento do workspace": "Workspace storage", "Ajuste o limite total reservado para as caixas postais e o arquivo.": "Adjust the total limit reserved for mailboxes and archive.", "Uso atual": "Current usage", "usados": "used", "total": "total", "Segurança": "Security", "Acesso e proteção": "Access and protection", "Mantenha as áreas internas protegidas com políticas claras para o workspace.": "Keep internal areas protected with clear workspace policies.", "MFA para administradores": "MFA for administrators", "Exigir segunda etapa de verificação": "Require a second verification step", "Alertas de segurança": "Security alerts", "Avisar sobre logins e alterações críticas": "Notify about logins and critical changes", "Trilha de auditoria": "Audit trail", "Registrar eventos por 180 dias": "Record events for 180 days", "Redefinir minha senha": "Reset my password", "Infraestrutura": "Infrastructure", "Conexão com a VPS": "VPS connection", "Conectada": "Connected", "Pronta para conectar": "Ready to connect", "Ambiente conectado": "Connected environment", "Endpoint de integração": "Integration endpoint", "Verificar conexão": "Verify connection", "Credenciais armazenadas no backend": "Credentials stored in backend", "TLS obrigatório": "TLS required", "Última sincronização há 4 min": "Last sync 4 min ago", "Preferências de envio": "Sending preferences", "Remetente padrão, assinatura e notificações": "Default sender, signature, and notifications", "Políticas avançadas": "Advanced policies", "Retenção, limites e regras por domínio": "Retention, limits, and domain rules"
  },
  es: {
    "Operação": "Operaciones", "Visão geral": "Resumen", "Domínios": "Dominios", "Caixas postais": "Buzones", "Mensageria": "Mensajería", "Caixa de entrada": "Bandeja de entrada", "Agendados": "Programados", "Agendamentos": "Citas", "Agenda clínica": "Agenda clínica", "Operação / agenda clínica": "Operación / agenda clínica", "Operação / agendamentos": "Operación / citas", "Arquivo": "Archivo", "Sistema": "Sistema", "Integrações": "Integraciones", "Configurações": "Configuración", "Workspace de e-mail": "Espacio de trabajo de correo", "Acesso restrito · 01": "Acceso restringido · 01", "Entre para cuidar da sua operação.": "Inicia sesión para gestionar tu operación.", "O painel centraliza domínios, caixas postais, mensagens e integrações da sua infraestrutura.": "El espacio centraliza dominios, buzones, mensajes e integraciones de tu infraestructura.", "A criação e a recuperação de acesso são concluídas com segurança no Google/OAuth.": "La creación y recuperación de acceso se completan de forma segura mediante Google/OAuth.", "Mail operations": "Operaciones de correo", "Idioma": "Idioma", "agora": "ahora", "Ontem": "Ayer", "ativas": "activas", "suspensas": "suspendidas", "verificados": "verificados", "não lidas": "no leídos", "período anterior": "periodo anterior", "há": "hace", "conectada": "conectada", "Pronto": "Lista", "Continuar com Google / OAuth": "Continuar con Google / OAuth", "Criar conta": "Crear cuenta", "Esqueci a senha": "Olvidé mi contraseña", "Sessão protegida e dados isolados por workspace.": "Sesión protegida y datos aislados por espacio de trabajo.", "Alternar navegação": "Alternar navegación", "Precisa de ajuda?": "¿Necesitas ayuda?", "Conecte a API da sua VPS para ativar a operação real.": "Conecta la API de tu VPS para activar las operaciones reales.", "Minha conta": "Mi cuenta", "Preferências": "Preferencias", "Sair do painel": "Cerrar sesión", "Pesquisar": "Buscar", "Notificações": "Notificaciones", "Processando…": "Procesando…", "Salvar alterações": "Guardar cambios", "Nova caixa postal": "Nuevo buzón", "Workspace / visão geral": "Espacio / resumen", "Sinal da operação": "Señal operativa", "Sincronizando o workspace...": "Sincronizando el espacio...", "Domínios activos": "Dominios activos", "Mensagens recebidos": "Mensajes recibidos", "Saúde da operação": "Salud operativa", "Todos verificados": "Todos verificados", "Última verificação há 4 min": "Última verificación hace 4 min", "Volume de mensagens": "Volumen de mensajes", "Movimento do workspace": "Actividad del espacio", "Capacidade": "Capacidad", "Armazenamento": "Almacenamiento", "Ajustar capacidade": "Ajustar capacidad", "Mensagens recentes": "Mensajes recientes", "Ver caixa completa": "Ver bandeja completa", "Atividade": "Actividad", "Últimos eventos": "Últimos eventos", "Ver histórico de atividades": "Ver historial de actividad", "Dados sincronizados agora": "Datos sincronizados ahora", "Segurança": "Seguridad", "Acesso e proteção": "Acceso y protección", "MFA para administradores": "MFA para administradores", "Alertas de segurança": "Alertas de seguridad", "Trilha de auditoria": "Registro de auditoría", "Redefinir minha senha": "Restablecer mi contraseña", "Infraestrutura": "Infraestructura", "Conexão com a VPS": "Conexión con la VPS", "Conectada": "Conectada", "Pronta para conectar": "Lista para conectar", "Verificar conexão": "Verificar conexión", "Preferências de envio": "Preferencias de envío", "Políticas avançadas": "Políticas avanzadas"
  }
};

export function translateValue(language: Language, value: string) {
  return dictionaries[language][value] || value;
}

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (value: string) => string } | null>(null);

const originalText = new WeakMap<Text, string>();

function translateTextNodes(dictionary: Dictionary) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  const translatedValues = new Set(Object.values(dictionary));
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const current = textNode.nodeValue || "";
    if (!current.trim()) continue;
    const known = originalText.get(textNode);
    const source = known && translatedValues.has(current.trim()) ? known : known || current.trim();
    if (!known) originalText.set(textNode, source);
    const translated = Object.entries(dictionary).sort(([a], [b]) => b.length - a.length).reduce((text, [from, to]) => text.replaceAll(from, to), source);
    if (current.trim() !== translated) textNode.nodeValue = current.replace(current.trim(), translated);
  }
}

function translateAttributes(dictionary: Dictionary) {
  document.querySelectorAll<HTMLElement>("[aria-label], [placeholder], [title]").forEach((element) => {
    for (const attribute of ["aria-label", "placeholder", "title"] as const) {
      const value = element.getAttribute(attribute);
      if (value && dictionary[value]) element.setAttribute(attribute, dictionary[value]);
    }
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("altxcrm-language") as Language) || "pt-BR");
  const dictionary = dictionaries[language];
  const value = useMemo(() => ({ language, setLanguage: (next: Language) => { localStorage.setItem("altxcrm-language", next); setLanguage(next); }, t: (text: string) => translateValue(language, text) }), [language, dictionary]);

  useEffect(() => {
    document.documentElement.lang = language;
    translateTextNodes(dictionary);
    translateAttributes(dictionary);
    const observer = new MutationObserver(() => { translateTextNodes(dictionary); translateAttributes(dictionary); });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language, dictionary]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function LanguageSelect() {
  const { language, setLanguage } = useLanguage();
  return <select aria-label="Idioma" value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="h-9 rounded-lg border border-[#31584e] bg-[#102523] px-2 text-xs text-[#c8ff4f] outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4f]"><option value="pt-BR">PT</option><option value="en">EN</option><option value="es">ES</option></select>;
}
