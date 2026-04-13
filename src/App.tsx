import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/app-layout";
import { AccountList } from "@/components/accounts";
import { ContactList } from "@/components/contacts";
import { ActionItemList } from "@/components/action-items";
import { MeetingSummaryList } from "@/components/meeting-summaries";
import { IdeaList } from "@/components/ideas";
import { ProjectList } from "@/components/projects";
import { Dashboard, BoardDashboard } from "@/components/dashboard";
import { CommandPalette } from "@/components/command-palette";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/board" element={<BoardDashboard />} />
            <Route path="/accounts" element={<AccountList />} />
            <Route path="/contacts" element={<ContactList />} />
            <Route path="/action-items" element={<ActionItemList />} />
            <Route path="/meeting-summaries" element={<MeetingSummaryList />} />
            <Route path="/ideas" element={<IdeaList />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
        <CommandPalette />
      </HashRouter>
      <Toaster richColors position="bottom-right" />
    </QueryClientProvider>
    </ThemeProvider>
  );
}
