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
  const [submissions, setSubmissions] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userExamService.getUserExamSetDetail(Number(examSetId));
        setExamSet(res);

        // Load submissions for each exam
        const submissionData: any = {};
        for (const exam of res.exams) {
          try {
            const examSubmissions = await userExamService.getUserSubmissions(exam.id);
            if (examSubmissions && examSubmissions.length > 0) {
              // Get the latest submission
              submissionData[exam.id] = examSubmissions[examSubmissions.length - 1];
            }
          } catch (err) {
            // No submissions found for this exam, continue
            console.log(`No submissions found for exam ${exam.id}`);
          }
        }
        setSubmissions(submissionData);
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
    return <Center style={{ height: '60vh' }}><Text>Không tìm thấy bài thi.</Text></Center>;
  }

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Title order={2} mb="lg">{examSet.title}</Title>
      <Text mb="sm">Mã: {examSet.set_code}</Text>
      <Text mb="sm">Số part: {examSet.exams.length}</Text>
      <Stack gap="md" mt="lg">
        {examSet.exams.map((exam) => {
          const hasSubmission = submissions[exam.id];
          return (
            <Paper key={exam.id} withBorder p="md">
              <Group justify="space-between">
                <div>
                  <Title order={4}>{exam.exam_type === 'listening' ? 'Listening' : exam.exam_type === 'reading' ? 'Reading' : exam.exam_type}</Title>
                  <Text size="sm" c="dimmed">{exam.description}</Text>
                  {hasSubmission && (
                    <Text size="xs" c="green" mt={4}>
                      Đã nộp bài • Điểm: {hasSubmission.score}
                    </Text>
                  )}
                </div>
                <Group gap="xs">
                  <Button onClick={() => navigate(`/take-exam/${examSet.id}/${exam.exam_type}`)}>
                    Làm bài
                  </Button>
                  {hasSubmission && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/view-submission/${hasSubmission.id}`)}
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