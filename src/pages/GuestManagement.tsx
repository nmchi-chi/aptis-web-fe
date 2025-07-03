import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Group,
  ActionIcon,
  Paper,
  Title,
  Pagination,
  Badge,
} from '@mantine/core';
import { IconTrash, IconPhone, IconPhoneOff } from '@tabler/icons-react';
import { guestAdminService } from '../services/guestAdminService';
import { Guest } from '../types/guest';

const GuestManagement: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);

  // State for pagination
  const [activePage, setActivePage] = useState(1);
  const [totalGuests, setTotalGuests] = useState(0);
  const pageSize = 15;

  // State for delete confirmation modal


  const loadGuests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await guestAdminService.getAll({
        page: activePage, // API uses 0-based pagination
        limit: pageSize
      });
      setGuests(response.guests);
      setTotalGuests(response.total);
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoading(false);
    }
  }, [activePage, pageSize]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const handleSetCalled = async (guest: Guest) => {
    try {
      if (guest.is_called) {
        await guestAdminService.setUnCalled(guest.id);
      } else {
        await guestAdminService.setCalled(guest.id);
      }
      await loadGuests(); // Reload to get updated data
    } catch (error) {
      console.error('Error setting guest called status:', error);
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (window.confirm(`Are you sure you want to delete guest ${guest.fullname}?`)) {
      try {
        await guestAdminService.delete(guest.id);
        await loadGuests();
      } catch (error) {
        console.error('Error deleting guest:', error);
      }
    }
  };

  const totalPages = Math.ceil(totalGuests / pageSize);

  return (
    <>
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Title order={2} c="indigo.7">Guest Management</Title>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Full Name</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                  Loading...
                </Table.Td>
              </Table.Tr>
            ) : guests.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                  No data
                </Table.Td>
              </Table.Tr>
            ) : (
              guests.map((guest) => (
                <Table.Tr key={guest.id}>
                  <Table.Td>{guest.id}</Table.Td>
                  <Table.Td>{guest.fullname}</Table.Td>
                  <Table.Td>{guest.phone_number}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={guest.is_called ? "gray" : "green"}
                      variant="light"
                    >
                      {guest.is_called ? "Called" : "New"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="filled"
                        color={guest.is_called ? "gray" : "blue"}
                        onClick={() => handleSetCalled(guest)}
                        title={guest.is_called ? "Đánh dấu chưa gọi" : "Đánh dấu đã gọi"}
                        disabled={loading}
                      >
                        {guest.is_called ? <IconPhoneOff size={16} /> : <IconPhone size={16} />}
                      </ActionIcon>
                      <ActionIcon
                        variant="filled"
                        color="red"
                        onClick={() => handleDelete(guest)}
                        title="Xóa khách hàng"
                        disabled={loading}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end" mt="md">
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={setActivePage}
            disabled={loading}
          />
        </Group>
      </Paper>

    </>
  );
};

export default GuestManagement;
