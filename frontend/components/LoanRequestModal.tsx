"use client";
import { DollarSign, X } from "lucide-react";
import { useState, useEffect } from "react";

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleName: string;
  interestRate: string;
  availableAmount: string;
  onSuccess: () => void;
}

export default function LoanRequestModal({
  isOpen,
  onClose,
  circleName,
  interestRate,
  availableAmount,
  onSuccess,
}: LoanRequestModalProps) {
  const [loanAmount, setLoanAmount] = useState("");
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [paybackDate, setPaybackDate] = useState("");

  // Calculate total and date when loan details change
  useEffect(() => {
    if (loanAmount && selectedMonths) {
      const amount = parseFloat(loanAmount);
      const monthlyRate = parseFloat(interestRate.replace('%', '')) / 100;
      
      if (!isNaN(amount) && !isNaN(monthlyRate)) {
        // Calculate total: amount * (1 + monthlyRate * months)
        const totalInterest = monthlyRate * selectedMonths;
        setCalculatedTotal(amount * (1 + totalInterest));
        
        // Calculate payback date
        const date = new Date();
        date.setMonth(date.getMonth() + selectedMonths);
        setPaybackDate(date.toISOString().split('T')[0]);
      } else {
        setCalculatedTotal(0);
      }
    } else {
      setCalculatedTotal(0);
    }
  }, [loanAmount, selectedMonths, interestRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess();
    setLoanAmount("");
    setSelectedMonths(1);
    setCalculatedTotal(0);
    setPaybackDate("");
  };

  const handleClose = () => {
    setLoanAmount("");
    setSelectedMonths(1);
    setCalculatedTotal(0);
    setPaybackDate("");
    onClose();
  };

  const availableAmountNumber = (() => {
    const num = parseFloat(availableAmount.replace(' HBAR', '').replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  })();

  // Seed the input with available amount when modal opens or available amount changes
  useEffect(() => {
    setLoanAmount(availableAmountNumber > 0 ? String(availableAmountNumber) : "");
  }, [availableAmountNumber]);

  if (!isOpen) return null;
  
  const periods = [1, 2, 3];

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative z-10">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-primary-slate hover:text-primary-dark transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-primary-dark mb-2">Request a Loan</h2>
        <p className="text-primary-slate mb-6">Borrow from <strong>{circleName}</strong> at {interestRate} interest rate</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary-dark mb-2">
              Loan Amount (HBAR)
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => {
                const raw = e.target.value;
                const val = Number(raw);
                if (Number.isNaN(val)) {
                  setLoanAmount("");
                  return;
                }
                if (val < 1) {
                  setLoanAmount("1");
                  return;
                }
                if (val > availableAmountNumber) {
                  setLoanAmount(String(availableAmountNumber));
                  return;
                }
                setLoanAmount(raw);
              }}
              placeholder="e.g., 500"
              min={1}
              max={availableAmountNumber}
              className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              required
            />
            <p className="text-xs text-primary-slate mt-1">
              Available: {availableAmount} • Max you can request: {availableAmountNumber} HBAR
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-dark mb-2">
              Repayment Period
            </label>
            <div className="grid grid-cols-3 gap-3">
              {periods.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedMonths(period)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    selectedMonths === period
                      ? 'bg-primary-blue/80 text-white '
                      : 'border border-primary-blue text-primary-blue hover:bg-primary-gray'
                  }`}
                >
                  {period} Month{period > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            {paybackDate && (
              <div className="mt-3 bg-primary-light rounded-lg px-4 py-3">
                <p className="text-xs text-primary-slate mb-1">Due Date:</p>
                <p className="font-semibold text-primary-dark">
                  {new Date(paybackDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="bg-primary-light rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-primary-slate">Principal:</span>
              <span className="font-semibold text-primary-dark">{loanAmount || "0"} HBAR</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-primary-slate">Interest ({interestRate}/month × {selectedMonths} month{selectedMonths !== 1 ? 's' : ''}):</span>
              <span className="font-semibold text-primary-blue">
                {(calculatedTotal - (parseFloat(loanAmount || "0"))).toFixed(2)} HBAR
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary-dark pt-2 border-t border-primary-lavender">
              <span>Total Due:</span>
              <span>{calculatedTotal.toFixed(2)} HBAR</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !loanAmount ||
                Number(loanAmount) < 1 ||
                Number(loanAmount) > availableAmountNumber
              }
              className={`flex-1 px-4 py-3 rounded-lg transition-all font-semibold ${
                !loanAmount || Number(loanAmount) < 1 || Number(loanAmount) > availableAmountNumber
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-primary-blue text-white hover:bg-opacity-90'
              }`}
            >
              Request Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

