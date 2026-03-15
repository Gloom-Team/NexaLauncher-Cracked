import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Profiles from "./pages/Profiles";
import Gaming from "./pages/Gaming";
import Performance from "./pages/Performance";
import StartupBackground from "./pages/StartupBackground";
import Cleanup from "./pages/Cleanup";
import Tweaks from "./pages/Tweaks";
import Annoyances from "./pages/Annoyances";
import Privacy from "./pages/Privacy";
import Diagnostics from "./pages/Diagnostics";
import Automation from "./pages/Automation";
import UndoSafety from "./pages/UndoSafety";
import Advanced from "./pages/Advanced";
import SystemInfo from "./pages/SystemInfo";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/gaming" element={<Gaming />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/startup" element={<StartupBackground />} />
        <Route path="/cleanup" element={<Cleanup />} />
        <Route path="/tweaks" element={<Tweaks />} />
        <Route path="/annoyances" element={<Annoyances />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/automation" element={<Automation />} />
        <Route path="/undo" element={<UndoSafety />} />
        <Route path="/advanced" element={<Advanced />} />
        <Route path="/system" element={<SystemInfo />} />
        <Route path="/changelog" element={<UndoSafety />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
