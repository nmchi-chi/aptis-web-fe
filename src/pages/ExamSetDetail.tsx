import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Button,
  Group,
  Loader,
  Center,
  Stack,
} from '@mantine/core';
import { examSetService } from '../services/examSetService';
import { ExamSet } from '../types/examSet';

const ExamSetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExamSet = useCallback(async () => {
    if (!id) {
      setError('Exam Set ID is missing.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await examSetService.getById(Number(id));
      setExamSet(data);
    } catch (err) {
      console.error('Error loading exam set details:', err);
      setError('Failed to load exam set details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadExamSet();
  }, [loadExamSet]);

  if (loading) {
    return (
      <Center style={{ height: 'calc(100vh - 60px)' }}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ height: 'calc(100vh - 60px)' }}>
        <Text c="red">Error: {error}</Text>
      </Center>
    );
  }

  if (!examSet) {
    return (
      <Center style={{ height: 'calc(100vh - 60px)' }}>
        <Text>Exam Set not found.</Text>
      </Center>
    );
  }

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Group justify="space-between" mb="xl">
        <Title order={2} c="indigo.7">Exam Set: {examSet.title}</Title>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back to Exam Sets
        </Button>
      </Group>

      <Stack gap="md">
        <Text><strong>Set Code:</strong> {examSet.set_code}</Text>
        <Text><strong>Title:</strong> {examSet.title}</Text>
        {examSet.created_at && <Text><strong>Created At:</strong> {new Date(examSet.created_at).toLocaleString()}</Text>}
        {examSet.updated_at && <Text><strong>Last Updated:</strong> {new Date(examSet.updated_at).toLocaleString()}</Text>}
      </Stack>

      <Group mt="xl">
        <Button color="teal" onClick={() => navigate(`/exam-sets/${examSet.id}/gramma-vocab`)}>Grammar & Vocab</Button>
        <Button color="blue" onClick={() => navigate(`/exam-sets/${examSet.id}/listening`)}>Listening</Button>
        <Button color="green" onClick={() => navigate(`/exam-sets/${examSet.id}/reading`)}>Reading</Button>
        <Button color="orange" onClick={() => navigate(`/exam-sets/${examSet.id}/speaking`)}>Speaking</Button>
        <Button color="purple" onClick={() => navigate(`/exam-sets/${examSet.id}/writing`)}>Writing</Button>
      </Group>
    </Paper>
  );
};

export default ExamSetDetail; 