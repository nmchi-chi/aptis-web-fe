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
  Box,
  Grid,
  MantineTheme,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { examSetService } from '../services/examSetService';
import { ExamSet, CreateReadingExamPartDto, ExamPartDetail, Exam } from '../types/examSet';

const ExamSetWriting: React.FC = () => {
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
  const [existingWritingExam, setExistingWritingExam] = useState<Exam | null>(null);

  const horizontalInputStyles = (theme: MantineTheme) => ({
    root: {
      display: 'grid',
      gridTemplateColumns: '150px 1fr', // Fixed label width, flexible input width
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
    // Reset all relevant states before fetching new data
    setExamSet(null);
    setExamPartDetail(null);
    setExamPartCode('');
    setTitleForPart('');
    setTimeLimitMinutesForPart(0);
    setError(null);
    setExistingWritingExam(null);

    try {
      // 1. Fetch exam set details
      const examSetData = await examSetService.getById(Number(id));
      setExamSet(examSetData);

      // 2. Check for an existing writing exam part
      const foundExam = examSetData.exams?.find(exam => exam.exam_type === 'writing');
      setExistingWritingExam(foundExam || null);

      if (foundExam) {
        // If it exists, pre-fill form and fetch detailed content
        setExamPartCode(foundExam.exam_code || '');
        setTitleForPart(foundExam.description || '');
        setTimeLimitMinutesForPart(foundExam.time_limit || 0);

        try {
          // Use the correct exam ID to fetch details
          const examPartData = await examSetService.getExamPartDetail(foundExam.id);
          setExamPartDetail(examPartData);
        } catch (partError) {
          console.error(`Error fetching writing part content for Exam ID ${foundExam.id}:`, partError);
          setExamPartDetail(null); // Ensure it's null on error
        }
      } else {
        // If no writing exam exists, do not fetch details
        setExamPartDetail(null);
      }

    } catch (error) {
      console.error('Failed to load exam set data.', error);
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
      setError('Exam Set not loaded.'); // This should ideally not happen
      return;
    }

    try {
      if (existingWritingExam) {
        // Update existing exam part - time limit is not updated here, so no check needed
        await examSetService.updateWritingExamFile(existingWritingExam.id, file);
      } else {
        // Create new exam part
        if (!examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0) {
          showNotification({
            title: 'Validation Error',
            message: 'Please fill in all required fields. Time limit must be greater than 0.',
            color: 'red',
          });
          return;
        }
        const data: CreateReadingExamPartDto = {
          exam_part_code: examPartCode,
          title_for_part: titleForPart,
          time_limit_minutes_for_part: timeLimitMinutesForPart as number,
          file: file,
        };
        await examSetService.createWritingExamPart(examSet.id, data);
      }

      // After upload/update, reload all data to reflect changes
      loadData();
      setFile(null); // Clear file input
    } catch (err) {
      console.error('Error during file upload/update:', err);
    }
  };

  const isUploadDisabled = existingWritingExam
    ? !file
    : !file || !examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0;

  const renderWritingExamContent = () => {
    if (!examPartDetail) {
      return <Text c="dimmed">No writing content available for this exam part.</Text>;
    }

    // Check if examPartDetail is an array (writing exam format)
    if (Array.isArray(examPartDetail)) {
      return (
        <Stack gap="lg">
          {examPartDetail.map((part: any, index: number) => (
            <Paper key={part.part_id || index} withBorder p="lg" shadow="sm">
              <Title order={4} mb="md" c="purple.7">
                Part {part.part_id}: {part.topic}
              </Title>

              <Stack gap="md">
                <Box>
                  <Text fw={500} mb="sm" c="dimmed">Instructions:</Text>
                  <Text style={{ whiteSpace: 'pre-line', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px' }}>
                    {part.instruction}
                  </Text>
                </Box>

                <Box>
                  <Text fw={500} mb="sm" c="dimmed">Questions:</Text>
                  <Stack gap="sm">
                    {part.questions.map((question: string, qIndex: number) => (
                      <Text key={qIndex} style={{ whiteSpace: 'pre-line' }}>
                        <Text component="span" size="sm" fw={500} c="purple.6">
                          Q{qIndex + 1}:
                        </Text>
                        {' '}{question}
                      </Text>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      );
    }

    // Fallback for other formats
    return (
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Writing exam content (raw format):
        </Text>
        <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(examPartDetail, null, 2)}
        </pre>
      </Stack>
    );
  };

  if (loading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ height: '60vh' }}>
        <Text c="red">{error}</Text>
      </Center>
    );
  }

  if (!examSet) {
    return (
      <Center style={{ height: '60vh' }}>
        <Text>Exam set not found</Text>
      </Center>
    );
  }

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Group justify="space-between" mb="xl">
        <Title order={2} c="purple">Exam Set Writing: {examSet?.title || 'Loading...'}</Title>
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
            <Title order={3} mb="md">{existingWritingExam ? 'Update Writing Part File' : 'Upload New Writing Part'}</Title>
            <Stack mb="md" gap="md">
              <TextInput
                label="Exam Part Code"
                placeholder="Enter unique code"
                value={examPartCode}
                onChange={(e) => setExamPartCode(e.target.value)}
                required
                disabled={!!existingWritingExam}
                styles={horizontalInputStyles}
              />
              <TextInput
                label="Title for Part"
                placeholder="Enter title for this part"
                value={titleForPart}
                onChange={(e) => setTitleForPart(e.target.value)}
                required
                disabled={!!existingWritingExam}
                styles={horizontalInputStyles}
              />
              <NumberInput
                label="Time Limit (minutes)"
                placeholder="Enter time limit"
                value={timeLimitMinutesForPart}
                onChange={(value) => setTimeLimitMinutesForPart(value as number | '')}
                required
                min={0}
                disabled={!!existingWritingExam}
                styles={horizontalInputStyles}
              />
              <FileInput
                label="Upload File"
                placeholder={existingWritingExam ? 'Upload a new Excel (.xlsx) file to update' : 'Upload Excel (.xlsx) file'}
                value={file}
                onChange={setFile}
                leftSection={<IconUpload size={16} />}
                required
                styles={horizontalInputStyles}
              />
              <Button onClick={handleFileUpload} disabled={isUploadDisabled} color="purple">
                {existingWritingExam ? 'Update File' : 'Upload Writing Part'}
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {examPartDetail && (
        <Paper mt="xl" p="md" withBorder>
          <Title order={3} mb="md">Writing Content</Title>
          <Stack gap="xl">
            {renderWritingExamContent()}
          </Stack>
        </Paper>
      )}
    </Paper>
  );
};

export default ExamSetWriting;
