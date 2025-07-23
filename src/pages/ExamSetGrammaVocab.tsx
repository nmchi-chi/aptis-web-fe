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
  FileInput,
  TextInput,
  NumberInput,
  Accordion,
  List,
  Box,
  Grid,
  MantineTheme,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { examSetService } from '../services/examSetService';
import { ExamSet, ExamPartDetail, Exam } from '../types/examSet';

const ExamSetGrammaVocab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [examPartCode, setExamPartCode] = useState('');
  const [titleForPart, setTitleForPart] = useState('');
  const [timeLimitMinutesForPart, setTimeLimitMinutesForPart] = useState<number | ''>(0);
  const [examPartDetail, setExamPartDetail] = useState<ExamPartDetail | null>(null);
  const [existingGVExam, setExistingGVExam] = useState<Exam | null>(null);

  const horizontalInputStyles = (theme: MantineTheme) => ({
    root: {
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    label: {
      textAlign: 'right' as const,
    },
  });

  const loadData = useCallback(async () => {
    if (!id) {
      setError('Exam Set ID is missing.');
      return;
    }
    setLoading(true);
    setExamSet(null);
    setExamPartDetail(null);
    setExamPartCode('');
    setTitleForPart('');
    setTimeLimitMinutesForPart(0);
    setError(null);
    setExistingGVExam(null);
    try {
      const examSetData = await examSetService.getById(Number(id));
      setExamSet(examSetData);
      const foundExam = examSetData.exams?.find(exam => exam.exam_type === 'g_v');
      setExistingGVExam(foundExam || null);
      if (foundExam) {
        setExamPartCode(foundExam.exam_code || '');
        setTitleForPart(foundExam.description || '');
        setTimeLimitMinutesForPart(foundExam.time_limit || 0);
        try {
          const examPartData = await examSetService.getExamPartDetail(foundExam.id);
          setExamPartDetail(examPartData);
        } catch (partError) {
          setExamPartDetail(null);
        }
      } else {
        setExamPartDetail(null);
      }
    } catch (error) {
      setError('Failed to load exam set details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async () => {
    if (!file) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select a file to upload.',
        color: 'red',
      });
      return;
    }
    if (!examSet) {
      setError('Exam Set not loaded.');
      return;
    }
    try {
      if (existingGVExam) {
        await examSetService.updateGrammaVocabExamFile(existingGVExam.id, file);
      } else {
        if (!examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0) {
          showNotification({
            title: 'Validation Error',
            message: 'Please fill in all required fields. Time limit must be greater than 0.',
            color: 'red',
          });
          return;
        }
        await examSetService.uploadGrammaVocabExamPart(examSet.id, {
          exam_part_code: examPartCode,
          title_for_part: titleForPart,
          time_limit_minutes_for_part: timeLimitMinutesForPart as number,
          file: file,
        });
      }
      setFile(null);
      await loadData();
    } catch (err) {
      showNotification({ title: 'Lỗi', message: 'Upload thất bại!', color: 'red' });
    }
  };

  const isUploadDisabled = existingGVExam
    ? !file
    : !file || !examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0;

  // Render phần detail giống reading
  const renderPart1 = (part1: any[]) => {
    if (!part1) return null;
    return (
      <Accordion>
        {part1.map((item, idx) => (
          <Accordion.Item key={idx} value={`part1-q${idx}`}>
            <Accordion.Control>Câu {idx + 1}</Accordion.Control>
            <Accordion.Panel>
              <Text fw={500} mb={8}>{item.question}</Text>
              <Stack gap={4}>
                {['A', 'B', 'C'].map((key) => {
                  const isCorrect = item.correct_answer === item[key];
                  return (
                    <Text
                      key={key}
                      fw={isCorrect ? 700 : 400}
                      c={isCorrect ? 'green' : undefined}
                    >
                      {item[key]}
                    </Text>
                  );
                })}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

  const renderPart2 = (part2: any[]) => {
    if (!part2) return null;
    return (
      <Accordion>
        {part2.map((group, idx) => (
          <Accordion.Item key={idx} value={`part2-group${group.group}`}>
            <Accordion.Control> {group.topic}</Accordion.Control>
            <Accordion.Panel>
              <List>
                {group.questions.map((q: any, qIdx: number) => (
                  <List.Item key={qIdx}>
                    <Text span>
                      {q.question}
                    </Text>
                    <Text span ml={6} c="green" fw='bold'>
                      + {q.correct_answer}
                    </Text>
                  </List.Item>
                ))}
              </List>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

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
        <Text color="red">Error: {error}</Text>
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
        <Title order={2} c="green">Exam Set G&V: {examSet?.title || 'Loading...'}</Title>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back to Exam Set Detail
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          {examSet && (
            <Paper withBorder p="md" mb="xl" style={{ height: '100%' }}>
              <Title order={3} mb="md">Exam Set Details</Title>
              <Stack gap="sm">
                <Text><strong>Set Code:</strong> {examSet.set_code}</Text>
                <Text><strong>Title:</strong> {examSet.title}</Text>
                {examSet.created_at && <Text><strong>Created At:</strong> {new Date(examSet.created_at).toLocaleString()}</Text>}
                {examSet.updated_at && <Text><strong>Last Updated:</strong> {new Date(examSet.updated_at).toLocaleString()}</Text>}
              </Stack>
            </Paper>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" mb="xl" style={{ height: '100%' }}>
            <Title order={3} mb="md">{existingGVExam ? 'Update Part File' : 'Upload New Part'}</Title>
            <Stack mb="md" gap="md">
              <TextInput
                label="Exam Part Code"
                placeholder="Enter unique code"
                value={examPartCode}
                onChange={(e) => setExamPartCode(e.target.value)}
                required
                disabled={!!existingGVExam}
                styles={horizontalInputStyles}
              />
              <TextInput
                label="Title for Part"
                placeholder="Enter title for this part"
                value={titleForPart}
                onChange={(e) => setTitleForPart(e.target.value)}
                required
                disabled={!!existingGVExam}
                styles={horizontalInputStyles}
              />
              <NumberInput
                label="Time Limit (minutes)"
                placeholder="Enter time limit"
                value={timeLimitMinutesForPart}
                onChange={(value) => setTimeLimitMinutesForPart(value as number | '')}
                required
                min={0}
                disabled={!!existingGVExam}
                styles={horizontalInputStyles}
              />
              <FileInput
                label="Upload File"
                placeholder={existingGVExam ? 'Upload a new PDF file to update' : 'Upload PDF file'}
                value={file}
                onChange={setFile}
                leftSection={<IconUpload size={16} />}
                required
                styles={horizontalInputStyles}
              />
              <Button onClick={handleFileUpload} disabled={isUploadDisabled} color="green">
                {existingGVExam ? 'Update File' : 'Upload Part'}
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
      {examPartDetail && (
        <Paper mt="xl" p="md" withBorder>
          <Title order={3} mb="md">Grammar & Vocab Content</Title>
          <Stack gap="xl">
            {examPartDetail.part1 && (
              <Box>
                <Title order={4} mb="md">Part 1</Title>
                {renderPart1(examPartDetail.part1)}
              </Box>
            )}
            {examPartDetail.part2 && (
              <Box>
                <Title order={4} mb="md">Part 2</Title>
                {renderPart2(examPartDetail.part2)}
              </Box>
            )}
          </Stack>
        </Paper>
      )}
    </Paper>
  );
}

export default ExamSetGrammaVocab; 