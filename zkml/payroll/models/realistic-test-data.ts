/**
 * Realistic Test Data Generator for ZKML Income Proofs
 *
 * Generates realistic 15-month payroll histories for different employee profiles:
 * - Junior Developer: $4,500-5,500/month with occasional bonuses
 * - Mid-Level Engineer: $7,000-8,500/month with quarterly bonuses
 * - Senior Engineer: $12,000-15,000/month with significant bonuses
 * - Freelancer: Highly variable income $3,000-10,000/month
 */

export interface PaymentHistory {
  employeeId: string;
  employeeName: string;
  employeeLevel: string;
  payments: PaymentRecord[];
  stats: PaymentStats;
}

export interface PaymentRecord {
  month: string;
  timestamp: number;
  amount: number;
  type: 'salary' | 'bonus' | 'commission';
  txid: string;
}

export interface PaymentStats {
  average: number;
  min: number;
  max: number;
  stdDev: number;
  totalMonths: number;
  totalPaid: number;
}

/**
 * Generate realistic payment history for a junior developer
 * Base salary: $4,500-5,500/month
 * Occasional bonuses: $500-1,000
 */
export function generateJuniorDevHistory(): PaymentHistory {
  const baseSalary = 5000;
  const variance = 500;
  const payments: PaymentRecord[] = [];

  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 15; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Monthly salary with small variations
    const salaryVariation = (Math.random() - 0.5) * variance;
    const monthlySalary = baseSalary + salaryVariation;

    payments.push({
      month: date.toISOString().substring(0, 7),
      timestamp: Math.floor(date.getTime() / 1000),
      amount: Math.round(monthlySalary),
      type: 'salary',
      txid: `0xJUNIOR_TX_${i + 1}_${date.getFullYear()}_${String(date.getMonth() + 1).padEnd(2, '0')}`
    });

    // Quarterly bonuses (every 3 months)
    if (i > 0 && (i + 1) % 3 === 0) {
      const bonus = 500 + Math.random() * 500;
      payments.push({
        month: date.toISOString().substring(0, 7),
        timestamp: Math.floor(date.getTime() / 1000) + 86400, // Next day
        amount: Math.round(bonus),
        type: 'bonus',
        txid: `0xJUNIOR_BONUS_${i + 1}_${date.getFullYear()}_${String(date.getMonth() + 1).padEnd(2, '0')}`
      });
    }
  }

  return {
    employeeId: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    employeeName: 'Alice Chen (Junior Dev)',
    employeeLevel: 'Junior',
    payments,
    stats: calculateStats(payments)
  };
}

/**
 * Generate realistic payment history for a mid-level engineer
 * Base salary: $7,000-8,500/month
 * Quarterly bonuses: $1,500-2,500
 * Annual raise after 12 months
 */
export function generateMidLevelHistory(): PaymentHistory {
  const baseSalary = 7500;
  const variance = 750;
  const payments: PaymentRecord[] = [];

  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 15; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Annual raise of 8% after 12 months
    const raiseMultiplier = i >= 12 ? 1.08 : 1.0;
    const salaryVariation = (Math.random() - 0.5) * variance;
    const monthlySalary = (baseSalary + salaryVariation) * raiseMultiplier;

    payments.push({
      month: date.toISOString().substring(0, 7),
      timestamp: Math.floor(date.getTime() / 1000),
      amount: Math.round(monthlySalary),
      type: 'salary',
      txid: `0xMID_TX_${i + 1}_${date.getFullYear()}_${String(date.getMonth() + 1).padEnd(2, '0')}`
    });

    // Quarterly bonuses (larger than junior)
    if (i > 0 && (i + 1) % 3 === 0) {
      const bonus = 1500 + Math.random() * 1000;
      payments.push({
        month: date.toISOString().substring(0, 7),
        timestamp: Math.floor(date.getTime() / 1000) + 86400,
        amount: Math.round(bonus),
        type: 'bonus',
        txid: `0xMID_BONUS_${i + 1}_${date.getFullYear()}_${String(date.getMonth() + 1).padEnd(2, '0')}`
      });
    }
  }

  return {
    employeeId: '0x8a95e...c7d2f',
    employeeName: 'Bob Martinez (Mid-Level)',
    employeeLevel: 'Mid-Level',
    payments,
    stats: calculateStats(payments)
  };
}

/**
 * Generate realistic payment history for a senior engineer
 * Base salary: $12,000-15,000/month
 * Quarterly bonuses: $3,000-5,000
 * Annual stock vesting: $10,000
 */
export function generateSeniorHistory(): PaymentHistory {
  const baseSalary = 13500;
  const variance = 1500;
  const payments: PaymentRecord[] = [];

  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 15; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Small annual raise of 5%
    const raiseMultiplier = i >= 12 ? 1.05 : 1.0;
    const salaryVariation = (Math.random() - 0.5) * variance;
    const monthlySalary = (baseSalary + salaryVariation) * raiseMultiplier;

    payments.push({
      month: date.toISOString().substring(0, 7),
      timestamp: Math.floor(date.getTime() / 1000),
      amount: Math.round(monthlySalary),
      type: 'salary',
      txid: `0xSENIOR_TX_${i + 1}_${date.getFullYear()}_${String(date.getMonth() + 1).padEnd(2, '0')}`
    });

    // Quarterly performance bonuses
    if (i > 0 && (i + 1) % 3 === 0) {
      const bonus = 3000 + Math.random() * 2000;
      payments.push({
        month: date.toISOString().substring(0, 7),
        timestamp: Math.floor(date.getTime() / 1000) + 86400,
        amount: Math.round(bonus),
        type: 'bonus',
        txid: `0xSENIOR_BONUS_${i + 1}_${date.getFullYear()}_${String(date.getMonth() + 1).padEnd(2, '0')}`
      });
    }

    // Annual stock vesting (month 12)
    if (i === 11) {
      payments.push({
        month: date.toISOString().substring(0, 7),
        timestamp: Math.floor(date.getTime() / 1000) + 172800,
        amount: 10000,
        type: 'bonus',
        txid: `0xSENIOR_STOCK_${date.getFullYear()}`
      });
    }
  }

  return {
    employeeId: '0x4f9e2...a1b3c',
    employeeName: 'Carol Zhang (Senior)',
    employeeLevel: 'Senior',
    payments,
    stats: calculateStats(payments)
  };
}

/**
 * Generate realistic payment history for a freelancer
 * Highly variable income: $3,000-10,000/month
 * Irregular payment schedules
 */
export function generateFreelancerHistory(): PaymentHistory {
  const payments: PaymentRecord[] = [];
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 15; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Highly variable freelance income
    const baseAmount = 5000;
    const variability = 4000;
    const randomVariation = (Math.random() - 0.5) * 2 * variability;
    const monthlyIncome = Math.max(2000, baseAmount + randomVariation);

    // Some months have multiple smaller payments
    const numPayments = Math.random() > 0.6 ? 2 : 1;

    for (let p = 0; p < numPayments; p++) {
      const paymentAmount = numPayments === 2 ? monthlyIncome / 2 : monthlyIncome;

      payments.push({
        month: date.toISOString().substring(0, 7),
        timestamp: Math.floor(date.getTime() / 1000) + (p * 86400 * 15),
        amount: Math.round(paymentAmount),
        type: p === 0 ? 'salary' : 'commission',
        txid: `0xFREE_TX_${i + 1}_${p + 1}_${date.getFullYear()}_${String(date.getMonth() + 1).padEnd(2, '0')}`
      });
    }
  }

  return {
    employeeId: '0x6c1d8...e4f5a',
    employeeName: 'David Kim (Freelancer)',
    employeeLevel: 'Freelancer',
    payments,
    stats: calculateStats(payments)
  };
}

/**
 * Calculate statistical metrics for payment history
 */
function calculateStats(payments: PaymentRecord[]): PaymentStats {
  const salaryPayments = payments.filter(p => p.type === 'salary');
  const amounts = salaryPayments.map(p => p.amount);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);

  // Calculate standard deviation
  const squaredDiffs = amounts.map(a => Math.pow(a - average, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  return {
    average: Math.round(average),
    min,
    max,
    stdDev: Math.round(stdDev),
    totalMonths: salaryPayments.length,
    totalPaid: Math.round(totalPaid)
  };
}

/**
 * Get all employee profiles for testing
 */
export function getAllEmployeeProfiles(): PaymentHistory[] {
  return [
    generateJuniorDevHistory(),
    generateMidLevelHistory(),
    generateSeniorHistory(),
    generateFreelancerHistory()
  ];
}

/**
 * Print summary statistics for all profiles
 */
export function printAllProfiles(): void {
  const profiles = getAllEmployeeProfiles();

  console.log('\n='.repeat(80));
  console.log('REALISTIC PAYROLL TEST DATA - 15 MONTHS');
  console.log('='.repeat(80));

  profiles.forEach(profile => {
    console.log(`\n${profile.employeeName} (${profile.employeeLevel})`);
    console.log(`  Employee ID: ${profile.employeeId}`);
    console.log(`  Total Payments: ${profile.payments.length}`);
    console.log(`  Total Paid: $${profile.stats.totalPaid.toLocaleString()}`);
    console.log(`  Monthly Average: $${profile.stats.average.toLocaleString()}`);
    console.log(`  Range: $${profile.stats.min.toLocaleString()} - $${profile.stats.max.toLocaleString()}`);
    console.log(`  Std Deviation: $${profile.stats.stdDev.toLocaleString()}`);
    console.log(`  Sample Months: ${profile.payments.slice(0, 3).map(p => `${p.month} ($${p.amount})`).join(', ')}...`);
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

// Run if executed directly
if (require.main === module) {
  printAllProfiles();
}
