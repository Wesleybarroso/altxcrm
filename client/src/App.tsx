import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Domains from "./pages/Domains";
import Mailboxes from "./pages/Mailboxes";
import Inbox from "./pages/Inbox";
import Scheduled from "./pages/Scheduled";
import Archive from "./pages/Archive";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/"><ProtectedRoute><Home /></ProtectedRoute></Route>
      <Route path="/domains"><ProtectedRoute><Domains /></ProtectedRoute></Route>
      <Route path="/mailboxes"><ProtectedRoute><Mailboxes /></ProtectedRoute></Route>
      <Route path="/inbox"><ProtectedRoute><Inbox /></ProtectedRoute></Route>
      <Route path="/scheduled"><ProtectedRoute><Scheduled /></ProtectedRoute></Route>
      <Route path="/archive"><ProtectedRoute><Archive /></ProtectedRoute></Route>
      <Route path="/integrations"><ProtectedRoute><Integrations /></ProtectedRoute></Route>
      <Route path="/settings"><ProtectedRoute><Settings /></ProtectedRoute></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="bottom-right" toastOptions={{ style: { background: "#102523", border: "1px solid #31584e", color: "#eaf5e8" } }} />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
