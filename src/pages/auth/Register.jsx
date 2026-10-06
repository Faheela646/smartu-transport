import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bus, CheckCircle2, GraduationCap, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFleetStore } from "@/store/useFleetStore";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import { useStudentStore } from "@/store/useStudentStore";
import { ROLL_NO_REGEX } from "@/data/mockData";

const BANKS = {
  MEEZAN: {
    name: "Meezan Bank Limited (FAST-NU)",
    title: "FAST NU",
    account: "04100115127577",
    iban: "PK05MEZN0004100115127577",
    branch: "Sargodha Road Branch, Faisalabad",
    code: "0410",
  },
  FAYSAL: {
    name: "Faysal Bank Limited",
    title: "BCCI FAST NUCES CFD OPERATIONS",
    account: "3003301900235027",
    iban: "PK21FAYS3003301900235027",
    branch: "Lasani Town Branch, Sargodha Road, Faisalabad",
    code: "3003",
  },
  UBL: {
    name: "United Bank Limited (UBL)",
    title: "BCCI FAST NUCES Chiniot Faisalabad",
    account: "0659367889753",
    iban: "PK23UNIL0109000367889753",
    branch: "R.D.F Center Branch, G-9/1, Islamabad",
    code: "0659",
  },
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  rollNo: "",
  staffId: "",
  semester: "FALL-2026",
  routeId: "",
  pickupStop: "",
  bank: "",
  paymentReference: "",
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read the selected payment slip."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read the selected payment slip."));
    reader.readAsDataURL(file);
  });
}

export default function Register() {
  const routes = useFleetStore((state) => state.routes);
  const students = useStudentStore((state) => state.students);
  const applications = useRegistrationStore((state) => state.applications);
  const submitApplication = useRegistrationStore((state) => state.submitApplication);
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("");
  const [studentType, setStudentType] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const route = routes.find((item) => item.id === form.routeId);
  const stops = route?.stops || [];
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const chooseAccountType = (type) => {
    setAccountType(type);
    setStudentType("");
    setForm({ ...EMPTY_FORM, routeId: routes[0]?.id || "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!receiptFile) {
      toast.error("Upload an image of your transport fee payment slip.");
      return;
    }
    if (!receiptFile.type.startsWith("image/")) {
      toast.error("Payment proof must be an image file.");
      return;
    }
    if (receiptFile.size > 1024 * 1024) {
      toast.error("The payment slip image must be 1 MB or smaller.");
      return;
    }

    const identifier = accountType === "student" ? form.rollNo.trim().toUpperCase() : form.staffId.trim().toUpperCase();
    if (accountType === "student" && !ROLL_NO_REGEX.test(identifier)) {
      toast.error("Enter a valid roll number, such as 22F-3284.");
      return;
    }

    const alreadyRegistered = students.some((student) =>
      student.rollNo?.toUpperCase() === identifier ||
      student.email?.toLowerCase() === form.email.trim().toLowerCase()
    );
    const alreadyApplied = applications.some((application) =>
      application.status !== "Rejected" &&
      ((application.identifier || "").toUpperCase() === identifier ||
        application.email?.toLowerCase() === form.email.trim().toLowerCase())
    );
    if (alreadyRegistered || alreadyApplied) {
      toast.error("An account or application already exists for this ID or email.");
      return;
    }
    if (!route || !form.pickupStop) {
      toast.error("Select a route and pickup stop.");
      return;
    }

    setSubmitting(true);
    try {
      const receiptDataUrl = await readFileAsDataUrl(receiptFile);
      submitApplication({
        accountType,
        studentType: accountType === "student" ? studentType : null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        identifier,
        rollNo: accountType === "student" ? identifier : null,
        staffId: accountType === "faculty" ? identifier : null,
        role: accountType === "faculty" ? "FACULTY" : studentType,
        semester: form.semester.trim(),
        routeId: route.id,
        pickupStop: form.pickupStop,
        bank: form.bank,
        paymentReference: form.paymentReference.trim(),
        receiptName: receiptFile.name,
        receiptDataUrl,
      });
      setSubmitted(true);
      toast.success("Application submitted for Transport Admin approval.");
    } catch (error) {
      toast.error(error.message || "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
            <Bus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Transport Registration</h1>
          <p className="mt-1 text-sm text-white/70">Apply for FAST NUCES CFD campus transport.</p>
        </div>

        {submitted ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              <div>
                <h2 className="text-lg font-bold">Application received</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your application and payment slip are pending Transport Admin review. You can sign in once your account is approved.
                </p>
              </div>
              <Button onClick={() => navigate("/login")}>Return to sign in</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {!accountType ? "Who is applying?" : accountType === "student" && !studentType ? "Choose your student category" : "Transport application"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!accountType ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="h-auto justify-start gap-3 p-5" onClick={() => chooseAccountType("student")}>
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span className="text-left"><strong className="block">Student</strong><span className="text-xs text-muted-foreground">Register with your university roll number</span></span>
                  </Button>
                  <Button variant="outline" className="h-auto justify-start gap-3 p-5" onClick={() => chooseAccountType("faculty")}>
                    <UserRound className="h-5 w-5 text-primary" />
                    <span className="text-left"><strong className="block">Faculty</strong><span className="text-xs text-muted-foreground">Register with your staff ID</span></span>
                  </Button>
                </div>
              ) : accountType === "student" && !studentType ? (
                <div className="space-y-3">
                  <Button variant="outline" className="h-auto w-full justify-start p-4" onClick={() => setStudentType("DAY_SCHOLAR")}>
                    <span className="text-left"><strong className="block">Day Scholar</strong><span className="text-xs text-muted-foreground">I commute to campus from a pickup stop.</span></span>
                  </Button>
                  <Button variant="outline" className="h-auto w-full justify-start p-4" onClick={() => setStudentType("HOSTELITE")}>
                    <span className="text-left"><strong className="block">Hostelite</strong><span className="text-xs text-muted-foreground">I live in a hostel and need transport service.</span></span>
                  </Button>
                  <Button variant="ghost" onClick={() => setAccountType("")}>Back</Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <span>{accountType === "faculty" ? "Faculty application" : studentType === "HOSTELITE" ? "Hostelite application" : "Day Scholar application"}</span>
                    <Button variant="ghost" size="sm" onClick={() => accountType === "faculty" ? setAccountType("") : setStudentType("")}>Change</Button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <section className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" autoComplete="name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="03XX-XXXXXXX" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="identifier">{accountType === "student" ? "University roll number" : "Faculty staff ID"}</Label>
                        <Input id="identifier" value={accountType === "student" ? form.rollNo : form.staffId} onChange={(event) => updateForm(accountType === "student" ? "rollNo" : "staffId", event.target.value)} placeholder={accountType === "student" ? "e.g. 22F-3284" : "Your university staff ID"} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="semester">Semester</Label>
                        <Input id="semester" value={form.semester} onChange={(event) => updateForm("semester", event.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="route">Requested bus route</Label>
                        <select id="route" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.routeId} onChange={(event) => { updateForm("routeId", event.target.value); updateForm("pickupStop", ""); }} required>
                          <option value="">Select a route</option>
                          {routes.map((item) => <option key={item.id} value={item.id}>{item.shortName || item.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="pickupStop">Pickup stop</Label>
                        <select id="pickupStop" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.pickupStop} onChange={(event) => updateForm("pickupStop", event.target.value)} required disabled={!route}>
                          <option value="">Select a pickup stop</option>
                          {stops.map((stop) => <option key={`${route.id}-${stop.name}`} value={stop.name}>{stop.name}</option>)}
                        </select>
                      </div>
                    </section>

                    <section className="space-y-3 rounded-lg border border-border p-4">
                      <div>
                        <h2 className="text-sm font-semibold">Transport fee payment</h2>
                        <p className="text-xs text-muted-foreground">Pay the fee for the semester above, then upload your payment slip.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bank">Bank used for payment</Label>
                        <select id="bank" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.bank} onChange={(event) => updateForm("bank", event.target.value)} required>
                          <option value="">Select a bank</option>
                          {Object.entries(BANKS).map(([key, bank]) => <option key={key} value={key}>{bank.name}</option>)}
                        </select>
                      </div>
                      {form.bank && (
                        <div className="rounded-md bg-secondary/50 p-3 text-xs">
                          <p><strong>Account title:</strong> {BANKS[form.bank].title}</p>
                          <p><strong>Account number:</strong> {BANKS[form.bank].account}</p>
                          <p><strong>IBAN:</strong> {BANKS[form.bank].iban}</p>
                          <p><strong>Branch:</strong> {BANKS[form.bank].branch}</p>
                          <p><strong>Branch code:</strong> {BANKS[form.bank].code}</p>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="paymentReference">Payment transaction/reference number (if available)</Label>
                        <Input id="paymentReference" value={form.paymentReference} onChange={(event) => updateForm("paymentReference", event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="receipt">Payment slip image (required, max 1 MB)</Label>
                        <Input id="receipt" type="file" accept="image/*" onChange={(event) => setReceiptFile(event.target.files?.[0] || null)} required />
                        {receiptFile && <p className="text-xs text-muted-foreground"><Upload className="mr-1 inline h-3 w-3" />{receiptFile.name}</p>}
                      </div>
                    </section>

                    <p className="text-xs text-muted-foreground">Submitting sends your request to the Transport Admin for approval. Account access is enabled only after approval.</p>
                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>{submitting ? "Submitting..." : "Submit transport application"}</Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        )}
        <p className="mt-4 text-center text-xs text-white/60">Applications are stored locally in this demo and are visible to the admin on this browser.</p>
      </div>
    </div>
  );
}
