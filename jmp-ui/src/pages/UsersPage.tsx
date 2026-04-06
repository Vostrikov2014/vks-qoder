import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { userApi } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleNames: [] as string[],
  });

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers({ search });
      setUsers(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      roleNames: ['ROLE_PARTICIPANT'],
    });
    setOpenDialog(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      roleNames: user.roles,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await userApi.updateUser(editingUser.id, updateData);
      } else {
        await userApi.createUser(formData);
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_VERIFICATION':
        return 'warning';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add User
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search users"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    color={getStatusColor(user.status) as 'success' | 'warning' | 'error' | 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.roles.map((role) => (
                    <Chip
                      key={role}
                      label={role.replace('ROLE_', '')}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(user.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            disabled={!!editingUser}
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            margin="normal"
          />
          {!editingUser && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
