'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Filter,
  Globe,
  HelpCircle,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';

type Language = 'en' | 'hi' | 'te';
type View = 'Overview' | 'Transactions' | 'Settlement' | 'Exceptions' | 'Settings';
type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

type Transaction = {
  id: string;
  customer: string;
  phone: string;
  amount: number;
  status: TransactionStatus;
  method: string;
  date: string;
  paymentLink?: string;
};

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
};

const translations = {
  en: {
    title: 'Merchant Reconciliation',
    subtitle: 'Track payment settlement, links, and transaction health',
    createLink: 'Create Payment Link',
    sync: 'Sync Settlement',
    grossVolume: 'Gross Volume',
    settledAmount: 'Settled Amount',
    unmatched: 'Unmatched / Pending',
    successRate: 'Success Rate',
    recentTransactions: 'Recent Transactions',
    searchPlaceholder: 'Search by Order ID, Customer, or Phone...',
    allStatuses: 'All Statuses',
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    customer: 'Customer',
    orderId: 'Order ID',
    amount: 'Amount',
    status: 'Status',
    action: 'Action',
    export: 'Export CSV',
  },
  hi: {
    title: 'व्यापारी समाधान (Reconciliation)',
    subtitle: 'भुगतान निपटान, लिंक और लेनदेन की स्थिति ट्रैक करें',
    createLink: 'पेमेंट लिंक बनाएं',
    sync: 'सिंक करें',
    grossVolume: 'कुल मात्रा (Gross Volume)',
    settledAmount: 'प्राप्त राशि (Settled Amount)',
    unmatched: 'लंबित लेनदेन (Pending)',
    successRate: 'सफलता दर (Success Rate)',
    recentTransactions: 'हाल के लेनदेन',
    searchPlaceholder: 'ऑर्डर आईडी या ग्राहक खोजें...',
    allStatuses: 'सभी स्थितियां',
    completed: 'सफल',
    pending: 'लंबित',
    failed: 'विफल',
    customer: 'ग्राहक',
    orderId: 'ऑर्डर आईडी',
    amount: 'राशि',
    status: 'स्थिति',
    action: 'कार्रवाई',
    export: 'निर्यात (Export)',
  },
  te: {
    title: 'మర్చంట్ రికన్సిలియేషన్',
    subtitle: 'పేమెంట్ సెటిల్మెంట్, లింక్లు మరియు లావాదేవీలను ట్రాక్ చేయండి',
    createLink: 'పేమెంట్ లింక్ సృష్టించండి',
    sync: 'సింక్ చేయండి',
    grossVolume: 'మొత్తం వాల్యూమ్',
    settledAmount: 'జమ అయిన మొత్తం',
    unmatched: 'పెండింగ్ లావాదేవీలు',
    successRate: 'విజయవంతమైన రేటు',
    recentTransactions: 'ఇటీవలి లావాదేవీలు',
    searchPlaceholder: 'ఆర్డర్ ID లేదా కస్టమర్ పేరు శోధించండి...',
    allStatuses: 'అన్ని రకాలు',
    completed: 'పూర్తయింది',
    pending: 'పెండింగ్',
    failed: 'విఫలమైంది',
    customer: 'కస్టమర్',
    orderId: 'ఆర్డర్ ID',
    amount: 'మొత్తం',
    status: 'స్థితి',
    action: 'చర్య',
    export: 'ఎగుమతి చేయండి',
  },
} as const;

const navItems: { label: View; icon: typeof BarChart3 }[] = [
  { label: 'Overview', icon: BarChart3 },
  { label: 'Transactions', icon: CreditCard },
  { label: 'Settlement', icon: WalletCards },
  { label: 'Exceptions', icon: HelpCircle },
  { label: 'Settings', icon: Settings },
];

const initialTransactions: Transaction[] = [
  {
    id: 'ORD-9482',
    customer: 'Ananya Sharma',
    phone: '+91 98765 43210',
    amount: 2499,
    status: 'Completed',
    method: 'UPI (Google Pay)',
    date: '2 mins ago',
  },
  {
    id: 'ORD-9481',
    customer: 'Rajesh Kumar',
    phone: '+91 91234 56789',
    amount: 12500,
    status: 'Completed',
    method: 'Razorpay Link',
    date: '14 mins ago',
  },
  {
    id: 'ORD-9480',
    customer: 'Vikram Mehta',
    phone: '+91 99887 76655',
    amount: 4500,
    status: 'Pending',
    method: 'HDFC Netbanking',
    date: '1 hour ago',
  },
  {
    id: 'ORD-9479',
    customer: 'Priya Patel',
    phone: '+91 97654 32109',
    amount: 890,
    status: 'Failed',
    method: 'Credit Card',
    date: '3 hours ago',
  },
];

const formatINR = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const getAssistantResponse = (
  question: string,
  transactions: Transaction[],
): string => {
  const normalized = question.toLowerCase();
  const pending = transactions.find((transaction) =>
    normalized.includes(transaction.id.toLowerCase()),
  );

  if (pending?.status === 'Pending') {
    return `${pending.id} is pending because Razorpay has not received the final settlement confirmation yet. It was captured through ${pending.method}; a settlement sync should update it once the processor confirms the batch.`;
  }

  if (pending?.status === 'Failed') {
    return `${pending.id} is marked failed. The payment attempt was not completed by the processor, so no settlement will be created. You can create a new payment link for ${pending.customer}.`;
  }

  if (normalized.includes('refund')) {
    return 'For a refund, open the original payment in Razorpay, confirm the refundable amount, and submit the refund from the payment details view. Refunds can take 5–7 business days to appear in the customer’s account.';
  }

  if (normalized.includes('settle') || normalized.includes('settlement')) {
    return 'Settlement batches usually appear after the processor confirms capture. Use Sync Settlement to refresh pending records, then review any remaining unmatched amount in Exceptions.';
  }

  if (normalized.includes('failed')) {
    return 'Failed payments do not enter settlement. Check the payment method and processor response, then create a fresh payment link if the customer still wants to complete the order.';
  }

  if (normalized.includes('payment link') || normalized.includes('link')) {
    return 'Create a payment link from the top-right action. Enter the customer, item, and amount; the link is generated through Razorpay and the new order appears as Pending until settlement.';
  }

  return 'I can help with pending settlements, failed transactions, payment links, and refund processing. Try asking “Why is order ORD-9480 pending?”';
};

export default function Dashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(window.localStorage.getItem('merchant_session') === 'active');
    setAuthReady(true);
  }, []);

  const handleLogin = () => {
    window.localStorage.setItem('merchant_session', 'active');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('merchant_session');
    setIsAuthenticated(false);
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return isAuthenticated ? (
    <MerchantWorkspace onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }
    onLogin();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold tracking-tight">ReconcilePro</p>
                <p className="text-xs text-blue-100">Merchant Terminal</p>
              </div>
            </div>
            <p className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Know where every rupee stands.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">
              A calm control room for payment links, settlements, and exceptions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <CheckCircle2 className="h-4 w-4" />
            Secure merchant workspace
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold tracking-tight text-slate-900">ReconcilePro</p>
                <p className="text-xs text-slate-500">Merchant Terminal</p>
              </div>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-600">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Use any non-empty credentials for this demo session.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-700">
                Work email
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-700">
                Password
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[.99]"
              type="submit"
            >
              Enter dashboard
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function MerchantWorkspace({ onLogout }: { onLogout: () => void }) {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];
  const [activeView, setActiveView] = useState<View>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState('Today, 09:14');
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdPaymentLink, setCreatedPaymentLink] = useState('');
  const [linkForm, setLinkForm] = useState({
    customerName: '',
    phone: '',
    item: '',
    amount: '',
  });
  const [toast, setToast] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I can help explain settlements, failed transactions, payment links, or refunds.',
    },
  ]);

  useEffect(() => {
    const validViews: View[] = [
      'Overview',
      'Transactions',
      'Settlement',
      'Exceptions',
      'Settings',
    ];
    const syncFromHash = () => {
      const value = window.location.hash.replace('#', '') as View;
      if (validViews.includes(value)) setActiveView(value);
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const navigate = (view: View) => {
    setActiveView(view);
    window.history.replaceState(null, '', `#${view.toLowerCase()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesSearch =
        !query ||
        [item.customer, item.id, item.phone, item.method].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, transactions]);

  const pendingAmount = transactions
    .filter((item) => item.status === 'Pending')
    .reduce((total, item) => total + item.amount, 0);
  const settledAmount = transactions
    .filter((item) => item.status === 'Completed')
    .reduce((total, item) => total + item.amount, 0);
  const failedCount = transactions.filter((item) => item.status === 'Failed').length;

  const handleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    window.setTimeout(() => {
      setTransactions((current) =>
        current.map((item) =>
          item.status === 'Pending'
            ? { ...item, status: 'Completed', date: 'Just now' }
            : item,
        ),
      );
      setLastSynced('Just now');
      setIsSyncing(false);
      setToast('Settlement sync complete · pending records updated');
    }, 1200);
  };

  const handleExport = () => {
    const rows = [
      ['Order ID', 'Customer', 'Phone', 'Amount', 'Status', 'Method', 'Date'],
      ...filteredTransactions.map((item) => [
        item.id,
        item.customer,
        item.phone,
        item.amount.toFixed(2),
        item.status,
        item.method,
        item.date,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'merchant-reconciliation.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(`${filteredTransactions.length} transactions exported`);
  };

  const handleCreatePaymentLink = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError('');
    const amount = Number(linkForm.amount);
    if (
      !linkForm.customerName.trim() ||
      !linkForm.phone.trim() ||
      !linkForm.item.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setFormError('Complete every field with a valid amount.');
      return;
    }

    setIsCreatingLink(true);
    try {
      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'INR',
          description: linkForm.item.trim(),
          customer: {
            name: linkForm.customerName.trim(),
            contact: linkForm.phone.trim(),
          },
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        short_url?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || 'Unable to create payment link.');
      }

      const newOrder: Transaction = {
        id: `ORD-${Date.now().toString().slice(-4)}`,
        customer: linkForm.customerName.trim(),
        phone: linkForm.phone.trim(),
        amount,
        status: 'Pending',
        method: 'Razorpay Link',
        date: 'Just now',
        paymentLink: result.short_url,
      };
      setTransactions((current) => [newOrder, ...current]);
      setCreatedPaymentLink(result.short_url || '');
      setLinkForm({ customerName: '', phone: '', item: '', amount: '' });
      setToast('Payment link created · new order added as Pending');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to create payment link.',
      );
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleSendChat = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const question = chatInput.trim();
    if (!question) return;
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: question,
    };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput('');
    window.setTimeout(() => {
      setChatMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: getAssistantResponse(question, transactions),
        },
      ]);
    }, 280);
  };

  const renderView = () => {
    if (activeView === 'Transactions') {
      return (
        <section className="space-y-5">
          <PageIntro
            eyebrow="Workspace / Transactions"
            title="Transaction ledger"
            subtitle="Search, filter, export, and inspect every payment attempt."
            action={
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                {t.createLink}
              </button>
            }
          />
          <TransactionTable
            transactions={filteredTransactions}
            total={transactions.length}
            t={t}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            onExport={handleExport}
            onDetails={(transaction) =>
              setToast(
                transaction.paymentLink
                  ? `Payment link: ${transaction.paymentLink}`
                  : `${transaction.id} · ${transaction.status}`,
              )
            }
          />
        </section>
      );
    }

    if (activeView === 'Settlement') {
      return (
        <section className="space-y-6">
          <PageIntro
            eyebrow="Workspace / Settlement"
            title="Settlement health"
            subtitle="Keep processor batches and merchant payouts in sync."
            action={
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing…' : t.sync}
              </button>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard label="Settled to date" value={formatINR(settledAmount)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} detail="Auto-settled to HDFC Bank ****4012" />
            <InfoCard label="Awaiting settlement" value={formatINR(pendingAmount)} icon={<Clock className="h-4 w-4 text-amber-500" />} detail={`${transactions.filter((item) => item.status === 'Pending').length} records in the next batch`} />
            <InfoCard label="Last processor sync" value={lastSynced} icon={<RefreshCw className="h-4 w-4 text-blue-600" />} detail="Razorpay Smart Router connected" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Settlement timeline</h3>
                <p className="mt-1 text-xs text-slate-500">Recent processor checkpoints for this merchant.</p>
              </div>
              <WalletCards className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                ['Payments captured', 'All recent payment attempts are recorded.', 'Complete'],
                ['Processor scanned', 'Razorpay checked the latest batch.', 'Complete'],
                ['Bank settlement', `${formatINR(pendingAmount)} remains in the next batch.`, pendingAmount ? 'In progress' : 'Complete'],
              ].map(([title, detail, status]) => (
                <div key={title} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${status === 'Complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {status === 'Complete' ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    </span>
                    {title}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
                  <span className="mt-4 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activeView === 'Exceptions') {
      const exceptionTransactions = transactions.filter((item) => item.status !== 'Completed');
      return (
        <section className="space-y-6">
          <PageIntro
            eyebrow="Workspace / Exceptions"
            title="Exceptions queue"
            subtitle="Review payments that need a follow-up before settlement closes."
            action={<span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">{exceptionTransactions.length} need attention</span>}
          />
          {exceptionTransactions.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {exceptionTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{transaction.id} · {transaction.customer}</p>
                      <p className="mt-1 text-xs text-slate-500">{transaction.method} · {transaction.date}</p>
                    </div>
                    <StatusPill status={transaction.status} t={t} />
                  </div>
                  <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{formatINR(transaction.amount)}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {transaction.status === 'Pending'
                      ? 'The processor has not confirmed this payment in a settlement batch yet.'
                      : 'The payment attempt failed before settlement. Create a new link if the customer wants to retry.'}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => navigate('Transactions')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">View transaction</button>
                    <button onClick={() => setToast(`${transaction.id} added to your review notes`)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">Assign for review</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="All clear" detail="There are no pending or failed payments right now." />
          )}
        </section>
      );
    }

    if (activeView === 'Settings') {
      return (
        <section className="space-y-6">
          <PageIntro eyebrow="Workspace / Settings" title="Workspace settings" subtitle="Manage your merchant profile and connected payment operations." />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">VK</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Vikram Kumar</p>
                  <p className="text-xs text-slate-500">Acme Retail India · Owner</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SettingRow label="Work email" value="vikram@acmeretail.in" />
                <SettingRow label="Phone" value="+91 99887 76655" />
                <SettingRow label="Default currency" value="INR · ₹" />
                <SettingRow label="Timezone" value="Asia/Kolkata" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Payment connection</p>
                  <p className="text-xs text-slate-500">Razorpay credentials are securely connected.</p>
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800">
                <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> Razorpay Smart Router Active</div>
                <p className="mt-2 leading-5 text-emerald-700">Payment links and settlement sync are ready for this workspace.</p>
              </div>
              <button onClick={onLogout} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="space-y-6">
        <PageIntro
          eyebrow="Control room"
          title="Merchant reconciliation"
          subtitle={t.subtitle}
          action={
            <div className="flex items-center gap-2">
              <button onClick={handleSync} disabled={isSyncing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing…' : t.sync}
              </button>
              <button onClick={() => { setCreatedPaymentLink(''); setFormError(''); setIsLinkModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                {t.createLink}
              </button>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label={t.grossVolume} value={formatINR(transactions.reduce((total, item) => total + item.amount, 0))} icon={<BarChart3 className="h-4 w-4 text-blue-600" />} detail="+12.4% vs last week" detailClass="text-emerald-600" />
          <MetricCard label={t.settledAmount} value={formatINR(settledAmount)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} detail="Auto-settled to HDFC Bank ****4012" />
          <MetricCard label={t.unmatched} value={formatINR(pendingAmount)} icon={<Clock className="h-4 w-4 text-amber-500" />} detail={`${transactions.filter((item) => item.status === 'Pending').length} transactions require review`} detailClass="text-amber-600" />
          <MetricCard label={t.successRate} value="98.7%" icon={<ArrowUpRight className="h-4 w-4 text-blue-600" />} detail="Razorpay Smart Router Active" detailClass="text-emerald-600" />
        </div>
        <TransactionTable
          transactions={filteredTransactions.slice(0, 5)}
          total={transactions.length}
          t={t}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          onExport={handleExport}
          onDetails={(transaction) =>
            setToast(
              transaction.paymentLink
                ? `Payment link: ${transaction.paymentLink}`
                : `${transaction.id} · ${transaction.status}`,
            )
          }
        />
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <button onClick={() => navigate('Overview')} className="flex items-center gap-3 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"><CreditCard className="h-5 w-5" /></div>
            <div>
              <p className="text-base font-semibold leading-none tracking-tight text-slate-900">ReconcilePro</p>
              <span className="text-xs font-medium text-slate-500">Merchant Terminal</span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition">
              <Globe className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              <select value={lang} onChange={(event) => setLang(event.target.value as Language)} className="cursor-pointer bg-transparent pr-1 focus:outline-none" aria-label="Language">
                <option value="en">English (US)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>
            <button className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Notifications" onClick={() => setToast('No new notifications')}><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" /></button>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">VK</div><div><p className="text-xs font-semibold leading-none text-slate-800">Vikram Kumar</p><p className="text-[10px] text-slate-500">Acme Retail India</p></div></div>
          </div>
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-slate-100 pt-3 lg:order-none lg:w-auto lg:border-0 lg:pt-0" aria-label="Primary navigation">
            {navItems.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => navigate(label)} aria-current={activeView === label ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeView === label ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{renderView()}</main>

      {toast && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{toast}</div>}

      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 transition hover:scale-105 hover:bg-blue-700" aria-label="Open AI Help Assistant">
        <Bot className="h-6 w-6" />
      </button>

      {isChatOpen && <ChatDrawer messages={chatMessages} input={chatInput} onInput={setChatInput} onClose={() => setIsChatOpen(false)} onSend={handleSendChat} />}

      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">Razorpay</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Create payment link</h2><p className="mt-1 text-xs text-slate-500">Generate a link and add the new order to your ledger.</p></div>
              <button onClick={() => setIsLinkModalOpen(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close modal"><X className="h-4 w-4" /></button>
            </div>
            {createdPaymentLink ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Payment link created</div>
                <p className="mt-2 break-all rounded-lg bg-white p-3 text-xs text-slate-600">{createdPaymentLink}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { navigator.clipboard?.writeText(createdPaymentLink); setToast('Payment link copied'); }} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Copy link</button>
                  <button onClick={() => setIsLinkModalOpen(false)} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">Done</button>
                </div>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleCreatePaymentLink}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Customer Name" value={linkForm.customerName} onChange={(value) => setLinkForm((current) => ({ ...current, customerName: value }))} placeholder="Ananya Sharma" />
                  <FormField label="Phone" value={linkForm.phone} onChange={(value) => setLinkForm((current) => ({ ...current, phone: value }))} placeholder="+91 98765 43210" />
                </div>
                <FormField label="Item" value={linkForm.item} onChange={(value) => setLinkForm((current) => ({ ...current, item: value }))} placeholder="Annual subscription" />
                <FormField label="Amount (INR)" value={linkForm.amount} onChange={(value) => setLinkForm((current) => ({ ...current, amount: value }))} placeholder="2499" type="number" min="1" />
                {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{formError}</p>}
                <button disabled={isCreatingLink} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60" type="submit">
                  {isCreatingLink && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreatingLink ? 'Creating link…' : 'Generate Razorpay link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PageIntro({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-blue-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>{action}</div>;
}

function MetricCard({ label, value, detail, detailClass = 'text-slate-500', icon }: { label: string; value: string; detail: string; detailClass?: string; icon: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-medium">{label}</span>{icon}</div><p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p><span className={`mt-2 inline-block text-[11px] font-medium ${detailClass}`}>{detail}</span></div>;
}

function InfoCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-medium">{label}</span>{icon}</div><p className="mt-3 text-xl font-bold tracking-tight text-slate-900">{value}</p><span className="mt-2 inline-block text-[11px] text-slate-500">{detail}</span></div>;
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xs font-medium text-slate-700">{value}</p></div>;
}

function FormField({ label, value, onChange, placeholder, type = 'text', min }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; min?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span><input required type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" /></label>;
}

function StatusPill({ status, t }: { status: TransactionStatus; t: (typeof translations)['en'] }) {
  const config = {
    Completed: { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: <CheckCircle2 className="h-3 w-3" />, label: t.completed },
    Pending: { classes: 'bg-amber-50 text-amber-700 border-amber-200/60', icon: <Clock className="h-3 w-3" />, label: t.pending },
    Failed: { classes: 'bg-rose-50 text-rose-700 border-rose-200/60', icon: <XCircle className="h-3 w-3" />, label: t.failed },
  }[status];
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${config.classes}`}>{config.icon}{config.label}</span>;
}

function TransactionTable({ transactions, total, t, searchQuery, onSearch, statusFilter, onStatusFilter, onExport, onDetails }: { transactions: Transaction[]; total: number; t: (typeof translations)['en']; searchQuery: string; onSearch: (value: string) => void; statusFilter: string; onStatusFilter: (value: string) => void; onExport: () => void; onDetails: (transaction: Transaction) => void }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input type="search" value={searchQuery} onChange={(event) => onSearch(event.target.value)} placeholder={t.searchPlaceholder} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white" aria-label="Search transactions" /></div><div className="flex items-center gap-2"><div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"><Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" /><select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)} className="cursor-pointer bg-transparent focus:outline-none" aria-label="Filter status"><option value="All">{t.allStatuses}</option><option value="Completed">{t.completed}</option><option value="Pending">{t.pending}</option><option value="Failed">{t.failed}</option></select></div><button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Download className="h-3.5 w-3.5 text-slate-500" />{t.export}</button></div></div><div className="border-b border-slate-100 px-6 py-3 text-[11px] text-slate-500">{transactions.length} of {total} transactions</div>{transactions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs text-slate-600"><thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3">{t.orderId}</th><th className="px-6 py-3">{t.customer}</th><th className="px-6 py-3">Method</th><th className="px-6 py-3">{t.amount}</th><th className="px-6 py-3">{t.status}</th><th className="px-6 py-3 text-right">{t.action}</th></tr></thead><tbody className="divide-y divide-slate-100">{transactions.map((transaction) => <tr key={transaction.id} className="transition hover:bg-slate-50/80"><td className="px-6 py-4 font-semibold text-slate-900">{transaction.id}<p className="mt-1 text-[10px] font-normal text-slate-400">{transaction.date}</p></td><td className="px-6 py-4"><p className="font-medium text-slate-800">{transaction.customer}</p><p className="text-[10px] text-slate-400">{transaction.phone}</p></td><td className="px-6 py-4 text-slate-500">{transaction.method}</td><td className="px-6 py-4 font-semibold text-slate-900">{formatINR(transaction.amount)}</td><td className="px-6 py-4"><StatusPill status={transaction.status} t={t} /></td><td className="px-6 py-4 text-right"><button onClick={() => onDetails(transaction)} className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:text-blue-800">Details <ExternalLink className="h-3 w-3" /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={<Search className="h-6 w-6" />} title="No transactions found" detail="Try a different search or status filter." />}</div>;
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-400">{icon}<p className="mt-3 text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function ChatDrawer({ messages, input, onInput, onClose, onSend }: { messages: ChatMessage[]; input: string; onInput: (value: string) => void; onClose: () => void; onSend: (event?: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed bottom-24 right-6 z-50 flex h-[min(600px,calc(100vh-8rem))] w-[min(390px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600"><Bot className="h-5 w-5" /></div><div><p className="text-sm font-semibold">AI Help Assistant</p><p className="text-[10px] text-slate-300">Instant merchant support</p></div></div><button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close assistant"><X className="h-4 w-4" /></button></div><div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">{messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-3.5 py-3 text-xs leading-5 ${message.role === 'user' ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>{message.text}</div></div>)}</div><div className="border-t border-slate-200 bg-white p-3"><form className="flex items-center gap-2" onSubmit={onSend}><input value={input} onChange={(event) => onInput(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-blue-500 focus:bg-white" placeholder="Ask about a payment…" aria-label="Ask AI Help Assistant" /><button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700" aria-label="Send question" type="submit"><Send className="h-4 w-4" /></button></form><p className="mt-2 text-center text-[10px] text-slate-400">Try: “Why is order ORD-9480 pending?”</p></div></div>;
}