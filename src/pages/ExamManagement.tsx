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
  Pagination,
} from '@mantine/core';
import { IconTrash, IconPlus, IconSearch, IconRefresh } from '@tabler/icons-react';
import { examSetService } from '../services/examSetService';
import { ExamSet, CreateExamSetDto, UpdateExamSetDto } from '../types/examSet';
import { useNavigate } from 'react-router-dom';

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedExamSet, setSelectedExamSet] = useState<ExamSet | null>(null);
  const [formData, setFormData] = useState<CreateExamSetDto>({
    set_code: '',
    title: '',
  });

  // State for pagination and search
  const [search, setSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [totalExamSets, setTotalExamSets] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const pageSize = 20; // Mặc định 20 exam sets mỗi trang

  const loadExamSets = useCallback(async () => {
    try {
      const response = await examSetService.getAll(search, activePage, pageSize);
      setExamSets(response.examSets);
      setTotalExamSets(response.total);
    } catch (error) {
      console.error('Error loading exam sets in ExamManagement:', error);
    }
  }, [search, activePage, pageSize, setExamSets, setTotalExamSets]);

  useEffect(() => {
    loadExamSets();
  }, [loadExamSets]);

  const handleOpenModal = (examSet?: ExamSet) => {
    if (examSet) {
      setIsEditMode(true);
      setSelectedExamSet(examSet);
      setFormData({
        set_code: examSet.set_code,
        title: examSet.title,
      });
    } else {
      setIsEditMode(false);
      setSelectedExamSet(null);
      setFormData({
        set_code: '',
        title: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExamSet(null);
    setFormData({
      set_code: '',
      title: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && selectedExamSet) {
        const updateData: UpdateExamSetDto = {
          set_code: formData.set_code,
          title: formData.title,
        };
        await examSetService.update(selectedExamSet.id, updateData);
      } else {
        await examSetService.create(formData);
      }
      handleCloseModal();
      await loadExamSets();
    } catch (error) {
      console.error('Error saving exam set:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this exam set?')) {
      try {
        await examSetService.delete(id);
        await loadExamSets();
      } catch (error) {
        console.error('Error deleting exam set:', error);
      }
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await examSetService.syncData();
      await loadExamSets(); // Reload data after sync
      alert('Data synced successfully!');
    } catch (error) {
      console.error('Error syncing data:', error);
      alert('Failed to sync data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPages = Math.ceil(totalExamSets / pageSize);

  return (
    <>
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Title order={2} c="#285325">Exam Set Management</Title>
          <Group gap="md">
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleSync}
              loading={isSyncing}
              variant="outline"
              color="blue"
            >
              Sync Data
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => handleOpenModal()}
              color="indigo"
            >
              Add New Exam Set
            </Button>
          </Group>
        </Group>

        <Group mb="md">
          <TextInput
            placeholder="Search by set code or title"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Set Code</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {examSets.map((examSet) => (
              <Table.Tr key={examSet.id} onClick={() => navigate(`/exam-sets/${examSet.id}`)} style={{ cursor: 'pointer' }}>
                <Table.Td>{examSet.set_code}</Table.Td>
                <Table.Td>{examSet.title}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="filled"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click from firing
                        handleDelete(examSet.id);
                      }}
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
        title={isEditMode ? 'Edit Exam Set' : 'Add New Exam Set'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Set Code"
              placeholder="Enter set code"
              value={formData.set_code}
              onChange={(e) => setFormData({ ...formData, set_code: e.target.value })}
              required
            />
            <TextInput
              label="Title"
              placeholder="Enter title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" color="indigo">
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default ExamManagement; 