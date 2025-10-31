"use client";
import { Wallet, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useCircle } from "@/app/hooks/useCircle";
import { getHbarBalance } from "@/app/services/circleService";
import { useHashConnect } from "@/app/hooks/useHashConnect";
import { toast } from "sonner";
import { updateUserPaymentToCircle } from "@/app/lib/prismafunctions";
import { TransactionReceipt, TransactionResponse } from "@hashgraph/sdk";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleName: string;
  circleId: number;
  circleBlockchainId: number;
  requiredAmount?: string; // Expected payment amount in HBAR
  onSuccess: () => void;
}

interface DepositCashResult {
  contractFunctionResult: null | any;
  receipt: TransactionReceipt;
  response: TransactionResponse;
  success: boolean;
  transactionId: string;
}
export default function PaymentModal({
  isOpen,
  onClose,
  circleName,
  circleId,
  circleBlockchainId,
  requiredAmount,
  onSuccess,
}: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { accountId } = useHashConnect();
  const { depositCash, loading } = useCircle();

  const loadBalance = async () => {
    if (!accountId) return;
    setLoadingBalance(true);
    try {
      const balanceData = await getHbarBalance(accountId);
      setUserBalance(balanceData.hbar);
    } catch (error) {
      console.error("Failed to load balance:", error);
      toast.error("Failed to load wallet balance");
    } finally {
      setLoadingBalance(false);
    }
  };

  // Load user balance when modal opens
  useEffect(() => {
    if (isOpen && accountId) {
      loadBalance();
    }
  }, [isOpen, accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const amountInHbar = parseFloat(paymentAmount);
    if (userBalance !== null && amountInHbar > userBalance) {
      toast.error("Insufficient balance");
      return;
    }

    // Convert HBAR to tinybars (1 HBAR = 100,000,000 tinybars)
    const amountInTinybars = BigInt(Math.floor(amountInHbar * 100_000_000));

    setIsProcessing(true);
    try {
      const result = (await depositCash({
        circleId: circleBlockchainId,
        amount: amountInTinybars,
      })) as unknown as DepositCashResult;
      console.log("DepositCash result:", result);
      if (!result.success) {
        toast.error("Unable to make payment. Please try again.");
        return;
      }
      await updateUserPaymentToCircle(
        accountId,
        circleId,
        amountInHbar,
        result?.transactionId?.toString() || "",
        "Payment to circle"
      );
      toast.success(`Payment of ${paymentAmount} HBAR submitted successfully!`);
      setPaymentAmount("");
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(`Payment failed: ${errorMessage}`);
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPaymentAmount("");
    onClose();
  };

  const requiredAmountNumber = requiredAmount
    ? parseFloat(requiredAmount.replace(" HBAR", "").replace(/,/g, ""))
    : null;

  const paymentAmountNumber = paymentAmount ? parseFloat(paymentAmount) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-white/20 backdrop-blur-sm"
        onClick={handleClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative z-10">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-primary-slate hover:text-primary-dark transition-colors"
          disabled={isProcessing}
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-primary-dark mb-2">
          Make Payment
        </h2>
        <p className="text-primary-slate mb-6">
          Deposit HBAR to <strong>{circleName}</strong>
        </p>

        {/* User Balance Display */}
        <div className="bg-primary-light rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-blue" />
              <span className="text-sm font-semibold text-primary-dark">
                Your Balance:
              </span>
            </div>
            {loadingBalance ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-blue" />
            ) : userBalance !== null ? (
              <span className="text-lg font-bold text-primary-dark">
                {userBalance.toFixed(2)} HBAR
              </span>
            ) : (
              <span className="text-sm text-primary-slate">Unable to load</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary-dark mb-2">
              Payment Amount (HBAR)
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => {
                const raw = e.target.value;
                const val = Number(raw);
                if (Number.isNaN(val)) {
                  setPaymentAmount("");
                  return;
                }
                if (val < 0) {
                  setPaymentAmount("0");
                  return;
                }
                if (userBalance !== null && val > userBalance) {
                  setPaymentAmount(String(userBalance));
                  return;
                }
                setPaymentAmount(raw);
              }}
              placeholder={
                requiredAmountNumber
                  ? String(requiredAmountNumber)
                  : "e.g., 100"
              }
              min={0}
              max={userBalance !== null ? userBalance : undefined}
              step="0.01"
              className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              required
              disabled={isProcessing || loadingBalance}
            />
            <div className="mt-2 space-y-1">
              {requiredAmountNumber && (
                <p className="text-xs text-primary-slate">
                  Expected amount: <strong>{requiredAmountNumber} HBAR</strong>
                </p>
              )}
              {userBalance !== null && (
                <p className="text-xs text-primary-slate">
                  Maximum: <strong>{userBalance.toFixed(2)} HBAR</strong>
                </p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          {paymentAmountNumber > 0 && (
            <div className="bg-primary-light rounded-lg p-4">
              <div className="flex justify-between text-lg font-bold text-primary-dark">
                <span>Total Payment:</span>
                <span>{paymentAmountNumber.toFixed(2)} HBAR</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isProcessing ||
                loadingBalance ||
                !paymentAmount ||
                paymentAmountNumber <= 0 ||
                (userBalance !== null && paymentAmountNumber > userBalance) ||
                !accountId
              }
              className={`flex-1 px-4 py-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 ${
                isProcessing ||
                loadingBalance ||
                !paymentAmount ||
                paymentAmountNumber <= 0 ||
                (userBalance !== null && paymentAmountNumber > userBalance) ||
                !accountId
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-primary-blue text-white hover:bg-opacity-90"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Make Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
