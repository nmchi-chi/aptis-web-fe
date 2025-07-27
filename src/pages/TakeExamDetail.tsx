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
  exams: {
    id: number;
    exam_type: string;
    description?: string;
    time_limit?: number;
    is_submitted: boolean | string;
    submission?: {
      id: number;
      score: string;
    };
  }[];
}

const TakeExamDetail: React.FC = () => {
  const { examSetId } = useParams<{ examSetId: string }>();
  const [examSet, setExamSet] = useState<UserExamSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleViewSubmission = (exam: any) => {
    if (exam.submission?.id) {
      // Navigate to view submission page to see the submitted answers with historical exam data
      navigate(`/view-submission/${exam.submission.id}`);
    } else {
      console.log('No submission found for this exam');
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userExamService.getUserExamSetDetail(Number(examSetId));
        setExamSet(res);
      } catch (err) {
        setError('Không lấy được thông tin bài thi.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [examSetId]);


  if (loading) {
    return <Center style={{ height: '60vh' }}><Loader /></Center>;
  }
  if (error) {
    return <Center style={{ height: '60vh' }}><Text c="red">{error}</Text></Center>;
  }
  if (!examSet) {
    return <Center style={{ height: '60vh' }}><Text>Exam not found.</Text></Center>;
  }

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Title c='#326329' order={2} mb="lg">{examSet.title}</Title>
      <Text mb="sm">Code: {examSet.set_code}</Text>
      <Text mb="sm">Parts: {examSet.exams.length}</Text>
      <Text fw='bold' mb="sm" c="red">
        Lưu ý: Chỉ có thể xem lại bài làm gần nhất.
      </Text>
      <Stack gap="md" mt="lg">
        {examSet.exams.map((exam) => {
          const isSubmitted = exam.is_submitted === true || exam.is_submitted === "pending";
          const canViewSubmission = exam.submission?.id && (exam.is_submitted === true || exam.is_submitted === "pending");

          return (
            <Paper key={exam.id} withBorder p="md" style={{ background: '#e6f4ea' }}>
              <Group justify="space-between">
                <div>
                  <Title order={4} style={{ color: '#26522b' }}>
                    {exam.exam_type === 'listening' ? 'Listening' :
                      exam.exam_type === 'reading' ? 'Reading' :
                        exam.exam_type === 'speaking' ? 'Speaking' :
                          exam.exam_type === 'writing' ? 'Writing' :
                            exam.exam_type === 'g_v' ? 'Grammar & Vocab' :
                              exam.exam_type}
                  </Title>
                  <Text size="sm" c="dimmed">{exam.description}</Text>
                  <Text size="sm" c="dimmed">Thời gian: {exam.time_limit} phút</Text>
                  {isSubmitted && (
                    <Text size="xs" c="green" mt={4}>
                      {exam.is_submitted === "pending" ? "Đang chờ chấm điểm" : `Đã nộp bài • Điểm: ${exam.submission?.score || 'N/A'}`}
                    </Text>
                  )}
                </div>
                <Group gap="xs">
                  <Button onClick={() => navigate(`/take-exam/${examSet.id}/${exam.exam_type}`)}>
                    Làm bài
                  </Button>
                  {canViewSubmission && (
                    <Button
                      variant="outline"
                      onClick={() => handleViewSubmission(exam)}
                    >
                      Xem bài đã làm
                    </Button>
                  )}
                </Group>
              </Group>
            </Paper>
          );
        })}
      </Stack>
      <Button mt="xl" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
    </Paper>
  );
};

export default TakeExamDetail; 