import { useState } from "react";
import { HelpCircle, Search, Phone, Mail, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    q: "How does QR attendance boarding work?",
    a: "When boarding your university shuttle, open the SmartU app, navigate to Attendance, and tap 'Scan QR Code'. Point your camera at the QR code displayed inside the bus near the conductor station. Attendance is recorded instantly upon QR validation.",
  },
  {
    q: "What should I do if the QR scanner fails or is offline?",
    a: "If your camera scanner experiences issues or network drops, inform your shuttle conductor. They can manually verify your RFID student card or mark your attendance on their tablet terminal.",
  },
  {
    q: "Can Day Scholars book seats online?",
    a: "Seat availability for Day Scholars is provided as a live view-only feature showing real-time occupancy. Online seat reservations are strictly reserved for hostelite shuttle routes.",
  },
  {
    q: "How do I pay my monthly transport fee?",
    a: "Go to Payments in your student portal. Select 'Pay Fee Now' to pay online via JazzCash, EasyPaisa, or Debit Card, or upload a copy of your bank challan receipt.",
  },
  {
    q: "What happens if I miss my scheduled shuttle?",
    a: "Check the Live Tracking tab to view the ETA of the next available shuttle on your route or joint shuttle services departing campus.",
  },
];

export default function HelpSupport() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState(0);

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Help & Support</h1>
        <p className="text-sm text-muted-foreground">Find answers to transport FAQs or contact the FAST CFD Transport Office.</p>
      </div>

      {/* Emergency Hotline Banner */}
      <Card className="border-rose-500/40 bg-rose-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Emergency & Safety Assistance</h2>
              <p className="text-xs text-muted-foreground">Campus Security Hotline: +92 41 111 128 128 (Ext. 109)</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => window.open("tel:041111128128")}>
            <Phone className="h-3.5 w-3.5 mr-1" /> Call Security
          </Button>
        </CardContent>
      </Card>

      {/* FAQ Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search help questions (e.g., QR attendance, fee payment)..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="rounded-xl border border-border p-3.5 bg-card/60">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-semibold text-foreground"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-primary shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                {isOpen && <p className="mt-2 text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">{faq.a}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Transport Office Contacts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-border p-3.5 space-y-1 bg-secondary/30">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-primary" /> Transport Desk
            </p>
            <p className="text-muted-foreground">Phone: 041-111-128-128 Ext 204</p>
            <p className="text-muted-foreground">Hours: Mon – Fri (8:00 AM – 4:00 PM)</p>
          </div>
          <div className="rounded-xl border border-border p-3.5 space-y-1 bg-secondary/30">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-primary" /> Support Email
            </p>
            <p className="text-muted-foreground">Email: transport.cfd@nu.edu.pk</p>
            <p className="text-muted-foreground">Location: Transport Hub, Block A</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
