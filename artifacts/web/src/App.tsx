import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  Filter,
  Menu,
  MoreHorizontal,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

type Merchant = { id: string; name: string; initials: string; status: 'Live' | 'Paused'; volume: number };
type TransactionStatus = 'Settled' | 'Pending' | 'Exception';
type Transaction = {
  id: string;
  merchant: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  source: string;
  paymentMethod: string;
  date: string;
  settlementDate: string;
  fee: number;
  net: number;
  reference: string;
  hasException: boolean;
};
type ReconciliationException = {
  id: string;
  transactionId: string;
  type: string;
  severity: 'High' | 'Medium';
  amount: number;
  createdAt: string;
  description: string;
  status: 'Open' | 'Resolved';
  owner: string;
};
type Activity = { id: string; label: string; detail: string; timestamp: string; type: 'success' | 'scan' | 'alert' };

const merchants: Merchant[] = [
  { id: 'northstar', name: 'Northstar Goods', initials: 'NG', status: 'Live', volume: 284120 },
  { id: 'fieldnote', name: 'Fieldnote Market', initials: 'FM', status: 'Live', volume: 118940 },
  { id: 'kinfolk', name: 'Kinfolk Supply Co.', initials: 'KS', status: 'Live', volume: 76480 },
];

const transactions: Transaction[] = [
  { id: 'txn_8F2K91', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 184.2, currency: 'USD', status: 'Settled', source: 'Stripe', paymentMethod: 'Visa •••• 4821', date: 'Jun 18, 2024 · 09:42', settlementDate: 'Jun 19, 2024', fee: 5.63, net: 178.57, reference: 'order_10482', hasException: false },
  { id: 'txn_8F2K77', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 920.0, currency: 'USD', status: 'Exception', source: 'Shopify', paymentMethod: 'Amex •••• 0194', date: 'Jun 18, 2024 · 09:18', settlementDate: '—', fee: 27.6, net: 892.4, reference: 'order_10479', hasException: true },
  { id: 'txn_8F2K48', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 64.9, currency: 'USD', status: 'Settled', source: 'Stripe', paymentMethod: 'Mastercard •••• 2210', date: 'Jun 18, 2024 · 08:57', settlementDate: 'Jun 19, 2024', fee: 2.21, net: 62.69, reference: 'order_10476', hasException: false },
  { id: 'txn_8F2K31', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 2450.0, currency: 'USD', status: 'Pending', source: 'Adyen', paymentMethod: 'Visa •••• 8322', date: 'Jun 17, 2024 · 22:12', settlementDate: 'Jun 20, 2024', fee: 73.5, net: 2376.5, reference: 'order_10465', hasException: false },
  { id: 'txn_8F2J98', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 312.75, currency: 'USD', status: 'Settled', source: 'Stripe', paymentMethod: 'Apple Pay', date: 'Jun 17, 2024 · 19:04', settlementDate: 'Jun 18, 2024', fee: 9.57, net: 303.18, reference: 'order_10442', hasException: false },
  { id: 'txn_8F2J66', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 48.0, currency: 'USD', status: 'Exception', source: 'Shopify', paymentMethod: 'Visa •••• 7612', date: 'Jun 17, 2024 · 16:38', settlementDate: '—', fee: 1.68, net: 46.32, reference: 'order_10431', hasException: true },
  { id: 'txn_8F2J21', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 780.4, currency: 'USD', status: 'Settled', source: 'Stripe', paymentMethod: 'Visa •••• 1940', date: 'Jun 16, 2024 · 14:26', settlementDate: 'Jun 17, 2024', fee: 23.41, net: 756.99, reference: 'order_10398', hasException: false },
  { id: 'txn_8F1Z83', merchant: 'Northstar Goods', merchantId: 'northstar', amount: 129.0, currency: 'USD', status: 'Settled', source: 'Adyen', paymentMethod: 'Google Pay', date: 'Jun 16, 2024 · 11:03', settlementDate: 'Jun 17, 2024', fee: 4.77, net: 124.23, reference: 'order_10367', hasException: false },
  { id: 'txn_6D4L72', merchant: 'Fieldnote Market', merchantId: 'fieldnote', amount: 96.5, currency: 'USD', status: 'Settled', source: 'Stripe', paymentMethod: 'Visa •••• 1192', date: 'Jun 18, 2024 · 10:11', settlementDate: 'Jun 19, 2024', fee: 3.22, net: 93.28, reference: 'order_8891', hasException: false },
  { id: 'txn_6D4L51', merchant: 'Fieldnote Market', merchantId: 'fieldnote', amount: 445.0, currency: 'USD', status: 'Pending', source: 'Shopify', paymentMethod: 'Visa •••• 7701', date: 'Jun 18, 2024 · 09:51', settlementDate: 'Jun 20, 2024', fee: 13.35, net: 431.65, reference: 'order_8878', hasException: false },
  { id: 'txn_2A1Q18', merchant: 'Kinfolk Supply Co.', merchantId: 'kinfolk', amount: 61.2, currency: 'USD', status: 'Settled', source: 'Adyen', paymentMethod: 'Mastercard •••• 2091', date: 'Jun 18, 2024 · 09:02', settlementDate: 'Jun 19, 2024', fee: 2.11, net: 59.09, reference: 'order_4011', hasException: false },
];

const initialExceptions: ReconciliationException[] = [
  { id: 'exc_10479', transactionId: 'txn_8F2K77', type: 'Settlement missing', severity: 'High', amount: 920, createdAt: '18 min ago', description: 'The processor confirmed the payment, but no matching settlement record has arrived for this transaction.', status: 'Open', owner: 'Unassigned' },
  { id: 'exc_10431', transactionId: 'txn_8F2J66', type: 'Amount mismatch', severity: 'Medium', amount: 48, createdAt: '2 hr ago', description: 'The settled amount differs from the expected net amount by $1.20. Review the fee line item before closing.', status: 'Open', owner: 'M. Chen' },
];

const initialActivity: Activity[] = [
  { id: 'a1', label: 'Reconciliation completed', detail: 'Jun 17 batch matched 1,284 payments', timestamp: 'Today, 09:14', type: 'success' },
  { id: 'a2', label: 'Exception created', detail: 'Settlement missing · txn_8F2K77', timestamp: 'Today, 08:56', type: 'alert' },
  { id: 'a3', label: 'Processor scan finished', detail: 'Stripe · 4,012 records checked', timestamp: 'Yesterday, 18:42', type: 'scan' },
];

const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Dashboard() {
  const [merchantId, setMerchantId] = useState('northstar');
  const [range, setRange] = useState('30D');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sourceFilter, setSourceFilter] = useState('All sources');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedException, setSelectedException] = useState<ReconciliationException | null>(null);
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [activity, setActivity] = useState(initialActivity);
  const [reconciling, setReconciling] = useState(false);
  const [toast, setToast] = useState('');

  const merchant = merchants.find((item) => item.id === merchantId) ?? merchants[0];
  const merchantTransactions = useMemo(() => transactions.filter((item) => item.merchantId === merchantId), [merchantId]);
  const filteredTransactions = useMemo(() => merchantTransactions.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.id, item.reference, item.paymentMethod, item.source, item.amount.toString()].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'All statuses' || item.status === statusFilter;
    const matchesSource = sourceFilter === 'All sources' || item.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  }), [merchantTransactions, search, sourceFilter, statusFilter]);
  const openExceptions = exceptions.filter((item) => item.status === 'Open' && merchantTransactions.some((transaction) => transaction.id === item.transactionId));
  const periodLabel = range === '7D' ? 'Jun 12 – Jun 18, 2024' : range === '90D' ? 'Mar 21 – Jun 18, 2024' : 'May 20 – Jun 18, 2024';

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };

  const handleReconcile = () => {
    if (reconciling) return;
    setReconciling(true);
    window.setTimeout(() => {
      setReconciling(false);
      setActivity((current) => [{ id: `a-${Date.now()}`, label: 'Reconciliation completed', detail: `${merchant.name} · ${merchantTransactions.length} payments checked`, timestamp: 'Just now', type: 'success' }, ...current]);
      setToast('Reconciliation finished · ledger is up to date');
    }, 1000);
  };

  const handleExport = () => {
    const rows = [['Transaction ID', 'Merchant', 'Amount', 'Status', 'Source', 'Payment method', 'Date', 'Settlement date', 'Fee', 'Net', 'Reference']];
    filteredTransactions.forEach((item) => rows.push([item.id, item.merchant, item.amount.toFixed(2), item.status, item.source, item.paymentMethod, item.date, item.settlementDate, item.fee.toFixed(2), item.net.toFixed(2), item.reference]));
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${merchant.id}-reconciliation-${range.toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(`${filteredTransactions.length} transactions exported`);
  };

  const resolveException = (exception: ReconciliationException) => {
    setExceptions((current) => current.map((item) => item.id === exception.id ? { ...item, status: 'Resolved' } : item));
    setSelectedException(null);
    setToast(`${exception.id} marked as resolved`);
  };

  return (
    <div className="app-shell">
      {sidebarOpen && <button aria-label="Close navigation" className="mobile-overlay" onClick={() => setSidebarOpen(false)} data-testid="button-close-sidebar" />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="brand" data-testid="text-brand"><div className="brand-mark"><ShieldCheck size={17} /></div><div className="brand-name">ledger<span>line</span></div></div>
          <div className="eyebrow">Workspace</div>
          <nav className="nav-list" aria-label="Primary navigation">
            <button className="nav-item active" onClick={() => scrollTo('overview')} data-testid="button-nav-overview"><BarChart3 /><span>Overview</span></button>
            <button className="nav-item" onClick={() => scrollTo('transactions')} data-testid="button-nav-transactions"><CircleDollarSign /><span>Transactions</span></button>
            <button className="nav-item" onClick={() => scrollTo('exceptions')} data-testid="button-nav-exceptions"><AlertCircle /><span>Exceptions <span style={{ color: 'hsl(7 68% 67%)' }}>({openExceptions.length})</span></span></button>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setToast('Workspace settings are managed by your administrator')} data-testid="button-settings"><Settings2 /><span>Workspace settings</span></button>
          <div className="user-chip"><div className="avatar">MC</div><div className="user-copy"><strong>Marin Chen</strong><span>Finance operations</span></div><MoreHorizontal size={15} /></div>
        </div>
      </aside>

      <main className="main" id="overview">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} data-testid="button-open-sidebar"><Menu size={21} /></button>
            <span className="eyebrow">Merchant reconciliation / Overview</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button className="icon-button" aria-label="Notifications" onClick={() => setToast('No new notifications')} data-testid="button-notifications"><Bell size={16} /></button>
            <button className="icon-button" aria-label="Help" onClick={() => setToast('Reconcile payments, resolve exceptions, and export your ledger')} data-testid="button-help">?</button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">Control room</div>
            <h1>Good morning, Marin.</h1>
            <p>Here’s where money stands across your payment channels.</p>
          </div>
          <div className="heading-actions">
            <label className="merchant-select" data-testid="control-merchant">
              <span className="merchant-mini">{merchant.initials}</span>
              <select value={merchantId} onChange={(event) => setMerchantId(event.target.value)} aria-label="Select merchant">
                {merchants.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <ChevronDown size={13} />
            </label>
            <button className="primary-button" onClick={handleReconcile} disabled={reconciling} data-testid="button-reconcile"><Zap size={14} />{reconciling ? 'Checking ledger…' : 'Reconcile now'}</button>
          </div>
        </section>

        <div className="summary-grid">
          <SummaryCard label="Gross volume" value={money(merchant.id === 'northstar' ? 248294.2 : merchant.volume * .87)} meta={periodLabel} primary icon={<CircleDollarSign size={15} />} />
          <SummaryCard label="Settled" value={money(merchant.id === 'northstar' ? 244812.6 : merchant.volume * .84)} meta={<><ArrowUpRight size={13} /> <span className="positive">2.8%</span> vs prior period</>} icon={<CheckCircle2 size={15} />} />
          <SummaryCard label="Unmatched" value={money(openExceptions.reduce((sum, item) => sum + item.amount, 0))} meta={<><AlertCircle size={13} /> <span className="negative">{openExceptions.length} need attention</span></>} icon={<AlertCircle size={15} />} />
          <SummaryCard label="Success rate" value={merchant.id === 'northstar' ? '98.7%' : '99.1%'} meta={<><ArrowUpRight size={13} /> <span className="positive">0.4%</span> healthier</>} icon={<ActivityIcon size={15} />} progress={merchant.id === 'northstar' ? 98.7 : 99.1} />
        </div>

        <div className="content-grid">
          <section className="panel" id="transactions">
            <div className="panel-header">
              <div><div className="panel-title">Payment ledger</div><div className="panel-subtitle">{filteredTransactions.length} of {merchantTransactions.length} transactions · {periodLabel}</div></div>
              <div style={{ display: 'flex', gap: 3 }}>
                <button className="icon-button" aria-label="Filter transactions" onClick={() => setToast('Use the filters below to narrow the ledger')} data-testid="button-filter-info"><Filter size={15} /></button>
                <button className="icon-button" aria-label="Export CSV" onClick={handleExport} data-testid="button-export"><Download size={15} /></button>
              </div>
            </div>
            <div className="filters">
              <div className="search-wrap"><Search size={15} /><input className="search-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, reference, amount…" aria-label="Search transactions" data-testid="input-search-transactions" /></div>
              <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" data-testid="select-status-filter"><option>All statuses</option><option>Settled</option><option>Pending</option><option>Exception</option></select>
              <select className="filter-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="Filter by source" data-testid="select-source-filter"><option>All sources</option><option>Stripe</option><option>Shopify</option><option>Adyen</option></select>
              <div className="date-tabs" aria-label="Date range">
                {['7D', '30D', '90D'].map((item) => <button className={range === item ? 'active' : ''} onClick={() => setRange(item)} key={item} data-testid={`button-range-${item}`}>{item}</button>)}
              </div>
            </div>
            <div className="table-wrap">
              {filteredTransactions.length > 0 ? <table className="transaction-table"><thead><tr><th>Transaction</th><th>Amount</th><th>Status</th><th>Source</th><th>Captured</th><th>Settled</th><th>Fee</th></tr></thead><tbody>
                {filteredTransactions.map((item) => <tr className="transaction-row" key={item.id} onClick={() => setSelectedTransaction(item)} data-testid={`row-transaction-${item.id}`}>
                  <td><div className="merchant-cell"><div className="merchant-dot">{merchant.initials}</div><div><strong>{item.reference}</strong><small className="transaction-id">{item.id}</small></div></div></td>
                  <td><span className="amount">{money(item.amount)}</span><small style={{ color: 'hsl(var(--muted-foreground))', display: 'block', fontSize: 10, marginTop: 3 }}>{item.paymentMethod}</small></td>
                  <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{item.source}</td><td style={{ color: 'hsl(var(--muted-foreground))' }}>{item.date.split(' · ')[0]}</td><td style={{ color: 'hsl(var(--muted-foreground))' }}>{item.settlementDate}</td><td><span className="fee">{money(item.fee)}</span></td>
                </tr>)}
              </tbody></table> : <div className="empty-state"><Search size={25} /><strong>No transactions match these filters</strong><p>Try a different search term or clear one of the filters.</p><button className="quiet-button" style={{ marginTop: 15 }} onClick={() => { setSearch(''); setStatusFilter('All statuses'); setSourceFilter('All sources'); }} data-testid="button-clear-filters">Clear filters</button></div>}
            </div>
          </section>

          <div className="side-stack">
            <section className="panel" id="exceptions">
              <div className="panel-header"><div><div className="panel-title">Exceptions <span style={{ color: 'hsl(var(--destructive))' }}>{openExceptions.length}</span></div><div className="panel-subtitle">Items that need an owner</div></div><SlidersHorizontal size={15} color="hsl(var(--muted-foreground))" /></div>
              {openExceptions.length > 0 ? <div className="exception-list">{openExceptions.map((item) => <button className="exception-item" key={item.id} onClick={() => setSelectedException(item)} data-testid={`button-exception-${item.id}`}><div className="exception-top"><span className="exception-title">{item.type}</span><span className={`severity ${item.severity.toLowerCase()}`}>{item.severity}</span></div><div className="exception-desc">{item.description}</div><div className="exception-foot"><span>{item.createdAt} · {item.owner}</span><strong>{money(item.amount)}</strong></div></button>)}</div> : <div className="empty-state" style={{ padding: '30px 18px' }}><CheckCircle2 size={25} /><strong>All clear for this merchant</strong><p>New exceptions will appear here after the next processor scan.</p></div>}
            </section>
            <section className="panel">
              <div className="panel-header"><div><div className="panel-title">Recent activity</div><div className="panel-subtitle">A short history of ledger events</div></div><Clock3 size={15} color="hsl(var(--muted-foreground))" /></div>
              <div className="activity-list">{activity.slice(0, 4).map((item) => <div className="activity-item" key={item.id}><div className="activity-icon">{item.type === 'success' ? <Check size={13} /> : item.type === 'alert' ? <AlertCircle size={13} /> : <FileCheck2 size={13} />}</div><div className="activity-copy"><strong>{item.label}</strong><span>{item.detail}</span><time>{item.timestamp}</time></div></div>)}</div>
            </section>
          </div>
        </div>
      </main>

      {toast && <div className="toast-note" role="status" data-testid="status-toast"><CheckCircle2 size={16} color="hsl(var(--sidebar-primary))" />{toast}</div>}
      {selectedTransaction && <TransactionDrawer transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
      {selectedException && <ExceptionDrawer exception={selectedException} transaction={transactions.find((item) => item.id === selectedException.transactionId)} onClose={() => setSelectedException(null)} onResolve={() => resolveException(selectedException)} />}
    </div>
  );
}

function SummaryCard({ label, value, meta, primary = false, icon, progress }: { label: string; value: string; meta: ReactNode; primary?: boolean; icon: ReactNode; progress?: number }) {
  return <div className={`summary-card ${primary ? 'primary' : ''}`} data-testid={`card-summary-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="label"><span>{label}</span>{icon}</div><div className="summary-value">{value}</div><div className="summary-meta">{meta}</div>{progress !== undefined && <div className="mini-bar"><span style={{ width: `${progress}%` }} /></div>}{primary && <div className="mini-bar"><span style={{ width: '92%' }} /></div>}</div>;
}

function DrawerFrame({ children, eyebrow, title, onClose }: { children: ReactNode; eyebrow: string; title: string; onClose: () => void }) {
  return <><button className="overlay" aria-label="Close detail" onClick={onClose} data-testid="button-close-overlay" /><aside className="drawer" role="dialog" aria-modal="true"><div className="drawer-head"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close detail" data-testid="button-close-drawer"><X size={17} /></button></div>{children}</aside></>;
}

function TransactionDrawer({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  return <DrawerFrame eyebrow="Transaction detail" title={transaction.reference} onClose={onClose}><div className="drawer-body"><span className={`status-pill status-${transaction.status.toLowerCase()}`}>{transaction.status}</span><div className="detail-grid"><Detail label="Transaction ID" value={transaction.id} /><Detail label="Gross amount" value={money(transaction.amount)} /><Detail label="Payment method" value={transaction.paymentMethod} /><Detail label="Source" value={transaction.source} /><Detail label="Captured" value={transaction.date} /><Detail label="Settlement date" value={transaction.settlementDate} /><Detail label="Processing fee" value={money(transaction.fee)} /><Detail label="Net amount" value={money(transaction.net)} /></div><div className="detail-section"><div className="eyebrow">Reference</div><p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'hsl(var(--foreground))' }}>{transaction.reference}</p></div>{transaction.hasException && <div className="detail-section"><div className="eyebrow">Reconciliation note</div><p>This transaction has an open exception. Review it from the Exceptions panel to confirm the settlement or assign an owner.</p></div>}</div></DrawerFrame>;
}

function ExceptionDrawer({ exception, transaction, onClose, onResolve }: { exception: ReconciliationException; transaction?: Transaction; onClose: () => void; onResolve: () => void }) {
  return <DrawerFrame eyebrow="Exception review" title={exception.type} onClose={onClose}><div className="drawer-body"><span className={`status-pill ${exception.status === 'Resolved' ? 'status-resolved' : 'status-exception'}`}>{exception.status}</span><div className="detail-section"><div className="eyebrow">What happened</div><p>{exception.description}</p></div><div className="detail-grid"><Detail label="Exception ID" value={exception.id} /><Detail label="Severity" value={exception.severity} /><Detail label="Amount at risk" value={money(exception.amount)} /><Detail label="Owner" value={exception.owner} /><Detail label="Created" value={exception.createdAt} /><Detail label="Transaction" value={transaction?.id ?? exception.transactionId} /></div><div className="drawer-actions"><button className="quiet-button" onClick={onClose} data-testid="button-close-exception">Keep open</button>{exception.status === 'Open' && <button className="primary-button resolve-button" onClick={onResolve} data-testid={`button-resolve-${exception.id}`}><Check size={14} /> Mark resolved</button>}</div></div></DrawerFrame>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-cell"><label>{label}</label><strong>{value}</strong></div>;
}

export default App;