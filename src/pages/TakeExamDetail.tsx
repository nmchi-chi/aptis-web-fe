import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Loader, Center, Stack, Button, Text, Group } from '@mantine/core';
import { userExamService } from '../services/userExamService';

interface UserExamSetDetail {
  id: number;
  set_code: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  exams: { id: number; exam_type: string; description?: string; time_limit?: number; }[];
}

const TakeExamDetail: React.FC = () => {
  const { examSetId } = useParams<{ examSetId: string }>();
  const [examSet, setExamSet] = useState<UserExamSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userExamService.getUserExamSetDetail(Number(examSetId));
        setExamSet(res);
        if (res && Array.isArray(res.exams)) {
          const listeningExam = res.exams.find((e: any) => e.exam_type === 'listening');
          const readingExam = res.exams.find((e: any) => e.exam_type === 'reading');
          console.log('Listening time limit:', listeningExam?.time_limit);
          console.log('Reading time limit:', readingExam?.time_limit);
        }
      } catch (err) {
        setError('Không lấy được thông tin bài thi.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [examSetId]);

  useEffect(() => {
    if (examSet) {
      console.log('examSet:', examSet);
    }
  }, [examSet]);

  if (loading) {
    return <Center style={{ height: '60vh' }}><Loader /></Center>;
  }
  if (error) {
    return <Center style={{ height: '60vh' }}><Text color="red">{error}</Text></Center>;
  }
  if (!examSet) {
    return <Center style={{ height: '60vh' }}><Text>Không tìm thấy bài thi.</Text></Center>;
  }

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Title order={2} mb="lg">{examSet.title}</Title>
      <Text mb="sm">Mã: {examSet.set_code}</Text>
      <Text mb="sm">Số part: {examSet.exams.length}</Text>
      <Stack gap="md" mt="lg">
        {examSet.exams.map((exam) => (
          <Paper key={exam.id} withBorder p="md">
            <Group justify="space-between">
              <div>
                <Title order={4}>{exam.exam_type === 'listening' ? 'Listening' : exam.exam_type === 'reading' ? 'Reading' : exam.exam_type}</Title>
                <Text size="sm" c="dimmed">{exam.description}</Text>
              </div>
              <Button onClick={() => navigate(`/take-exam/${examSet.id}/${exam.exam_type}`)}>
                Làm bài
              </Button>
            </Group>
          </Paper>
        ))}
      </Stack>
      <Button mt="xl" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
    </Paper>
  );
};

export default TakeExamDetail; 