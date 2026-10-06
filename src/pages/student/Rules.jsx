import { FileText, ShieldCheck, QrCode, AlertOctagon, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Rules() {
  const rules = [
    {
      icon: QrCode,
      title: "RFID & Boarding Rules",
      points: [
        "Students must carry their valid FAST NUCES RFID student card at all times.",
        "Scan the QR code displayed near the bus entrance immediately upon boarding.",
        "Boarding without scanning RFID/QR code will be marked as an unauthorized trip.",
        "Passes and cards are strictly non-transferable between students.",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Seat & Conduct Rules",
      points: [
        "Day scholars must utilize available seating and follow conductor instructions.",
        "Standing in the front aisle while shuttle is in motion is strictly prohibited for safety.",
        "Maintain decorum and discipline; loud audio playback without headphones is forbidden.",
        "Keep seats and windows clean; littering inside the vehicle incurs a penalty.",
      ],
    },
    {
      icon: AlertOctagon,
      title: "Violation Policies & Fine Structure",
      points: [
        "Unpaid Monthly Transport Fee: Rs. 500 late surcharge after due date.",
        "Damaged Seat or Equipment: Fine equal to full repair cost + Rs. 1,000 penalty.",
        "Unauthorized Transfer of Student Boarding Pass: Rs. 1,500 fine and temporary card suspension.",
        "Misbehavior with Transport Staff: Immediate disciplinary committee referral.",
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Transport Rules & Policies</h1>
        <p className="text-sm text-muted-foreground">Guidelines and regulations for FAST NUCES Chiniot-Faisalabad Campus shuttle transport.</p>
      </div>

      <div className="space-y-4">
        {rules.map((rule, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <rule.icon className="h-5 w-5 text-primary" /> {rule.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                {rule.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span className="text-foreground">{pt}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
