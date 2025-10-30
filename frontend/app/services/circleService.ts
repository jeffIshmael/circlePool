// this file gets all the read fiunction from the blockchain

// Client-facing service wrapper that calls secure API routes

export const getTotalCircles = async () => {
  const res = await fetch(`/api/circles/total`, {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch total circles');
  return json.total as number;
};

// Get user's HBAR balance via Mirror Node REST Balances endpoint
export const getHbarBalance = async (accountId: string) => {
  const res = await fetch(`/api/balances?accountId=${encodeURIComponent(accountId)}`, {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch balance');
  return json as { tinybars: number; hbar: number };
};

// Get all circles, mapping the blockchain id and the loanable amount
export const getCirclesWithLoanableAmount = async () => {
  const res = await fetch(`/api/circles`, {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  const json = await res.json();
  console.log("circles with loanable amount",json);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch circles');
  return json.circles as Array<{ circleId: number; loanableAmount: number }>;
};

// get a
export const getCircleById = async (id: number) => {
  const res = await fetch(`/api/circle/${id}`, {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  const json = await res.json();
  console.log("circle by id",json);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch circle');
  return json as {
    circleId: number;
    payDate: number;
    amount: number;
    startDate: number;
    duration: number;
    round: number;
    cycle: number;
    admin: string;
    members: string[];
    loanableAmount: number;
    interestPercent: number;
    leftPercent: number;
  };
};

// get members onchain with balances
export const getMembersOnchainWithBalances = async (id: number) => {
  const res = await fetch(`/api/circle/${id}/members`, {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  const json = await res.json();
  console.log("members onchain with balances",json);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch members');
  return json as { circleId: number; members: Array<{ address: string; balance: number; loan: number }>; total: number };
};