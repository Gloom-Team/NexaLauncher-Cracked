import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 ml-56 p-6 overflow-y-auto">
        <div key={location.pathname} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
