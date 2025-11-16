import { jsPDF } from 'jspdf';

interface IncomeProof {
  employee_id: Uint8Array;
  proof_type: bigint;
  threshold_min: bigint;
  threshold_max: bigint;
  txids: Uint8Array[];
  history_commitment: Uint8Array;
  attestation_hash: Uint8Array;
  verifier_pubkey: Uint8Array;
  submitted_at: bigint;
  expires_at: bigint;
}

const PROOF_TYPE_NAMES: Record<number, string> = {
  1: 'Income Above Threshold',
  2: 'Income Range',
  3: 'Average Income',
  4: 'First-Time Loan Eligibility',
  5: 'Tax Bracket Verification',
};

const PROOF_TYPE_DESCRIPTIONS: Record<number, string> = {
  1: 'Proves minimum monthly income meets threshold',
  2: 'Proves monthly income falls within specified range',
  3: 'Proves average income over 6 months meets minimum',
  4: 'Proves income consistency for loan eligibility',
  5: 'Proves annual income falls within specific tax bracket',
};

const formatTimestamp = (timestamp: bigint): string => {
  if (!timestamp || timestamp === 0n) return 'Never';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAmount = (amount: bigint): string => {
  // Income proof thresholds are stored as whole dollars (NOT cents)
  // e.g., 12500n = $12,500 (not $125.00)
  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/**
 * Generate a professional PDF report for income proof verification
 */
export const generateProofPDF = async (
  proof: IncomeProof,
  contractAddress?: string
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPos = 20;

  // Header with branding
  doc.setFillColor(99, 102, 241); // Primary color
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('zkSalaria', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Income Verification Report', pageWidth / 2, 30, { align: 'center' });

  yPos = 48;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Certificate Statement
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFICATION CERTIFICATE', 15, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const certText = 'This certifies that the employee has successfully generated and verified an income proof using zero-knowledge cryptography on the Midnight blockchain.';
  const splitText = doc.splitTextToSize(certText, pageWidth - 30);
  doc.text(splitText, 15, yPos);
  yPos += splitText.length * 4 + 6;

  // Verification Status
  doc.setFillColor(34, 197, 94); // Success green
  doc.roundedRect(15, yPos, pageWidth - 30, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const now = BigInt(Math.floor(Date.now() / 1000));
  const status = proof.expires_at !== 0n && proof.expires_at < now ? 'EXPIRED' : 'VERIFIED';
  doc.text(`${status} ON-CHAIN`, pageWidth / 2, yPos + 10, { align: 'center' });
  yPos += 25;

  // Proof Details Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Proof Details', 15, yPos);
  yPos += 5;

  // Draw details box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, 70);

  // Proof Type
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('PROOF TYPE', 20, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(PROOF_TYPE_NAMES[Number(proof.proof_type)] || `Type ${proof.proof_type}`, 20, yPos + 15);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const description = doc.splitTextToSize(
    PROOF_TYPE_DESCRIPTIONS[Number(proof.proof_type)] || 'Income verification proof',
    pageWidth - 50
  );
  doc.text(description, 20, yPos + 20);

  // Verification Result with Threshold
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('VERIFICATION RESULT', 20, yPos + 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // Green
  doc.setFontSize(14);
  doc.text('Requirements Met ✓', 20, yPos + 45);

  // Show threshold amount that was met
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const proofType = Number(proof.proof_type);
  let thresholdText = '';

  if (proofType === 1) {
    // Income Above Threshold - show 6-month total (threshold_min is in cents)
    thresholdText = `Income Above: ${formatAmount(proof.threshold_min)} (6-month total)`;
  } else if (proofType === 2) {
    // Income Range - show range (thresholds are in cents)
    thresholdText = `Income Range: ${formatAmount(proof.threshold_min)} - ${formatAmount(proof.threshold_max)} (6-month total)`;
  } else if (proofType === 3) {
    // Average Income - show monthly average (threshold_min is in cents)
    thresholdText = `Average Income Above: ${formatAmount(proof.threshold_min)}/month`;
  } else if (proofType === 4) {
    // First-Time Loan - show consistency threshold (threshold_min is ratio as percentage)
    const consistencyPct = Number(proof.threshold_min) / 100; // Convert from cents to percentage
    thresholdText = `Income Consistency: <${consistencyPct.toFixed(0)}% variation`;
  }

  doc.text(thresholdText, 20, yPos + 51);

  // Dates
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('GENERATED', 20, yPos + 55);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(formatTimestamp(proof.submitted_at), 20, yPos + 62);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('EXPIRES', pageWidth / 2 + 10, yPos + 55);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(
    proof.expires_at !== 0n ? formatTimestamp(proof.expires_at) : 'Never',
    pageWidth / 2 + 10,
    yPos + 62
  );

  yPos += 80;

  // Technical Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Cryptographic Verification', 15, yPos);
  yPos += 9;

  // Attestation Hash
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('ATTESTATION HASH', 15, yPos);
  yPos += 4;

  const hashHex = Array.from(proof.attestation_hash)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const hashLines = doc.splitTextToSize(hashHex, pageWidth - 30);
  doc.text(hashLines, 15, yPos);
  yPos += hashLines.length * 3.5 + 4;

  // Verifier Public Key
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('ZKML VERIFIER PUBLIC KEY', 15, yPos);
  yPos += 4;

  const verifierHex = Array.from(proof.verifier_pubkey)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const verifierLines = doc.splitTextToSize(verifierHex, pageWidth - 30);
  doc.text(verifierLines, 15, yPos);
  yPos += verifierLines.length * 3.5 + 4;

  // Contract Address (if provided)
  if (contractAddress) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('EMPLOYER CONTRACT ADDRESS', 15, yPos);
    yPos += 4;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const contractLines = doc.splitTextToSize(contractAddress, pageWidth - 30);
    doc.text(contractLines, 15, yPos);
    yPos += contractLines.length * 3.5 + 6;
  }

  // Verification URL
  const verificationURL = `${window.location.origin}/verify/${hashHex}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('VERIFICATION URL', 15, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 241);
  doc.textWithLink(verificationURL, 15, yPos, { url: verificationURL });

  // Footer (positioned from bottom of page)
  const footerY = pageHeight - 35; // Increased margin from bottom

  // Anti-Tampering Notice (positioned above footer)
  const noticeY = footerY - 25;
  doc.setFillColor(250, 250, 250);
  doc.rect(15, noticeY, pageWidth - 30, 20, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  const notice = 'This report is generated from on-chain data. To verify authenticity, visit the verification URL above or check the attestation hash on the Midnight blockchain.';
  const noticeLines = doc.splitTextToSize(notice, pageWidth - 40);
  doc.text(noticeLines, 20, noticeY + 8);

  // Footer separator line
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  // Left side footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Powered by zkSalaria', 15, footerY + 2);
  doc.text('Zero-Knowledge Income Verification', 15, footerY + 7);

  // Right side footer - timestamp
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  const generatedText = `Generated: ${new Date().toLocaleString()}`;
  doc.text(generatedText, pageWidth - 15, footerY + 5, { align: 'right' });

  // Save PDF
  const filename = `zkSalaria-Income-Proof-${Date.now()}.pdf`;
  doc.save(filename);
};

/**
 * Generate a failure report PDF when income doesn't meet threshold
 */
export const generateFailureReport = async (
  proofType: number,
  employeeName: string,
  payments: number[],
  actualValue: number,
  thresholdMin: number,
  thresholdMax?: number,
  companyName?: string
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPos = 20;

  // Header with branding
  doc.setFillColor(239, 68, 68); // Red color for failure
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('zkSalaria', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Income Verification Report - Not Qualified', pageWidth / 2, 30, { align: 'center' });

  yPos = 48;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Certificate Statement
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFICATION RESULT', 15, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const certText = `This report certifies that ${employeeName}${companyName ? ` at ${companyName}` : ''} has attempted income verification using zero-knowledge cryptography. The verification was completed successfully, but the income does not meet the required threshold.`;
  const splitText = doc.splitTextToSize(certText, pageWidth - 30);
  doc.text(splitText, 15, yPos);
  yPos += splitText.length * 4 + 6;

  // Verification Status - Not Qualified
  doc.setFillColor(239, 68, 68); // Red background
  doc.roundedRect(15, yPos, pageWidth - 30, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('THRESHOLD NOT MET', pageWidth / 2, yPos + 10, { align: 'center' });
  yPos += 25;

  // Proof Type Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Verification Details', 15, yPos);
  yPos += 5;

  // Draw details box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, 80);

  // Proof Type
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('VERIFICATION TYPE', 20, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(PROOF_TYPE_NAMES[proofType] || `Type ${proofType}`, 20, yPos + 15);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const description = doc.splitTextToSize(
    PROOF_TYPE_DESCRIPTIONS[proofType] || 'Income verification proof',
    pageWidth - 50
  );
  doc.text(description, 20, yPos + 20);

  // Verification Result
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('VERIFICATION RESULT', 20, yPos + 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68); // Red
  doc.setFontSize(14);
  doc.text('Requirements Not Met ✗', 20, yPos + 45);

  // Tested Amounts
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('TESTED AMOUNTS', 20, yPos + 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Format the values based on proof type
  let valueText = '';
  if (proofType === 3) {
    // Average Income - show monthly average
    const monthlyAvg = actualValue / 6;
    valueText = `6-Month Total: $${actualValue.toLocaleString()} | Avg: $${monthlyAvg.toLocaleString()}/mo`;
  } else {
    // Other types - show 6-month total
    valueText = `6-Month Total: $${actualValue.toLocaleString()}`;
  }
  doc.text(valueText, 20, yPos + 62);

  // Threshold comparison
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('THRESHOLD', 20, yPos + 68);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(239, 68, 68); // Red

  let thresholdText = '';
  if (proofType === 2 && thresholdMax) {
    thresholdText = `Range: $${thresholdMin.toLocaleString()} - $${thresholdMax.toLocaleString()}`;
  } else if (proofType === 3) {
    thresholdText = `Required Avg: $${thresholdMin.toLocaleString()}/mo`;
  } else {
    thresholdText = `Required: $${thresholdMin.toLocaleString()}`;
  }
  doc.text(thresholdText, 20, yPos + 75);

  yPos += 90;

  // Privacy Notice Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Report Information', 15, yPos);
  yPos += 9;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const privacyText = 'This is a local failure report for your records only. Since the verification did not meet requirements, no proof was submitted to the blockchain. The actual amounts are shown above to help you understand what was tested and what threshold needs to be met. This report is private and should only be shared with parties you trust.';
  const privacySplit = doc.splitTextToSize(privacyText, pageWidth - 30);
  doc.text(privacySplit, 15, yPos);
  yPos += privacySplit.length * 4 + 4;

  // What This Means Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('What This Means:', 15, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('• The cryptographic proof generation was successful', 20, yPos);
  yPos += 5;
  doc.text('• The income verification was computed correctly', 20, yPos);
  yPos += 5;
  doc.text('• The requirements were not satisfied for this proof type', 20, yPos);
  yPos += 5;
  doc.text('• All financial data remains private and encrypted', 20, yPos);
  yPos += 10;

  // Next Steps
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommendations:', 15, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text('• Try a different proof type that may better suit your situation', 20, yPos);
  yPos += 5;
  doc.text('• Wait for additional payment periods before re-attempting verification', 20, yPos);
  yPos += 5;
  doc.text('• Contact the verifier to discuss alternative verification options', 20, yPos);
  yPos += 5;
  doc.text('• Your private financial data was never disclosed during this process', 20, yPos);

  yPos += 15;

  // Footer (positioned from bottom of page)
  const footerY = pageHeight - 35;

  // Privacy Notice
  const noticeY = footerY - 25;
  doc.setFillColor(250, 250, 250);
  doc.rect(15, noticeY, pageWidth - 30, 20, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  const notice = 'This report is for informational purposes only. No proof was submitted to the blockchain. Your payment data remains private and was processed using zero-knowledge cryptography.';
  const noticeLines = doc.splitTextToSize(notice, pageWidth - 40);
  doc.text(noticeLines, 20, noticeY + 8);

  // Footer separator line
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.5);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  // Left side footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Powered by zkSalaria', 15, footerY + 2);
  doc.text('Zero-Knowledge Income Verification', 15, footerY + 7);

  // Right side footer - timestamp
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  const generatedText = `Generated: ${new Date().toLocaleString()}`;
  doc.text(generatedText, pageWidth - 15, footerY + 5, { align: 'right' });

  // Save PDF
  const filename = `zkSalaria-Verification-Failed-${Date.now()}.pdf`;
  doc.save(filename);
};

// Export proof type mappings for use in UI
export { PROOF_TYPE_NAMES, PROOF_TYPE_DESCRIPTIONS };
