import { Navigate, Route, Routes } from "react-router-dom";

import { GroupPage } from "./pages/GroupPage";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/groups/:groupId" element={<GroupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
