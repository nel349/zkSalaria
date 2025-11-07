// @ts-nocheck - MUI compatibility
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BadgeIcon from '@mui/icons-material/Badge';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentsIcon from '@mui/icons-material/Payments';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import { useTheme, useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { getCurrentCompany } from '../utils/CompaniesLocalState';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import pino from 'pino';

const logger = pino({
  name: 'employee-list',
  level: 'info',
  browser: {
    asObject: false,
  },
});

interface EmployeeMetadata {
  employeeId: string;
  name: string;
  email: string;
  role?: string;
  baseSalary?: string;
  addedAt: string;
  companyContractAddress: string;
}

/**
 * Employee List/Management Page (Phase 3.1c)
 * View and manage all employees for a company
 */
export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const currentCompanyAddress = getCurrentCompany();
  const [api, setApi] = useState<DeployedPayrollAPI | null>(null);
  const [employees, setEmployees] = useState<EmployeeMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMetadata | null>(null);

  // Modals
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSalary, setEditSalary] = useState('');

  // Load employees from localStorage and connect to API
  useEffect(() => {
    const loadEmployees = async () => {
      if (!currentCompanyAddress || !walletAddress) {
        setError('No company selected');
        setLoading(false);
        return;
      }

      try {
        // Connect to API
        const connectedApi = await PayrollAPI.connect(providers, currentCompanyAddress, walletAddress, logger);
        setApi(connectedApi);

        // Load employees from localStorage
        const key = `payroll-ui.employees.${currentCompanyAddress}`;
        const storedEmployees = JSON.parse(localStorage.getItem(key) || '[]') as EmployeeMetadata[];
        setEmployees(storedEmployees);
        setLoading(false);
      } catch (err) {
        console.error('[EmployeeList] Failed to load:', err);
        setError('Failed to connect to contract');
        setLoading(false);
      }
    };

    loadEmployees();
  }, [currentCompanyAddress, walletAddress, providers]);

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.employeeId.toLowerCase().includes(query) ||
          (emp.role && emp.role.toLowerCase().includes(query))
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      result = result.filter((emp) => emp.role === filterRole);
    }

    // Sort by added date (newest first)
    result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

    return result;
  }, [employees, searchQuery, filterRole]);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set(employees.map((emp) => emp.role).filter(Boolean));
    return Array.from(roles);
  }, [employees]);

  // Handle actions menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, employee: EmployeeMetadata) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // View employee details
  const handleViewDetails = () => {
    handleCloseMenu();
    setViewDetailsOpen(true);
  };

  // Edit employee
  const handleOpenEdit = () => {
    if (selectedEmployee) {
      setEditName(selectedEmployee.name);
      setEditEmail(selectedEmployee.email);
      setEditRole(selectedEmployee.role || '');
      setEditSalary(selectedEmployee.baseSalary || '');
      setEditModalOpen(true);
      handleCloseMenu();
    }
  };

  const handleSaveEdit = () => {
    if (!selectedEmployee) return;

    const key = `payroll-ui.employees.${currentCompanyAddress}`;
    const updatedEmployees = employees.map((emp) =>
      emp.employeeId === selectedEmployee.employeeId
        ? {
            ...emp,
            name: editName,
            email: editEmail,
            role: editRole || undefined,
            baseSalary: editSalary || undefined,
          }
        : emp
    );

    localStorage.setItem(key, JSON.stringify(updatedEmployees));
    setEmployees(updatedEmployees);
    setEditModalOpen(false);
    setSelectedEmployee(null);
  };

  // Delete employee
  const handleOpenDelete = () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedEmployee) return;

    const key = `payroll-ui.employees.${currentCompanyAddress}`;
    const updatedEmployees = employees.filter((emp) => emp.employeeId !== selectedEmployee.employeeId);
    localStorage.setItem(key, JSON.stringify(updatedEmployees));
    setEmployees(updatedEmployees);
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  // Pay employee
  const handlePayEmployee = () => {
    handleCloseMenu();
    // TODO: Navigate to pay employee flow or open pay modal
    console.log('[EmployeeList] Pay employee:', selectedEmployee?.name);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Wallet Address', 'Role', 'Base Salary', 'Added Date'];
    const rows = filteredEmployees.map((emp) => [
      emp.name,
      emp.email,
      emp.employeeId,
      emp.role || 'N/A',
      emp.baseSalary ? `$${emp.baseSalary}` : 'N/A',
      new Date(emp.addedAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees-${currentCompanyAddress}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Format currency
  const formatCurrency = (value?: string): string => {
    if (!value) return 'Not set';
    return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Refresh employees after adding
  const handleEmployeeAdded = () => {
    const key = `payroll-ui.employees.${currentCompanyAddress}`;
    const storedEmployees = JSON.parse(localStorage.getItem(key) || '[]') as EmployeeMetadata[];
    setEmployees(storedEmployees);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.colors.background.default,
        }}
      >
        <CircularProgress sx={{ color: theme.colors.primary[500] }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.colors.background.default,
        pb: 8,
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          borderBottom: `1px solid ${theme.colors.border.default}`,
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            {/* Left: Title */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <BadgeIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
              <Box>
                <Typography variant="h5" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                  Employee Management
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Manage your team and payroll
                </Typography>
              </Box>
            </Stack>

            {/* Right: Actions */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={employees.length === 0}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddEmployeeModalOpen(true)}
                sx={{
                  bgcolor: theme.colors.primary[500],
                  '&:hover': { bgcolor: theme.colors.primary[700] },
                }}
              >
                Add Employee
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Stack spacing={4}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Search and Filter Bar */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              {/* Search */}
              <TextField
                fullWidth
                placeholder="Search by name, email, or wallet address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.colors.text.disabled }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Role Filter */}
              <TextField
                select
                label="Filter by Role"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">All Roles</MenuItem>
                {uniqueRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    <Typography>{role}</Typography>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Results Count */}
            <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 2 }}>
              Showing {filteredEmployees.length} of {employees.length} employees
            </Typography>
          </Paper>

          {/* Employee Table or Empty State */}
          {employees.length === 0 ? (
            // Empty State
            <Paper
              elevation={3}
              sx={{
                p: 8,
                borderRadius: 3,
                bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                textAlign: 'center',
              }}
            >
              <PeopleIcon sx={{ fontSize: 80, color: theme.colors.text.disabled, mb: 3 }} />
              <Typography variant="h5" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary} sx={{ mb: 1 }}>
                No Employees Yet
              </Typography>
              <Typography variant="body1" color={theme.colors.text.secondary} sx={{ mb: 4 }}>
                Start building your team by adding your first employee
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddEmployeeModalOpen(true)}
                sx={{
                  bgcolor: theme.colors.primary[500],
                  '&:hover': { bgcolor: theme.colors.primary[700] },
                  px: 4,
                  py: 1.5,
                }}
              >
                Add Your First Employee
              </Button>
            </Paper>
          ) : filteredEmployees.length === 0 ? (
            // No Search Results
            <Paper
              elevation={3}
              sx={{
                p: 6,
                borderRadius: 3,
                bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                textAlign: 'center',
              }}
            >
              <SearchIcon sx={{ fontSize: 60, color: theme.colors.text.disabled, mb: 2 }} />
              <Typography variant="h6" color={theme.colors.text.secondary}>
                No employees match your search
              </Typography>
              <Button variant="text" onClick={() => setSearchQuery('')} sx={{ mt: 2 }}>
                Clear search
              </Button>
            </Paper>
          ) : (
            // Employee Table
            <TableContainer
              component={Paper}
              elevation={3}
              sx={{
                borderRadius: 3,
                bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: mode === 'dark' ? theme.colors.background.surface : theme.colors.primary[50] }}>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Wallet Address</TableCell>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Base Salary</TableCell>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Added Date</TableCell>
                    <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow
                      key={employee.employeeId}
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: mode === 'dark' ? 'rgba(0, 217, 255, 0.05)' : 'rgba(0, 217, 255, 0.05)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                          {employee.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            color: theme.colors.text.secondary,
                          }}
                        >
                          {employee.employeeId.slice(0, 8)}...{employee.employeeId.slice(-6)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={theme.colors.text.secondary}>
                          {employee.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {employee.role ? (
                          <Chip
                            label={<Typography>{employee.role}</Typography>}
                            size="small"
                            sx={{
                              bgcolor: mode === 'dark' ? theme.colors.primary[900] : theme.colors.primary[100],
                              color: theme.colors.primary[500],
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color={theme.colors.text.disabled}>
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={theme.colors.text.secondary}>
                          {formatCurrency(employee.baseSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Active"
                          size="small"
                          icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            bgcolor: mode === 'dark' ? theme.colors.success[900] : theme.colors.success[100],
                            color: theme.colors.success[500],
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={theme.colors.text.secondary}>
                          {formatDate(employee.addedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Actions">
                          <IconButton size="small" onClick={(e) => handleOpenMenu(e, employee)}>
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Container>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handlePayEmployee}>
          <PaymentsIcon sx={{ mr: 1, fontSize: 20 }} />
          Pay Employee
        </MenuItem>
        <MenuItem onClick={handleOpenEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Info
        </MenuItem>
        <MenuItem onClick={handleOpenDelete} sx={{ color: theme.colors.error[500] }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Remove Employee
        </MenuItem>
      </Menu>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        open={addEmployeeModalOpen}
        onClose={() => setAddEmployeeModalOpen(false)}
        api={api}
        walletAddress={walletAddress}
        currentCompany={currentCompanyAddress || ''}
        onSuccess={handleEmployeeAdded}
      />

      {/* View Details Modal */}
      <Dialog open={viewDetailsOpen} onClose={() => setViewDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BadgeIcon sx={{ color: theme.colors.primary[500] }} />
            <Typography variant="h6">Employee Details</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Name
                </Typography>
                <Typography variant="body1" fontWeight={theme.typography.fontWeight.semibold}>
                  {selectedEmployee.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Email
                </Typography>
                <Typography variant="body1">{selectedEmployee.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Wallet Address
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedEmployee.employeeId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Role
                </Typography>
                <Typography variant="body1">{selectedEmployee.role || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Base Salary
                </Typography>
                <Typography variant="body1">{formatCurrency(selectedEmployee.baseSalary)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Added Date
                </Typography>
                <Typography variant="body1">{formatDate(selectedEmployee.addedAt)}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon sx={{ color: theme.colors.primary[500] }} />
            <Typography variant="h6">Edit Employee</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField fullWidth label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <TextField fullWidth label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            <TextField fullWidth label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value)} />
            <TextField
              fullWidth
              label="Base Salary"
              type="number"
              value={editSalary}
              onChange={(e) => setEditSalary(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DeleteIcon sx={{ color: theme.colors.error[500] }} />
            <Typography variant="h6">Remove Employee</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Are you sure you want to remove <strong>{selectedEmployee.name}</strong> from your payroll? This will only remove their local
                metadata. Their on-chain employment record will remain.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Remove Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
