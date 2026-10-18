/* 路由入口:三栏外壳 + 项目六阶段子路由(/project/:id/:stage?)。 */
import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { ProjectShell } from "./shell/ProjectShell";
import { ProjectsView } from "./views/ProjectsView";
import { SettingsView } from "./views/SettingsView";
import { AssetDetailView } from "./views/AssetDetailView";
import { LibraryView } from "./views/LibraryView";
import { StageRedirect, StageRoute } from "./views/StageRoute";
import { ProjectsProvider } from "./state/projects";
import { UIProvider } from "./state/ui";

export function App() {
  return (
    <HashRouter>
      <UIProvider>
        <ProjectsProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<ProjectsView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/library/:sourceId" element={<AssetDetailView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/project/:id" element={<ProjectShell />}>
                <Route index element={<StageRedirect />} />
                <Route path=":stage" element={<StageRoute />} />
              </Route>
              <Route path="*" element={<ProjectsView />} />
            </Route>
          </Routes>
        </ProjectsProvider>
      </UIProvider>
    </HashRouter>
  );
}
