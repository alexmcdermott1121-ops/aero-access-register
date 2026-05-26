import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, KeyRound, LayoutDashboard, LogOut, PlusCircle, Settings, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useData } from "../lib/DataContext";
import { SetupNotice } from "./SetupNotice";

export function Layout() {
  const navigate = useNavigate();
  const { currentUser, demoMode } = useData();

  async function signOut() {
    await supabase?.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={28} />
          <div>
            <span>AERO</span>
            <strong>Key & Access Register</strong>
          </div>
        </div>
        <nav>
          <NavLink to="/"><LayoutDashboard size={18} />Dashboard</NavLink>
          <NavLink to="/register"><KeyRound size={18} />Access Register</NavLink>
          <NavLink to="/records/new"><PlusCircle size={18} />Add Record</NavLink>
          <NavLink to="/reports"><BarChart3 size={18} />Reports</NavLink>
          <NavLink to="/account"><Settings size={18} />Account</NavLink>
        </nav>
        <div className="sidebar-footer">
          <span>{demoMode ? "Demo/setup mode" : currentUser?.email}</span>
          <button className="icon-text" onClick={signOut} type="button"><LogOut size={16} />Sign out</button>
        </div>
      </aside>
      <main className="content">
        <SetupNotice />
        <Outlet />
      </main>
    </div>
  );
}
