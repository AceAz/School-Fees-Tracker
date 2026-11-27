// @ts-ignore React dependencies and typings are supplied by the app environment.
import { useEffect, useMemo, useState, FormEvent } from "react"
// @ts-ignore CSS modules are handled by the bundler.
import './App.css'

/* ---------- Types ---------- */
interface Payment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  totalFee: number;
  dueDate: string; // YYYY-MM-DD
  payments: Payment[];
}

type Status = "paid" | "partial" | "overdue" | "unpaid";
type Filter = "all" | Status;

/* ---------- Helpers ---------- */
const STORAGE_KEY = "fee-tracker:students";
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const paidOf = (s: Student) => s.payments.reduce((sum, p) => sum + p.amount, 0);

function statusOf(s: Student): Status {
  const paid = paidOf(s);
  if (paid >= s.totalFee) return "paid";
  if (s.dueDate < today()) return "overdue";
  return paid > 0 ? "partial" : "unpaid";
}

const STATUS_LABEL: Record<Status, string> = {
  paid: "Paid in full",
  partial: "Part paid",
  overdue: "Overdue",
  unpaid: "Not paid",
};

const SAMPLE: Student[] = [
  {
    id: uid(),
    name: "Amara Okafor",
    grade: "Grade 5",
    totalFee: 1200,
    dueDate: "2026-12-01",
    payments: [{ id: uid(), amount: 500, date: "2026-09-02", note: "Term 1" }],
  },
  {
    id: uid(),
    name: "Liam Chen",
    grade: "Grade 3",
    totalFee: 1000,
    dueDate: "2026-10-15",
    payments: [],
  },
];

function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Student[]) : SAMPLE;
  } catch {
    return SAMPLE;
  }
}

/* ---------- Component ---------- */
export default function FeeTracker() {
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      /* storage unavailable; keep working in memory */
    }
  }, [students]);

  const totals = useMemo(() => {
    const billed = students.reduce((s, x) => s + x.totalFee, 0);
    const collected = students.reduce((s, x) => s + paidOf(x), 0);
    return { billed, collected, outstanding: Math.max(billed - collected, 0) };
  }, [students]);

  const visible = students.filter(
    (s) =>
      (filter === "all" || statusOf(s) === filter) &&
      s.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function addStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const student: Student = {
      id: uid(),
      name: String(f.get("name")).trim(),
      grade: String(f.get("grade")).trim(),
      totalFee: Number(f.get("totalFee")),
      dueDate: String(f.get("dueDate")),
      payments: [],
    };
    if (!student.name || !(student.totalFee > 0)) return;
    setStudents((prev) => [student, ...prev]);
    e.currentTarget.reset();
  }

  function addPayment(studentId: string, amount: number, note: string) {
    if (!(amount > 0)) return;
    const payment: Payment = { id: uid(), amount, date: today(), note };
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, payments: [...s.payments, payment] } : s
      )
    );
  }

  function removeStudent(id: string) {
    if (window.confirm("Remove this student and their payment history?")) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="ft">
      <style>{css}</style>

      <header className="ft-head">
        <h1>School fee tracker</h1>
        <dl className="ft-totals">
          <div>
            <dt>Billed</dt>
            <dd>{money(totals.billed)}</dd>
          </div>
          <div>
            <dt>Collected</dt>
            <dd className="good">{money(totals.collected)}</dd>
          </div>
          <div>
            <dt>Still owed</dt>
            <dd className="warn">{money(totals.outstanding)}</dd>
          </div>
        </dl>
      </header>

      <form className="ft-add" onSubmit={addStudent}>
        <label>
          Student name
          <input name="name" required />
        </label>
        <label>
          Grade
          <input name="grade" placeholder="Grade 4" />
        </label>
        <label>
          Fee amount
          <input name="totalFee" type="number" min="0" step="1000" required />
        </label>
        <label>
          Due date
          <input name="dueDate" type="date" defaultValue={today()} required />
        </label>
        <button type="submit">Add student</button>
      </form>

      <div className="ft-bar">
        <input
          type="search"
          placeholder="Search by name"
          aria-label="Search students"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div role="group" aria-label="Filter by status" className="ft-filters">
          {(["all", "unpaid", "partial", "overdue", "paid"] as Filter[]).map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="ft-empty">
          No students match. Add one above or change the filter.
        </p>
      ) : (
        <ul className="ft-list">
          {visible.map((s) => {
            const paid = paidOf(s);
            const status = statusOf(s);
            const pct = Math.min(100, Math.round((paid / s.totalFee) * 100));
            const open = openId === s.id;
            return (
              <li key={s.id} className="ft-row">
                <div className="ft-main">
                  <div>
                    <strong>{s.name}</strong>
                    <span className="muted"> {s.grade}</span>
                  </div>
                  <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
                </div>

                <div
                  className="bar"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.name} fee progress`}
                >
                  <span style={{ width: `${pct}%` }} className={status} />
                </div>

                <div className="ft-meta">
                  <span>
                    {money(paid)} of {money(s.totalFee)}
                  </span>
                  <span>Due {s.dueDate}</span>
                  <button className="link" onClick={() => setOpenId(open ? null : s.id)}>
                    {open ? "Hide payments" : "Record or view payments"}
                  </button>
                </div>

                {open && (
                  <div className="ft-detail">
                    <PaymentForm
                      balance={Math.max(s.totalFee - paid, 0)}
                      onSubmit={(amt, note) => addPayment(s.id, amt, note)}
                    />
                    {s.payments.length === 0 ? (
                      <p className="muted">No payments recorded yet.</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Note</th>
                            <th className="num">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.payments.map((p) => (
                            <tr key={p.id}>
                              <td>{p.date}</td>
                              <td>{p.note || "—"}</td>
                              <td className="num">{money(p.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <button className="danger" onClick={() => removeStudent(s.id)}>
                      Remove student
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Payment form ---------- */
function PaymentForm({
  balance,
  onSubmit,
}: {
  balance: number;
  onSubmit: (amount: number, note: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(Number(amount), note.trim());
    setAmount("");
    setNote("");
  }

  return (
    <form className="ft-pay" onSubmit={submit}>
      <label>
        Payment amount
        <input
          type="number"
          min="0"
          step="1000"
          value={amount}
          placeholder={balance ? `Up to ${money(balance)}` : "Fully paid"}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>
      <label>
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Term 2, cash" />
      </label>
      <button type="submit">Save payment</button>
    </form>
  );
}

/* ---------- Styles ---------- */
const css = `
.ft{--ink:#1f2a44;--line:#dce4f0;--paper:#f7f8fb;--card:#fff;--good:#2e7d5b;--warn:#b7791f;--bad:#c0392b;--mute:#5f6b85;
  font-family:"Source Serif 4",Georgia,serif;color:var(--ink);background:var(--paper);max-width:860px;margin:0 auto;padding:24px 16px 48px;line-height:1.5}
.ft *{box-sizing:border-box}
.ft h1{font-size:2rem;margin:0 0 16px;font-weight:600}
.ft input,.ft button{font:inherit}
.ft-totals{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 24px}
.ft-totals div{border-left:3px solid var(--line);padding-left:12px}
.ft-totals dt{color:var(--mute);font-size:.9rem}
.ft-totals dd{margin:0;font-size:1.5rem;font-weight:600}
.good{color:var(--good)}.warn{color:var(--warn)}
.ft-add,.ft-pay{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;background:var(--card);border:1px solid var(--line);padding:16px;border-radius:6px}
.ft label{display:flex;flex-direction:column;font-size:.9rem;color:var(--mute);gap:4px;flex:1 1 140px}
.ft input{padding:8px 10px;border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink)}
.ft button{cursor:pointer;border:1px solid var(--ink);background:var(--ink);color:#fff;padding:8px 14px;border-radius:4px}
.ft button:focus-visible,.ft input:focus-visible{outline:2px solid #3b6fd4;outline-offset:2px}
.ft-bar{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0 12px;align-items:center}
.ft-bar input{flex:1 1 200px}
.ft-filters{display:flex;flex-wrap:wrap;gap:6px}
.ft-filters button{background:transparent;color:var(--ink);border-color:var(--line)}
.ft-filters button[aria-pressed="true"]{background:var(--ink);color:#fff;border-color:var(--ink)}
.ft-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.ft-row{padding:16px 0;border-bottom:1px solid var(--line)}
.ft-main{display:flex;justify-content:space-between;gap:8px;align-items:center}
.muted{color:var(--mute)}
.pill{font-size:.85rem;padding:2px 10px;border-radius:999px;border:1px solid currentColor}
.pill.paid{color:var(--good)}.pill.partial{color:var(--warn)}.pill.overdue{color:var(--bad)}.pill.unpaid{color:var(--mute)}
.bar{height:6px;background:var(--line);border-radius:3px;margin:10px 0;overflow:hidden}
.bar span{display:block;height:100%}
.bar .paid{background:var(--good)}.bar .partial{background:var(--warn)}.bar .overdue{background:var(--bad)}.bar .unpaid{background:var(--mute)}
.ft-meta{display:flex;flex-wrap:wrap;gap:16px;align-items:center;font-size:.95rem;color:var(--mute)}
.ft button.link{background:none;border:none;color:#3b6fd4;padding:0;text-decoration:underline}
.ft-detail{margin-top:12px;display:grid;gap:12px}
.ft-detail table{width:100%;border-collapse:collapse;font-size:.95rem}
.ft-detail th,.ft-detail td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}
.num{text-align:right!important}
.ft button.danger{justify-self:start;background:transparent;color:var(--bad);border-color:var(--bad)}
.ft-empty{color:var(--mute);padding:24px 0}
@media (max-width:560px){.ft-totals{grid-template-columns:1fr}}
`