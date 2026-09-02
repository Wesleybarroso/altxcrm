import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type Language = "pt-BR" | "en" | "es";

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  "pt-BR": {},
  en: {
    "Operação": "Operations", "Visão geral": "Overview", "Domínios": "Domains", "Caixas postais": "Mailboxes", "Mensageria": "Messaging", "Caixa de entrada": "Inbox", "WhatsApp": "WhatsApp", "Agendados": "Scheduled", "Agendamentos": "Bookings", "Agenda clínica": "Clinical calendar", "Operação / agenda clínica": "Operations / clinical calendar", "Operação / agendamentos": "Operations / bookings", "Arquivo": "Archive", "Sistema": "System", "Integrações": "Integrations", "Configurações": "Settings", "Workspace de e-mail": "Email workspace", "Acesso restrito · 01": "Restricted access · 01", "Entre para cuidar da sua operação.": "Sign in to manage your operation.", "O painel centraliza domínios, caixas postais, mensagens e integrações da sua infraestrutura.": "The workspace centralizes domains, mailboxes, messages, and infrastructure integrations.", "A criação e a recuperação de acesso são concluídas com segurança no Google/OAuth.": "Account creation and recovery are completed securely through Google/OAuth.", "Mail operations": "Mail operations", "Idioma": "Language", "agora": "now", "Ontem": "Yesterday", "ativas": "active", "suspensas": "suspended", "verificados": "verified", "não lidas": "unread", "período anterior": "previous period", "há": "ago", "conectada": "connected", "Pronto": "Ready", "Continuar com Google / OAuth": "Continue with Google / OAuth", "Criar conta": "Create account", "Esqueci a senha": "Forgot password", "Sessão protegida e dados isolados por workspace.": "Protected session and workspace-isolated data.", "Alternar navegação": "Toggle navigation", "Precisa de ajuda?": "Need help?", "Conecte a API da sua VPS para ativar a operação real.": "Connect your VPS API to activate live operations.", "Minha conta": "My account", "Preferências": "Preferences", "Sair do painel": "Sign out", "Pesquisar": "Search", "Notificações": "Notifications", "Processando…": "Processing…", "Salvar alterações": "Save changes", "Nova caixa postal": "New mailbox", "Workspace / visão geral": "Workspace / overview", "Infraestrutura clara para": "Clear infrastructure for", "mensagens que importam.": "messages that matter.", "Um centro de comando para os domínios, caixas postais e integrações da sua operação de e-mail corporativo.": "A command center for your corporate email domains, mailboxes, and integrations.", "Sinal da operação": "Operational signal", "Sincronizando o workspace...": "Syncing workspace...", "Dados do workspace carregados.": "Workspace data loaded.", "Domínios ativos": "Active domains", "Mensagens recebidas": "Received messages", "Saúde da operação": "Operational health", "Todos verificados": "All verified", "Volume de mensagens": "Message volume", "Movimento do workspace": "Workspace activity", "Entradas e saídas consolidadas": "Consolidated inbound and outbound", "Capacidade": "Capacity", "Armazenamento": "Storage", "Ajustar capacidade": "Adjust capacity", "Mensagens recentes": "Recent messages", "Ver caixa completa": "View full inbox", "Atividade": "Activity", "Últimos eventos": "Latest events", "Ver histórico de atividades": "View activity history", "Fonte: workspace atual": "Source: current workspace", "Armazenamento do workspace": "Workspace storage", "Ajuste o limite total reservado para as caixas postais e o arquivo.": "Adjust the total limit reserved for mailboxes and archive.", "Uso atual": "Current usage", "usados": "used", "total": "total", "Segurança": "Security", "Acesso e proteção": "Access and protection", "Mantenha as áreas internas protegidas com políticas claras para o workspace.": "Keep internal areas protected with clear workspace policies.", "MFA para administradores": "MFA for administrators", "Exigir segunda etapa de verificação": "Require a second verification step", "Alertas de segurança": "Security alerts", "Avisar sobre logins e alterações críticas": "Notify about logins and critical changes", "Trilha de auditoria": "Audit trail", "Registrar eventos do workspace": "Record workspace events", "Redefinir minha senha": "Reset my password", "Infraestrutura": "Infrastructure", "Conexão com a VPS": "VPS connection", "Conectada": "Connected", "Pronta para conectar": "Ready to connect", "Ambiente conectado": "Connected environment", "Endpoint de integração": "Integration endpoint", "Verificar conexão": "Verify connection", "Credenciais armazenadas no backend": "Credentials stored in backend", "TLS obrigatório": "TLS required", "Sincronização sob demanda": "On-demand synchronization", "Preferências de envio": "Sending preferences", "Remetente padrão, assinatura e notificações": "Default sender, signature, and notifications", "Políticas avançadas": "Advanced policies", "Sistema / configurações": "System / settings", "Ajuste o sistema ao": "Tune the system to", "seu ritmo.": "your rhythm.", "Defina capacidade, segurança, preferências e o ponto de conexão com a infraestrutura de e-mail da sua VPS.": "Set capacity, security, preferences, and the connection point to your VPS email infrastructure.", "01 / Capacidade": "01 / Capacity", "Nenhum uso registrado": "No usage recorded", "Limite ainda não configurado": "Limit not configured yet", "02 / Segurança": "02 / Security", "Link de redefinição enviado para o e-mail do administrador.": "Password reset link sent to the administrator's email.", "03 / Infraestrutura": "03 / Infrastructure", "A camada de integração mantém o painel separado da infraestrutura e expõe apenas operações autorizadas para domínios, caixas e mensagens.": "The integration layer keeps the panel separate from the infrastructure and exposes only authorized operations for domains, mailboxes, and messages.", "Nome do ambiente": "Environment name", "Não configurado": "Not configured", "Verificando…": "Checking…", "Perfil, login Google e recuperação de acesso": "Profile, Google login, and access recovery", "Preferências de envio prontas para conectar à VPS.": "Sending preferences are ready to connect to the VPS.", "As informações da conta são gerenciadas pelo provedor OAuth.": "Account information is managed by the OAuth provider.", "Políticas avançadas disponíveis na camada segura.": "Advanced policies are available in the secure layer.", "Preferências salvas com segurança.": "Preferences saved securely.", "Defina um limite de pelo menos 50 GB.": "Set a limit of at least 50 GB.", "Conexão verificada com a API da VPS.": "VPS API connection verified.", "API da VPS não configurada ou indisponível.": "VPS API is not configured or unavailable.", "Retenção, limites e regras por domínio": "Retention, limits, and domain rules", "Sincronizando": "Syncing", "Não foi possível carregar": "Could not load", "Verifique a conexão do backend e tente novamente.": "Check the backend connection and try again.", "Nenhum registro de": "No", "foi persistido ainda.": "have been persisted yet.", "Atividades": "Activities", "Mensagens": "Messages", "Webhooks": "Webhooks", "Nome do ambiente conectado": "Connected environment name"
  },
  es: {
    "Operação": "Operaciones", "Visão geral": "Resumen", "Domínios": "Dominios", "Caixas postais": "Buzones", "Mensageria": "Mensajería", "Caixa de entrada": "Bandeja de entrada", "Agendados": "Programados", "Agendamentos": "Citas", "Agenda clínica": "Agenda clínica", "Operação / agenda clínica": "Operación / agenda clínica", "Operação / agendamentos": "Operación / citas", "Arquivo": "Archivo", "Sistema": "Sistema", "Integrações": "Integraciones", "Configurações": "Configuración", "Workspace de e-mail": "Espacio de trabajo de correo", "Acesso restrito · 01": "Acceso restringido · 01", "Entre para cuidar da sua operação.": "Inicia sesión para gestionar tu operación.", "O painel centraliza domínios, caixas postais, mensagens e integrações da sua infraestrutura.": "El espacio centraliza dominios, buzones, mensajes e integraciones de tu infraestructura.", "A criação e a recuperação de acesso são concluídas com segurança no Google/OAuth.": "La creación y recuperación de acceso se completan de forma segura mediante Google/OAuth.", "Mail operations": "Operaciones de correo", "Idioma": "Idioma", "agora": "ahora", "Ontem": "Ayer", "ativas": "activas", "suspensas": "suspendidas", "verificados": "verificados", "não lidas": "no leídos", "período anterior": "periodo anterior", "há": "hace", "conectada": "conectada", "Pronto": "Lista", "Continuar com Google / OAuth": "Continuar con Google / OAuth", "Criar conta": "Crear cuenta", "Esqueci a senha": "Olvidé mi contraseña", "Sessão protegida e dados isolados por workspace.": "Sesión protegida y datos aislados por espacio de trabajo.", "Alternar navegação": "Alternar navegación", "Precisa de ajuda?": "¿Necesitas ayuda?", "Conecte a API da sua VPS para ativar a operação real.": "Conecta la API de tu VPS para activar las operaciones reales.", "Minha conta": "Mi cuenta", "Preferências": "Preferencias", "Sair do painel": "Cerrar sesión", "Pesquisar": "Buscar", "Notificações": "Notificaciones", "Processando…": "Procesando…", "Salvar alterações": "Guardar cambios", "Nova caixa postal": "Nuevo buzón", "Workspace / visão geral": "Espacio / resumen", "Sinal da operação": "Señal operativa", "Sincronizando o workspace...": "Sincronizando el espacio...", "Domínios activos": "Dominios activos", "Mensagens recebidos": "Mensajes recibidos", "Saúde da operação": "Salud operativa", "Todos verificados": "Todos verificados", "Volume de mensagens": "Volumen de mensajes", "Movimento do workspace": "Actividad del espacio", "Capacidade": "Capacidad", "Armazenamento": "Almacenamiento", "Ajustar capacidade": "Ajustar capacidad", "Mensagens recentes": "Mensajes recientes", "Ver caixa completa": "Ver bandeja completa", "Atividade": "Actividad", "Últimos eventos": "Últimos eventos", "Ver histórico de atividades": "Ver historial de actividad", "Fonte: workspace atual": "Fuente: espacio de trabajo actual", "Segurança": "Seguridad", "Acesso e proteção": "Acceso y protección", "MFA para administradores": "MFA para administradores", "Alertas de segurança": "Alertas de seguridad", "Trilha de auditoria": "Registro de auditoría", "Registrar eventos do workspace": "Registrar eventos del espacio de trabajo", "Redefinir minha senha": "Restablecer mi contraseña", "Infraestrutura": "Infraestructura", "Conexão com a VPS": "Conexión con la VPS", "Conectada": "Conectada", "Pronta para conectar": "Lista para conectar", "Sincronização sob demanda": "Sincronización bajo demanda", "Verificar conexão": "Verificar conexión", "Preferências de envio": "Preferencias de envío", "Políticas avançadas": "Políticas avanzadas", "Sistema / configurações": "Sistema / configuración", "Ajuste o sistema ao": "Ajusta el sistema a tu", "seu ritmo.": "ritmo.", "Defina capacidade, segurança, preferências e o ponto de conexão com a infraestrutura de e-mail da sua VPS.": "Define la capacidad, la seguridad, las preferencias y el punto de conexión con la infraestructura de correo de tu VPS.", "01 / Capacidade": "01 / Capacidad", "Nenhum uso registrado": "Ningún uso registrado", "Limite ainda não configurado": "Límite aún no configurado", "02 / Segurança": "02 / Seguridad", "Mantenha as áreas internas protegidas com políticas claras para o workspace.": "Mantén las áreas internas protegidas con políticas claras para el espacio de trabajo.", "Link de redefinição enviado para o e-mail do administrador.": "Enlace de restablecimiento enviado al correo del administrador.", "03 / Infraestrutura": "03 / Infraestructura", "A camada de integração mantém o painel separado da infraestrutura e expõe apenas operações autorizadas para domínios, caixas e mensagens.": "La capa de integración mantiene el panel separado de la infraestructura y expone solo operaciones autorizadas para dominios, buzones y mensajes.", "Nome do ambiente": "Nombre del entorno", "Não configurado": "No configurado", "Verificando…": "Verificando…", "Perfil, login Google e recuperação de acesso": "Perfil, inicio de sesión de Google y recuperación de acceso", "Preferências de envio prontas para conectar à VPS.": "Las preferencias de envío están listas para conectarse a la VPS.", "As informações da conta são gerenciadas pelo provedor OAuth.": "La información de la cuenta es gestionada por el proveedor OAuth.", "Políticas avançadas disponíveis na camada segura.": "Las políticas avanzadas están disponibles en la capa segura.", "Preferências salvas com segurança.": "Preferencias guardadas de forma segura.", "Defina um limite de pelo menos 50 GB.": "Define un límite de al menos 50 GB.", "Conexão verificada com a API da VPS.": "Conexión verificada con la API de la VPS.", "API da VPS não configurada ou indisponível.": "La API de la VPS no está configurada o no está disponible.", "Sincronizando": "Sincronizando", "Não foi possível carregar": "No se pudo cargar", "Verifique a conexão do backend e tente novamente.": "Verifica la conexión del backend e inténtalo de nuevo.", "Nenhum registro de": "No hay registros de", "foi persistido ainda.": "todavía.", "Atividades": "Actividades", "Mensagens": "Mensajes", "Webhooks": "Webhooks", "Nome do ambiente conectado": "Nombre del entorno conectado"
  }
};

export function translateValue(language: Language, value: string) {
  return dictionaries[language][value] || value;
}

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (value: string) => string } | null>(null);

type TranslationState = { source: string; rendered: string };
type TranslatableAttribute = "aria-label" | "placeholder" | "title";

const originalText = new WeakMap<Text, TranslationState>();
const originalAttributes = new WeakMap<HTMLElement, Map<TranslatableAttribute, TranslationState>>();

function replacePhrases(text: string, dictionary: Dictionary) {
  return Object.entries(dictionary)
    .sort(([a], [b]) => b.length - a.length)
    .reduce((result, [from, to]) => result.replaceAll(from, to), text);
}

function invertDictionary(dictionary: Dictionary) {
  return Object.fromEntries(Object.entries(dictionary).map(([from, to]) => [to, from]));
}

function translateTextNodes(dictionary: Dictionary, previousDictionary: Dictionary = {}) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  const reverseDictionary = invertDictionary(previousDictionary);
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const current = textNode.nodeValue || "";
    const currentTrimmed = current.trim();
    if (!currentTrimmed) continue;
    const state = originalText.get(textNode);
    const source = state && state.rendered === currentTrimmed ? state.source : replacePhrases(currentTrimmed, reverseDictionary);
    const translated = replacePhrases(source, dictionary);
    originalText.set(textNode, { source, rendered: translated });
    if (currentTrimmed !== translated) textNode.nodeValue = current.replace(currentTrimmed, translated);
  }
}

function translateAttributes(dictionary: Dictionary, previousDictionary: Dictionary = {}) {
  const reverseDictionary = invertDictionary(previousDictionary);
  document.querySelectorAll<HTMLElement>("[aria-label], [placeholder], [title]").forEach((element) => {
    const states = originalAttributes.get(element) || new Map<TranslatableAttribute, TranslationState>();
    for (const attribute of ["aria-label", "placeholder", "title"] as const) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const state = states.get(attribute);
      const source = state && state.rendered === value ? state.source : replacePhrases(value, reverseDictionary);
      const translated = replacePhrases(source, dictionary);
      states.set(attribute, { source, rendered: translated });
      if (translated !== value) element.setAttribute(attribute, translated);
    }
    originalAttributes.set(element, states);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem("altxcrm-language") as Language) || "pt-BR");
  const dictionary = dictionaries[language];
  const previousDictionaryRef = useRef<Dictionary>({});
  const setLanguage = useCallback((next: Language) => {
    localStorage.setItem("altxcrm-language", next);
    setLanguageState(next);
  }, []);
  const value = useMemo(() => ({ language, setLanguage, t: (text: string) => translateValue(language, text) }), [language, dictionary, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
    const previousDictionary = previousDictionaryRef.current;
    translateTextNodes(dictionary, previousDictionary);
    translateAttributes(dictionary, previousDictionary);
    previousDictionaryRef.current = dictionary;
    const observer = new MutationObserver(() => { translateTextNodes(dictionary, dictionary); translateAttributes(dictionary, dictionary); });
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
