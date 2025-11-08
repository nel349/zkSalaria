import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Box,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import { useTheme, useThemeValues } from '../theme';
import { jsPDF } from 'jspdf';

interface DownloadReceiptModalProps {
  open: boolean;
  onClose: () => void;
  payment: {
    id: string;
    status: string;
    employeeName: string;
    employeeId: string;
    amount: number | bigint;
    isEncrypted?: boolean;
    date: string;
    type: string;
    transactionId: string;
    companyName?: string;
  } | null;
  userRole: 'company' | 'employee';
}

type DownloadFormat = 'pdf' | 'csv' | 'json';
type PrivacyMode = 'plaintext' | 'encrypted';

/**
 * Download Receipt Modal (Phase 2.8)
 * Allows users to download payment receipts in various formats
 */
export const DownloadReceiptModal: React.FC<DownloadReceiptModalProps> = ({
  open,
  onClose,
  payment,
  userRole,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  // State
  const [format, setFormat] = useState<DownloadFormat>('pdf');
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('plaintext');
  const [isDownloading, setIsDownloading] = useState(false);

  // Details to include
  const [includeDetails, setIncludeDetails] = useState({
    transactionId: true,
    timestamp: true,
    amount: true,
    paymentType: true,
    status: true,
    employeeInfo: true,
    companyInfo: userRole === 'employee',
  });

  if (!payment) return null;

  const isWithdrawal = payment.type.toLowerCase() === 'withdrawal';

  const handleDetailToggle = (detail: keyof typeof includeDetails) => {
    setIncludeDetails((prev) => ({
      ...prev,
      [detail]: !prev[detail],
    }));
  };

  const formatAmount = (amount: number | bigint): string => {
    const numAmount = typeof amount === 'bigint' ? Number(amount) / 100 : amount;
    const sign = isWithdrawal ? '-' : '';
    return `${sign}$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      salary: 'Regular Salary',
      regularsalary: 'Regular Salary',
      advance: 'Salary Advance',
      bonus: 'Bonus',
      commission: 'Commission',
      reimbursement: 'Reimbursement',
      adjustment: 'Adjustment',
      withdrawal: 'Withdrawal',
    };
    return types[type.toLowerCase()] || type;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(isWithdrawal ? 'Withdrawal Receipt' : 'Payment Receipt', marginLeft, yPos);
    yPos += 15;

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('zkSalaria - Private Payroll on Midnight Network', marginLeft, yPos);
    yPos += 15;

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(marginLeft, yPos, pageWidth - marginLeft, yPos);
    yPos += 10;

    // Transaction ID
    if (includeDetails.transactionId) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Transaction ID:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(payment.transactionId, marginLeft + 35, yPos);
      yPos += 8;
    }

    // Timestamp
    if (includeDetails.timestamp) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Date & Time:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(payment.date), marginLeft + 35, yPos);
      yPos += 8;
    }

    // Status
    if (includeDetails.status) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(payment.status.toUpperCase(), marginLeft + 35, yPos);
      yPos += 12;
    }

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(marginLeft, yPos, pageWidth - marginLeft, yPos);
    yPos += 10;

    // Payment Type
    if (includeDetails.paymentType) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Payment Type:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(getTypeLabel(payment.type), marginLeft + 35, yPos);
      yPos += 8;
    }

    // Amount
    if (includeDetails.amount) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Amount:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      const amountText = payment.isEncrypted && privacyMode === 'encrypted'
        ? '********'
        : formatAmount(payment.amount);
      doc.text(amountText, marginLeft + 35, yPos);
      yPos += 12;
    }

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(marginLeft, yPos, pageWidth - marginLeft, yPos);
    yPos += 10;

    // Employee Info
    if (includeDetails.employeeInfo && userRole === 'company') {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(payment.employeeName, marginLeft + 35, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`ID: ${payment.employeeId.substring(0, 16)}...`, marginLeft + 35, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }

    // Company Info
    if (includeDetails.companyInfo && userRole === 'employee' && payment.companyName) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Company:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(payment.companyName, marginLeft + 35, yPos);
      yPos += 10;
    }

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This receipt was generated by zkSalaria on the Midnight Network.', marginLeft, yPos);
    yPos += 5;
    doc.text('All payment data is secured with zero-knowledge proofs for privacy.', marginLeft, yPos);

    // Privacy notice if encrypted
    if (payment.isEncrypted && privacyMode === 'encrypted') {
      yPos += 5;
      doc.setTextColor(200, 100, 100);
      doc.text('Note: Amounts are encrypted for privacy. Decrypt in the app to view.', marginLeft, yPos);
    }

    // Save PDF
    const filename = `zkSalaria_Receipt_${payment.transactionId.substring(0, 8)}_${Date.now()}.pdf`;
    doc.save(filename);
  };

  const generateCSV = () => {
    const rows: string[][] = [
      ['zkSalaria Payment Receipt'],
      [''],
    ];

    if (includeDetails.transactionId) {
      rows.push(['Transaction ID', payment.transactionId]);
    }
    if (includeDetails.timestamp) {
      rows.push(['Date & Time', formatDate(payment.date)]);
    }
    if (includeDetails.status) {
      rows.push(['Status', payment.status.toUpperCase()]);
    }
    if (includeDetails.paymentType) {
      rows.push(['Payment Type', getTypeLabel(payment.type)]);
    }
    if (includeDetails.amount) {
      const amountText = payment.isEncrypted && privacyMode === 'encrypted'
        ? '********'
        : formatAmount(payment.amount);
      rows.push(['Amount', amountText]);
    }
    if (includeDetails.employeeInfo && userRole === 'company') {
      rows.push(['Employee Name', payment.employeeName]);
      rows.push(['Employee ID', payment.employeeId]);
    }
    if (includeDetails.companyInfo && userRole === 'employee' && payment.companyName) {
      rows.push(['Company', payment.companyName]);
    }

    // Convert to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zkSalaria_Receipt_${payment.transactionId.substring(0, 8)}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateJSON = () => {
    const data: any = {
      receipt_type: isWithdrawal ? 'withdrawal' : 'payment',
      generated_at: new Date().toISOString(),
      blockchain: 'Midnight Network',
      platform: 'zkSalaria',
    };

    if (includeDetails.transactionId) {
      data.transaction_id = payment.transactionId;
    }
    if (includeDetails.timestamp) {
      data.timestamp = payment.date;
    }
    if (includeDetails.status) {
      data.status = payment.status;
    }
    if (includeDetails.paymentType) {
      data.payment_type = payment.type;
    }
    if (includeDetails.amount) {
      data.amount = payment.isEncrypted && privacyMode === 'encrypted'
        ? 'ENCRYPTED'
        : {
            value: typeof payment.amount === 'bigint' ? Number(payment.amount) / 100 : payment.amount,
            currency: 'USD',
            formatted: formatAmount(payment.amount),
          };
    }
    if (includeDetails.employeeInfo && userRole === 'company') {
      data.employee = {
        name: payment.employeeName,
        id: payment.employeeId,
      };
    }
    if (includeDetails.companyInfo && userRole === 'employee' && payment.companyName) {
      data.company = {
        name: payment.companyName,
      };
    }

    // Convert to JSON string
    const jsonContent = JSON.stringify(data, null, 2);

    // Create blob and download
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zkSalaria_Receipt_${payment.transactionId.substring(0, 8)}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Simulate download delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      if (format === 'pdf') {
        generatePDF();
      } else if (format === 'csv') {
        generateCSV();
      } else if (format === 'json') {
        generateJSON();
      }

      // Close modal after successful download
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('[DownloadReceipt] Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <DownloadIcon sx={{ fontSize: 28, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                Download Receipt
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                Export payment details
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Format Selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend">
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                Format
              </Typography>
            </FormLabel>
            <RadioGroup value={format} onChange={(e) => setFormat(e.target.value as DownloadFormat)}>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <FormControlLabel
                  value="pdf"
                  control={
                    <Radio
                      sx={{
                        color: '#fff',
                        '& .MuiSvgIcon-root': {
                          fontSize: 20,
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '&.Mui-checked': {
                          color: theme.colors.primary[500],
                          '& .MuiSvgIcon-root': {
                            color: theme.colors.primary[500],
                          },
                        },
                      }}
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PictureAsPdfIcon sx={{ fontSize: 18, color: theme.colors.error[500] }} />
                      <Box>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>PDF Document</Typography>
                        <Typography variant="caption" color={theme.colors.text.secondary}>
                          Formatted receipt ready for printing
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
                <FormControlLabel
                  value="csv"
                  control={
                    <Radio
                      sx={{
                        color: '#fff',
                        '& .MuiSvgIcon-root': {
                          fontSize: 20,
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '&.Mui-checked': {
                          color: theme.colors.primary[500],
                          '& .MuiSvgIcon-root': {
                            color: theme.colors.primary[500],
                          },
                        },
                      }}
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TableChartIcon sx={{ fontSize: 18, color: theme.colors.success[500] }} />
                      <Box>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>CSV Spreadsheet</Typography>
                        <Typography variant="caption" color={theme.colors.text.secondary}>
                          Import into Excel or Google Sheets
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
                <FormControlLabel
                  value="json"
                  control={
                    <Radio
                      sx={{
                        color: '#fff',
                        '& .MuiSvgIcon-root': {
                          fontSize: 20,
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '&.Mui-checked': {
                          color: theme.colors.primary[500],
                          '& .MuiSvgIcon-root': {
                            color: theme.colors.primary[500],
                          },
                        },
                      }}
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CodeIcon sx={{ fontSize: 18, color: theme.colors.info[500] }} />
                      <Box>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>JSON Data</Typography>
                        <Typography variant="caption" color={theme.colors.text.secondary}>
                          Structured data for integrations
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
              </Stack>
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Details to Include */}
          <FormControl component="fieldset">
            <FormLabel component="legend">
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                Include Details
              </Typography>
            </FormLabel>
            <FormGroup sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeDetails.transactionId}
                    onChange={() => handleDetailToggle('transactionId')}
                    sx={{
                      color: '#fff',
                      '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                      '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                    }}
                  />
                }
                label={<Typography variant="body2">Transaction ID</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeDetails.timestamp}
                    onChange={() => handleDetailToggle('timestamp')}
                    sx={{
                      color: '#fff',
                      '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                      '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                    }}
                  />
                }
                label={<Typography variant="body2">Date & Time</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeDetails.amount}
                    onChange={() => handleDetailToggle('amount')}
                    sx={{
                      color: '#fff',
                      '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                      '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                    }}
                  />
                }
                label={<Typography variant="body2">Amount</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeDetails.paymentType}
                    onChange={() => handleDetailToggle('paymentType')}
                    sx={{
                      color: '#fff',
                      '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                      '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                    }}
                  />
                }
                label={<Typography variant="body2">Payment Type</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeDetails.status}
                    onChange={() => handleDetailToggle('status')}
                    sx={{
                      color: '#fff',
                      '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                      '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                    }}
                  />
                }
                label={<Typography variant="body2">Status</Typography>}
              />
              {userRole === 'company' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeDetails.employeeInfo}
                      onChange={() => handleDetailToggle('employeeInfo')}
                      sx={{
                        color: '#fff',
                        '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                        '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Employee Information</Typography>}
                />
              )}
              {userRole === 'employee' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeDetails.companyInfo}
                      onChange={() => handleDetailToggle('companyInfo')}
                      sx={{
                        color: '#fff',
                        '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                        '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Company Information</Typography>}
                />
              )}
            </FormGroup>
          </FormControl>

          <Divider />

          {/* Privacy Options */}
          {payment.isEncrypted && (
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                  Privacy Options
                </Typography>
              </FormLabel>
              <RadioGroup value={privacyMode} onChange={(e) => setPrivacyMode(e.target.value as PrivacyMode)}>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <FormControlLabel
                    value="plaintext"
                    control={
                      <Radio
                        sx={{
                          color: '#fff',
                          '& .MuiSvgIcon-root': {
                            fontSize: 20,
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '&.Mui-checked': {
                            color: theme.colors.primary[500],
                            '& .MuiSvgIcon-root': {
                              color: theme.colors.primary[500],
                            },
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>Show Amounts</Typography>
                        <Typography variant="caption" color={theme.colors.text.secondary}>
                          Display decrypted amounts in receipt
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="encrypted"
                    control={
                      <Radio
                        sx={{
                          color: '#fff',
                          '& .MuiSvgIcon-root': {
                            fontSize: 20,
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '&.Mui-checked': {
                            color: theme.colors.primary[500],
                            '& .MuiSvgIcon-root': {
                              color: theme.colors.primary[500],
                            },
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>Hide Amounts</Typography>
                        <Typography variant="caption" color={theme.colors.text.secondary}>
                          Show amounts as encrypted (•••••••)
                        </Typography>
                      </Box>
                    }
                  />
                </Stack>
              </RadioGroup>
            </FormControl>
          )}

          {/* Info Alert */}
          <Alert severity="info">
            <Typography variant="caption">
              The receipt will include transaction details from the Midnight Network blockchain.
              This document can be used for record-keeping and verification purposes.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isDownloading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleDownload}
          disabled={isDownloading}
          startIcon={isDownloading ? <CircularProgress size={16} /> : <DownloadIcon />}
        >
          {isDownloading ? 'Downloading...' : 'Download Receipt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
