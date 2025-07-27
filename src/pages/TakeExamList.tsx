import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Table,
  Paper,
  Title,
  Group,
  TextInput,
  Pagination,
  Loader,
  Center,
  Text,
  Modal,
  Chip,
  Button,
  Stack,
  ThemeIcon
} from '@mantine/core';
import { IconSearch, IconLock, IconX } from '@tabler/icons-react';
import { userExamService } from '../services/userExamService';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';

const pageSize = 15;

const TakeExamList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const isGuest = user?.role === 'guest';
  const [examSets, setExamSets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [totalExamSets, setTotalExamSets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const loadExamSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userExamService.getUserExamSets(search, activePage, pageSize);
      setExamSets(res.items || res.examSets || []);
      setTotalExamSets(res.total || (res.items ? res.items.length : 0));
    } catch (err) {
      setError('Không lấy được danh sách bài thi.');
    } finally {
      setLoading(false);
    }
  }, [search, activePage]);

  useEffect(() => {
    loadExamSets();
  }, [loadExamSets]);

  const handleExamClick = (examSet: any) => {
    if (examSet.is_locked && isGuest) {
      setShowLockedModal(true);
    } else {
      navigate(`/take-exam/${examSet.id}`);
    }
  };

  const totalPages = Math.ceil(totalExamSets / pageSize) || 1;

  if (loading) {
    return <Center style={{ height: '60vh' }}><Loader /></Center>;
  }
  if (error) {
    return <Center style={{ height: '60vh' }}><Text color="red">{error}</Text></Center>;
  }

  return (
    <>
      <Paper shadow="sm" p="xl" radius="md" withBorder style={{ maxWidth: 'none', width: '100%' }}>
        <Group justify="space-between" mb="xl">
          <Title order={2} c="#285325">Exam List</Title>
        </Group>
        <Group mb="md">
          <TextInput
            placeholder="Search by code or title"
            value={search}
            onChange={(event) => { setSearch(event.currentTarget.value); setActivePage(1); }}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Exam Code</Table.Th>
              <Table.Th>Title</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {examSets.map((examSet) => (
                            <Table.Tr 
                key={examSet.id} 
                onClick={() => handleExamClick(examSet)} 
                style={{ 
                  cursor: (examSet.is_locked && isGuest) ? 'not-allowed' : 'pointer',
                  opacity: (examSet.is_locked && isGuest) ? 0.4 : 1,
                  position: 'relative',
                  filter: (examSet.is_locked && isGuest) ? 'grayscale(50%)' : 'none'
                }}
              >
                <Table.Td>{examSet.set_code}</Table.Td>
                <Table.Td>{examSet.title}</Table.Td>
                {examSet.is_locked && isGuest && (
                  <Chip
                    checked
                    size="xs"
                    color="red"
                    icon={<IconLock size={14} />}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    LOCKED
                  </Chip>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
        </Group>
      </Paper>

      <Modal
        opened={showLockedModal}
        onClose={() => setShowLockedModal(false)}
        title={
          <Group align="center">
            <ThemeIcon color="red" size="lg" radius="xl" variant="light">
              <IconLock size={20} />
            </ThemeIcon>
            <Text fw={700} size="lg">Bài thi đã bị khóa</Text>
          </Group>
        }
        centered
        radius="md"
        size="sm"
        withCloseButton={false}
        padding="lg"
        overlayProps={{
          blur: 2,
          opacity: 0.3,
        }}
      >
        <Stack>
          <Text c="dimmed" size="sm">
            Bài thi này hiện đang bị khóa. Vui lòng liên hệ với <Text span fw={600} c="blue">quản trị viên</Text> để được hỗ trợ mở khóa.
          </Text>

          <Group justify="flex-end">
            <Button
              variant="light"
              color="gray"
              leftSection={<IconX size={14} />}
              onClick={() => setShowLockedModal(false)}
            >
              Đóng
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default TakeExamList; 