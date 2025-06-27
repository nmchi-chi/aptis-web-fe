import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Group,
  ActionIcon,
  Paper,
  Title,
  Pagination,
  Badge,
  Modal,
  Text,
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
  const pageSize = 20;

  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);

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
      await guestAdminService.setCalled(guest.id);
      await loadGuests(); // Reload to get updated data
    } catch (error) {
      console.error('Error setting guest called status:', error);
    }
  };

  const handleDeleteClick = (guest: Guest) => {
    setGuestToDelete(guest);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (guestToDelete) {
      try {
        await guestAdminService.delete(guestToDelete.id);
        setDeleteModalOpen(false);
        setGuestToDelete(null);
        await loadGuests(); // Reload to get updated data
      } catch (error) {
        console.error('Error deleting guest:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setGuestToDelete(null);
  };

  const totalPages = Math.ceil(totalGuests / pageSize);

  return (
    <>
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Title order={2} c="indigo.7">Guest Management</Title>
          <Text size="sm" c="dimmed">
            Tổng số khách hàng: {totalGuests}
          </Text>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Họ và tên</Table.Th>
              <Table.Th>Số điện thoại</Table.Th>
              <Table.Th>Trạng thái</Table.Th>
              <Table.Th>Hành động</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                  Đang tải...
                </Table.Td>
              </Table.Tr>
            ) : guests.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                  Không có dữ liệu
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
                      color={guest.is_called ? "green" : "gray"}
                      variant="light"
                    >
                      {guest.is_called ? "Đã gọi" : "Chưa gọi"}
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
                        onClick={() => handleDeleteClick(guest)}
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

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Xác nhận xóa"
        size="sm"
      >
        <Text mb="md">
          Bạn có chắc chắn muốn xóa khách hàng <strong>{guestToDelete?.fullname}</strong> không?
        </Text>
        <Text size="sm" c="dimmed" mb="lg">
          Hành động này không thể hoàn tác.
        </Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={handleDeleteCancel}>
            Hủy
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Xóa
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default GuestManagement;
