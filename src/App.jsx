import { useState, useEffect, useMemo } from 'react'

const STORAGE_KEY = 'creditcycle_card'

const defaultCard = {
  nickname: '',
  limit: '',
  dueDate: '',
  statementDate: '',
  currentBalance: '',
  utilTarget: 30,
}

function App() {
  const [card, setCard] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultCard
  })
  const [submitted, setSubmitted] = useState(false)

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(card))
  }, [card])

  const handleChange = (e) => {
    const { name, value } = e.target
    setCard(prev => ({ ...prev, [name]: value }))
  }

  const handleSlider = (e) => {
    setCard(prev => ({ ...prev, utilTarget: parseInt(e.target.value) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleReset = () => {
    setCard(defaultCard)
    setSubmitted(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Calculations
  const calculations = useMemo(() => {
    const limit = parseFloat(card.limit) || 0
    const balance = parseFloat(card.currentBalance) || 0
    const targetPct = card.utilTarget / 100

    const currentUtil = limit > 0 ? (balance / limit) * 100 : 0
    const targetBalance = limit * targetPct
    const requiredPayment = Math.max(0, balance - targetBalance)

    return {
      currentUtil: currentUtil.toFixed(1),
      targetBalance: targetBalance.toFixed(2),
      requiredPayment: requiredPayment.toFixed(2),
      isOverTarget: currentUtil > card.utilTarget,
      limit,
      balance,
    }
  }, [card])

// Simplified day strip with real-time context
const dayStrip = useMemo(() => {
  const days = [];
  const statementDay = parseInt(card.statementDate) || 0;
  const dueDay = parseInt(card.dueDate) || 0;
  const today = new Date().getDate(); // Get current day of month
  
  for (let d = 1; d <= 31; d++) {
    let status = 'safe';
    let isToday = d === today;
    
    // Action window: 3 days before statement → statement date
    const actionStart = Math.max(1, statementDay - 3); // Prevent negative dates
    const actionEnd = statementDay;
    
    if (statementDay && d >= actionStart && d <= actionEnd) {
      status = 'action';
    }
    
    // Critical: today is in action window AND utilization is over target
    if (isToday && status === 'action' && calculations.isOverTarget) {
      status = 'critical';
    }

    let label = '';
    if (d === statementDay) label = 'Stmt';
    else if (d === dueDay) label = 'Due';
    else if (isToday) label = 'Today';

    days.push({ 
      day: d, 
      status, 
      isToday,
      isActionWindow: status === 'action',
      label,
    });
  }
  return days;
}, [card.statementDate, card.dueDate, calculations.isOverTarget]);

  const getStatusColor = (dayInfo) => {
  const { status, isToday } = dayInfo;
  
  let baseClasses = 'flex flex-col items-center justify-center rounded-lg h-10 w-8 transition-all duration-200';
  let textClasses = 'text-[10px] font-medium';
  let dayNumberClasses = 'font-medium text-sm';
  
  switch (status) {
    case 'critical':
      return `${baseClasses} bg-rose-500/95 text-white border-2 border-rose-400 ${isToday ? 'ring-2 ring-rose-300 scale-105' : ''}`;
    case 'action':
      return `${baseClasses} bg-amber-500/90 text-slate-900 ${isToday ? 'border-2 border-amber-400 ring-2 ring-amber-300 scale-105' : ''}`;
    default:
      return `${baseClasses} ${isToday ? 'bg-slate-300 text-slate-900 border-2 border-cash-400 ring-2 ring-cash-300 scale-105 font-bold' : 'bg-slate-800/40 text-slate-400'}`;
  }
  
  // Return value format: baseClasses + textClasses + dayNumberClasses
  return { baseClasses, textClasses, dayNumberClasses };
};

  const isFormValid = card.nickname && card.limit && card.dueDate && card.statementDate && card.currentBalance

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-cash-400 animate-pulse-soft" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Credit Optimizer</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Credit<span className="text-gradient">Cycle</span>
          </h1>
          <p className="text-slate-400 mt-3 text-sm max-w-md mx-auto">
            Optimize your credit utilization. Know exactly when and how much to pay.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="stat-card mb-8 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nickname */}
            <div className="md:col-span-2">
              <label className="label-text">Card Nickname</label>
              <input
                type="text"
                name="nickname"
                value={card.nickname}
                onChange={handleChange}
                placeholder="e.g., Chase Sapphire"
                className="input-field"
              />
            </div>

            {/* Credit Limit */}
            <div>
              <label className="label-text">Credit Limit</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  name="limit"
                  value={card.limit}
                  onChange={handleChange}
                  placeholder="10,000"
                  className="input-field pl-8"
                  min="0"
                  step="any"
                />
              </div>
            </div>

            {/* Current Balance */}
            <div>
              <label className="label-text">Current Balance</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  name="currentBalance"
                  value={card.currentBalance}
                  onChange={handleChange}
                  placeholder="2,500"
                  className="input-field pl-8"
                  min="0"
                  step="any"
                />
              </div>
            </div>

            {/* Statement Date */}
            <div>
              <label className="label-text">Statement Date (Day)</label>
              <input
                type="number"
                name="statementDate"
                value={card.statementDate}
                onChange={handleChange}
                placeholder="15"
                className="input-field"
                min="1"
                max="31"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="label-text">Due Date (Day)</label>
              <input
                type="number"
                name="dueDate"
                value={card.dueDate}
                onChange={handleChange}
                placeholder="5"
                className="input-field"
                min="1"
                max="31"
              />
            </div>

            {/* Utilization Target */}
            <div className="md:col-span-2">
              <label className="label-text">
                Target Utilization: <span className="text-cash-400 font-mono">{card.utilTarget}%</span>
              </label>
              <input
                type="range"
                name="utilTarget"
                value={card.utilTarget}
                onChange={handleSlider}
                min="1"
                max="100"
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                <span>1%</span>
                <span className="text-cash-500">30% optimal</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 py-3.5 px-6 bg-cash-600 hover:bg-cash-500 disabled:bg-slate-700 
                         disabled:text-slate-500 text-white font-semibold rounded-xl 
                         transition-all duration-200 disabled:cursor-not-allowed"
            >
              Calculate
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 
                         font-medium rounded-xl transition-all duration-200"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Results */}
        {submitted && isFormValid && (
          <div className="space-y-6 animate-slide-up">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{card.nickname || 'Your Card'}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-mono ${
                calculations.isOverTarget 
                  ? 'bg-rose-500/20 text-rose-400' 
                  : 'bg-cash-500/20 text-cash-400'
              }`}>
                {calculations.isOverTarget ? 'Over Target' : 'On Track'}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="stat-card">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Current Util</div>
                <div className={`text-2xl font-mono font-bold ${
                  calculations.isOverTarget ? 'text-rose-400' : 'text-cash-400'
                }`}>
                  {calculations.currentUtil}%
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Target Util</div>
                <div className="text-2xl font-mono font-bold text-slate-200">
                  {card.utilTarget}%
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Target Bal</div>
                <div className="text-2xl font-mono font-bold text-slate-200">
                  ${Number(calculations.targetBalance).toLocaleString()}
                </div>
              </div>
              <div className="stat-card glow-green">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Pay This</div>
                <div className="text-2xl font-mono font-bold text-cash-400">
                  ${Number(calculations.requiredPayment).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Day Strip */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300">Monthly Cycle</h3>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-cash-600"></span>
                    <span className="text-slate-400">Optimal Pay</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                    <span className="text-slate-400">Statement</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                    <span className="text-slate-400">Due</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dayStrip.map(({ day, status, label, isToday }) => (
                  <div 
                    key={day} 
                    className={`day-cell ${getStatusColor({ status, isToday })}`}
                    title={label || `Day ${day}`}
                  >
                    <span className="text-[10px] opacity-60">{label || ''}</span>
                    <span>{day}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                💡 <span className="text-slate-400">Pro tip:</span> Pay down to your target balance 
                <span className="text-cash-400 font-medium"> 2-3 days before</span> your statement date 
                for the best credit score impact.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-slate-600">
          <p>Data stored locally in your browser</p>
        </footer>
      </div>
    </div>
  )
}

export default App
