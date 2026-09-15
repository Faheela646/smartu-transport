import { useNavigate, useLocation } from "react-router-dom";
import { QrCode } from "lucide-react";

export function BoardingPassFab() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.includes("boarding-pass")) return null;

  return (
    <button
      onClick={() => navigate("/student/boarding-pass")}
      className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-primary shadow-lg transition-transform active:scale-95 lg:left-[calc(50%-16rem)]"
      aria-label="Show boarding pass"
    >
      <QrCode className="h-5 w-5" />
      <span className="text-xs font-semibold">Boarding Pass</span>
    </button>
  );
}
