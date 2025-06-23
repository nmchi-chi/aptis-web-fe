import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Group,
  TextInput,
  Modal,
  ActionIcon,
  Paper,
  Title,
  Stack,
  PasswordInput,
  Pagination,
  Select,
} from '@mantine/core';
import { IconTrash, IconPlus, IconSearch, IconLock, IconLockOpen, IconKey } from '@tabler/icons-react';
import { userService } from '../services/userService';
import { User, CreateUserDto, RoleEnum } from '../types/user';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState<CreateUserDto>({
    username: '',
    fullname: '',
    password: '',
    phone_number: '',
  });

  // State for pagination and search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleEnum | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 20;

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll(search, roleFilter, activePage, pageSize);
      console.log('API response users:', response.users);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (error) {
      console.error('Error loading users in UserManagement:', error);
    }
  }, [search, roleFilter, activePage, pageSize, setUsers, setTotalUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData({
      username: '',
      fullname: '',
      password: '',
      phone_number: '',
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      username: '',
      fullname: '',
      password: '',
      phone_number: '',
    });
  };

  const handleOpenResetPasswordModal = (user: User) => {
    console.log('Opening reset password modal for user:', user.id, user);
    setUserToResetPassword(user);
    setNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleCloseResetPasswordModal = () => {
    setUserToResetPassword(null);
    setNewPassword('');
    setIsResetPasswordModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.create(formData);
      handleCloseModal();
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userToResetPassword && newPassword) {
      try {
        await userService.resetPassword(userToResetPassword.id, newPassword);
        handleCloseResetPasswordModal();
        await loadUsers();
      } catch (error) {
        console.error('Error resetting password:', error);
      }
    } else {
      alert('Please enter a new password.');
    }
  };

  const handleToggleActive = async (user: User) => {
    console.log('Toggling active status for user:', user.id, user);
    if (user.is_active) {
      if (window.confirm(`Are you sure you want to deactivate user ${user.username}?`)) {
        try {
          await userService.deactivate(user.id);
          await loadUsers();
        } catch (error) {
          console.error('Error deactivating user:', error);
        }
      }
    } else {
      if (window.confirm(`Are you sure you want to reactivate user ${user.username}?`)) {
        try {
          await userService.reactivate(user.id);
          await loadUsers();
        } catch (error) {
          console.error('Error reactivating user:', error);
        }
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.delete(id);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <>
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Title order={2} c="indigo.7">User Management</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => handleOpenModal()}
            color="indigo"
          >
            Add New User
          </Button>
        </Group>

        <Group mb="md">
          <TextInput
            placeholder="Search by username or full name"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            w="20%"
          />
          <Select
            placeholder="Filter by role"
            data={[
              { value: RoleEnum.Admin, label: 'Admin' },
              { value: RoleEnum.Member, label: 'Member' },
            ]}
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as RoleEnum | null)}
            clearable
            w="20%"
          />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Username</Table.Th>
              <Table.Th>Full Name</Table.Th>
              <Table.Th>Phone Number</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.username}</Table.Td>
                <Table.Td>{user.fullname}</Table.Td>
                <Table.Td>{user.phone_number}</Table.Td>
                <Table.Td>{user.role === RoleEnum.Admin ? 'Admin' : user.role === RoleEnum.Member ? 'Member' : user.role}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="filled"
                      color={user.is_active ? "green" : "red"}
                      onClick={() => handleToggleActive(user)}
                      title={user.is_active ? "Deactivate User" : "Activate User"}
                    >
                      {user.is_active ? <IconLockOpen size={16} /> : <IconLock size={16} />}
                    </ActionIcon>
                    <ActionIcon
                      variant="filled"
                      color="indigo"
                      onClick={() => handleOpenResetPasswordModal(user)}
                      title="Reset Password"
                    >
                      <IconKey size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="filled"
                      color="red"
                      onClick={() => handleDelete(user.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
        </Group>
      </Paper>

      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Username"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <TextInput
              label="Full Name"
              placeholder="Enter full name"
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <TextInput
              label="Phone Number"
              placeholder="Enter phone number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" color="indigo">
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={isResetPasswordModalOpen}
        onClose={handleCloseResetPasswordModal}
        title="Reset Password"
        size="md"
      >
        <form onSubmit={handleResetPasswordSubmit}>
          <Stack>
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={handleCloseResetPasswordModal}>
                Cancel
              </Button>
              <Button type="submit" color="indigo">
                Reset Password
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default UserManagement; 