import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Paper,
  Title,
  Group,
  TextInput,
  Pagination,
  Loader,
  Center,
  Text
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { userExamService } from '../services/userExamService';
import { useNavigate } from 'react-router-dom';

const pageSize = 20;

const TakeExamList: React.FC = () => {
  const navigate = useNavigate();
  const [examSets, setExamSets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [totalExamSets, setTotalExamSets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalPages = Math.ceil(totalExamSets / pageSize) || 1;

  if (loading) {
    return <Center style={{ height: '60vh' }}><Loader /></Center>;
  }
  if (error) {
    return <Center style={{ height: '60vh' }}><Text color="red">{error}</Text></Center>;
  }

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Group justify="space-between" mb="xl">
        <Title order={2} c="indigo.7">Exam List</Title>
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
            <Table.Tr key={examSet.id} onClick={() => navigate(`/take-exam/${examSet.id}`)} style={{ cursor: 'pointer' }}>
              <Table.Td>{examSet.set_code}</Table.Td>
              <Table.Td>{examSet.title}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Group justify="flex-end" mt="md">
        <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
      </Group>
    </Paper>
  );
};

export default TakeExamList; 