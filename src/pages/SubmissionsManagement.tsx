import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Group,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Pagination,
  Stack,
  Text,
  Button,
  Checkbox
} from '@mantine/core';
import { IconSearch, IconEye, IconEdit } from '@tabler/icons-react';
import { submissionService } from '../services/submissionService';
import { Submission, ExamType, SubmissionFilters } from '../types/submission';

const SubmissionsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  
  // Filter states
  const [fullnameFilter, setFullnameFilter] = useState('');
  const [examCodeFilter, setExamCodeFilter] = useState('');
  const [examSetCodeFilter, setExamSetCodeFilter] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState<ExamType | null>(null);
  const [isScoredFilter, setIsScoredFilter] = useState<boolean | null>(null);
  
  // Pagination
  const [activePage, setActivePage] = useState(1);
  const pageSize = 15;

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const filters: SubmissionFilters = {
        page: activePage,
        limit: pageSize,
      };

      if (fullnameFilter.trim()) {
        filters.fullname = fullnameFilter.trim();
      }
      if (examCodeFilter.trim()) {
        filters.exam_code = examCodeFilter.trim();
      }
      if (examSetCodeFilter.trim()) {
        filters.exam_set_code = examSetCodeFilter.trim();
      }
      if (examTypeFilter) {
        filters.exam_type = examTypeFilter;
      }
      if (isScoredFilter !== null) {
        filters.is_scored = isScoredFilter;
      }

      const response = await submissionService.getSubmissions(filters);
      setSubmissions(response.items);
      setTotalSubmissions(response.total);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [activePage, fullnameFilter, examCodeFilter, examSetCodeFilter, examTypeFilter, isScoredFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleResetFilters = () => {
    setFullnameFilter('');
    setExamCodeFilter('');
    setExamSetCodeFilter('');
    setExamTypeFilter(null);
    setIsScoredFilter(null);
    setActivePage(1);
  };

  const handleViewSubmission = (submissionId: number) => {
    navigate(`/admin/view-submission/${submissionId}`);
  };

  const handleEditSubmission = (submissionId: number) => {
    navigate(`/admin/score-submission/${submissionId}`);
  };

  const getExamTypeBadgeColor = (examType: string) => {
    switch (examType) {
      case 'reading':
        return 'blue';
      case 'listening':
        return 'green';
      case 'speaking':
        return 'orange';
      case 'writing':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const totalPages = Math.ceil(totalSubmissions / pageSize);

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Group justify="space-between" mb="xl">
        <Title order={2} c="indigo.7">Submissions Management</Title>
      </Group>

      {/* Filters */}
      <Stack gap="md" mb="xl">
        <Group>
          <TextInput
            placeholder="Search by student name"
            value={fullnameFilter}
            onChange={(event) => setFullnameFilter(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Search by exam code"
            value={examCodeFilter}
            onChange={(event) => setExamCodeFilter(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
        </Group>
        
        <Group>
          <TextInput
            placeholder="Search by exam set code"
            value={examSetCodeFilter}
            onChange={(event) => setExamSetCodeFilter(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by exam type"
            data={[
              { value: 'reading', label: 'Reading' },
              { value: 'listening', label: 'Listening' },
              { value: 'speaking', label: 'Speaking' },
              { value: 'writing', label: 'Writing' },
            ]}
            value={examTypeFilter}
            onChange={(value) => setExamTypeFilter(value as ExamType | null)}
            clearable
            style={{ flex: 1 }}
          />
        </Group>

        <Group>
          <Checkbox
            label="Show only scored submissions"
            checked={isScoredFilter === true}
            onChange={(event) => setIsScoredFilter(event.currentTarget.checked ? true : null)}
          />
          <Checkbox
            label="Show only unscored submissions"
            checked={isScoredFilter === false}
            onChange={(event) => setIsScoredFilter(event.currentTarget.checked ? false : null)}
          />
          <Button variant="light" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </Group>
      </Stack>

      {/* Table */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Student Name</Table.Th>
            <Table.Th>Exam Type</Table.Th>
            <Table.Th>Exam Code</Table.Th>
            <Table.Th>Exam Set</Table.Th>
            <Table.Th>Score</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {submissions.map((submission) => (
            <Table.Tr key={submission.id}>
              <Table.Td>{submission.user_name}</Table.Td>
              <Table.Td>
                <Badge color={getExamTypeBadgeColor(submission.exam_type)} variant="light">
                  {submission.exam_type.charAt(0).toUpperCase() + submission.exam_type.slice(1)}
                </Badge>
              </Table.Td>
              <Table.Td>{submission.exam_code}</Table.Td>
              <Table.Td>
                <div>
                  <Text size="sm" fw={500}>{submission.exam_set_title}</Text>
                  <Text size="xs" c="dimmed">{submission.exam_set_code}</Text>
                </div>
              </Table.Td>
              <Table.Td>
                {submission.score ? (
                  <Text fw={500}>{submission.score}</Text>
                ) : (
                  <Text c="dimmed">Not scored</Text>
                )}
              </Table.Td>
              <Table.Td>
                <Badge color={submission.is_scored ? 'green' : 'yellow'} variant="light">
                  {submission.is_scored ? 'Scored' : 'Pending'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="filled"
                    color="blue"
                    title="View Submission"
                    onClick={() => handleViewSubmission(submission.id)}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  {(submission.exam_type === 'speaking' || submission.exam_type === 'writing') && !submission.is_scored && (
                    <ActionIcon
                      variant="filled"
                      color="orange"
                      title="Score Submission"
                      onClick={() => handleEditSubmission(submission.id)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="md">
        <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
      </Group>

      {/* Loading state */}
      {loading && (
        <Group justify="center" mt="xl">
          <Text>Loading submissions...</Text>
        </Group>
      )}

      {/* Empty state */}
      {!loading && submissions.length === 0 && (
        <Group justify="center" mt="xl">
          <Text c="dimmed">No submissions found</Text>
        </Group>
      )}
    </Paper>
  );
};

export default SubmissionsManagement;
