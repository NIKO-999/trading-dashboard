/* ============================================================
   Account, balance and the capital ledger.

   Balance is not just starting + results — capital gets added out of income, so
   every deposit and withdrawal is a dated row. Planned risk is derived from the
   balance on the day, which is why the ledger has to carry dates rather than
   just a running total.
   ============================================================ */

import { useMemo, useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import {
  activeAccount,
  addAdjustment,
  removeAdjustment,
  setActiveAccount,
  upsertAccount,
  useStore,
} from '../store/useStore';
import { balanceOn, plannedRisk } from '../utils/discipline';
import { fmtMoney } from '../utils/analytics';
import type { Account } from '../types';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AccountPanel() {
  const { entries, discipline } = useStore();
  const account = activeAccount();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [kind, setKind] = useState<'deposit' | 'withdrawal' | 'correction'>('deposit');

  const balance = useMemo(
    () => (account ? balanceOn(account, discipline.adjustments, entries, today()) : 0),
    [account, discipline.adjustments, entries],
  );

  if (!account) {
    return (
      <div style={{ fontSize: 11.5, color: 'var(--txt-faint)' }}>
        Setting up your account…
      </div>
    );
  }

  const planned = plannedRisk(balance, account.riskPercent);
  const ledger = discipline.adjustments
    .filter((a) => a.accountId === account.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  function patch(next: Partial<Account>) {
    upsertAccount({ ...account!, ...next });
  }

  function submit() {
    const value = Number(amount);
    if (!amount.trim() || Number.isNaN(value) || value === 0) return;
    addAdjustment({
      accountId: account!.id,
      date,
      // Withdrawals are stored signed so the balance maths stays a plain sum.
      amount: kind === 'withdrawal' ? -Math.abs(value) : value,
      kind,
    });
    setAmount('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ---------- account ---------- */}
      {discipline.accounts.length > 1 && (
        <div className="mc-seg" style={{ alignSelf: 'flex-start' }}>
          {discipline.accounts.map((a) => (
            <button
              key={a.id}
              className={`mc-seg-btn ${a.id === account.id ? 'active' : ''}`}
              onClick={() => setActiveAccount(a.id)}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      <div className="mc-trade-pill-row">
        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>NAME</span>
          <input
            style={{ width: 90 }}
            value={account.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>STARTING $</span>
          <input
            type="number"
            inputMode="decimal"
            style={{ width: 92 }}
            value={account.startingBalance || ''}
            placeholder="0"
            onChange={(e) => patch({ startingBalance: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>RISK %</span>
          <input
            type="number"
            inputMode="decimal"
            style={{ width: 52 }}
            value={account.riskPercent}
            onChange={(e) => patch({ riskPercent: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="mc-daycard-metric">
          <div className="mc-daycard-metric-label">Balance</div>
          <div className="mc-daycard-metric-value">{fmtMoney(balance, false)}</div>
        </div>
        <div className="mc-daycard-metric">
          <div className="mc-daycard-metric-label">{account.riskPercent}% — risk per trade</div>
          <div className="mc-daycard-metric-value">{fmtMoney(planned, false)}</div>
        </div>
      </div>

      {/* ---------- ledger ---------- */}
      <div>
        <div className="mc-section-title" style={{ marginBottom: 10 }}>
          <Wallet size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
          Capital in and out
        </div>

        <div className="mc-trade-pill-row" style={{ marginBottom: 10 }}>
          <label className="mc-trade-pill">
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="correction">Correction</option>
            </select>
          </label>
          <label className="mc-trade-pill">
            <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>$</span>
            <input
              type="number"
              inputMode="decimal"
              style={{ width: 84 }}
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </label>
          <label className="mc-trade-pill">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button className="mc-btn sm" onClick={submit} disabled={!amount.trim()}>
            <Plus size={13} /> Add
          </button>
        </div>

        {ledger.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'var(--txt-faint)' }}>
            Nothing logged yet. Add capital here each week and your risk per trade follows it.
          </div>
        ) : (
          <div style={{ maxHeight: 168, overflowY: 'auto' }}>
            {ledger.map((a) => (
              <div key={a.id} className="mc-stat-row">
                <span className="mc-stat-label">
                  <span style={{ color: 'var(--txt-faint)', fontVariantNumeric: 'tabular-nums' }}>
                    {a.date}
                  </span>
                  {a.kind}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="mc-stat-value"
                    style={{ color: a.amount > 0 ? 'var(--win)' : 'var(--loss)' }}
                  >
                    {fmtMoney(a.amount)}
                  </span>
                  <button
                    className="mc-icon-btn danger"
                    style={{ width: 24, height: 24 }}
                    onClick={() => removeAdjustment(a.id)}
                    aria-label="Remove"
                  >
                    <Trash2 size={11} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
