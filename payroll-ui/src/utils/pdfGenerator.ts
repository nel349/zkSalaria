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
};

const PROOF_TYPE_DESCRIPTIONS: Record<number, string> = {
  1: 'Proves minimum monthly income meets threshold',
  2: 'Proves monthly income falls within specified range',
  3: 'Proves average income over 6 months meets minimum',
  4: 'Proves income consistency for loan eligibility',
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
  return `$${(Number(amount) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

  // Proven Amount
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('PROVEN THRESHOLD', 20, yPos + 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(16);
  const threshold = Number(proof.proof_type) === 2
    ? `${formatAmount(proof.threshold_min)} - ${formatAmount(proof.threshold_max)}`
    : `≥ ${formatAmount(proof.threshold_min)}`;
  doc.text(threshold, 20, yPos + 45);

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
