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
import { ExamSet, CreateReadingExamPartDto, ExamPartDetail, Exam } from '../types/examSet';

const ExamSetReading: React.FC = () => {
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
  const [existingReadingExam, setExistingReadingExam] = useState<Exam | null>(null);

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
    setExistingReadingExam(null);

    try {
      // 1. Fetch exam set details
      const examSetData = await examSetService.getById(Number(id));
      setExamSet(examSetData);

      // 2. Check for an existing reading exam part
      const foundExam = examSetData.exams?.find(exam => exam.exam_type === 'reading');
      setExistingReadingExam(foundExam || null);

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
          console.error(`Error fetching reading part content for Exam ID ${foundExam.id}:`, partError);
          setExamPartDetail(null); // Ensure it's null on error
        }
      } else {
        // If no reading exam exists, do not fetch details
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
      if (existingReadingExam) {
        // Update existing exam part - time limit is not updated here, so no check needed
        await examSetService.updateReadingExamFile(existingReadingExam.id, file);
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
        await examSetService.uploadReadingExamPart(examSet.id, data);
      }
      
      // After upload/update, reload all data to reflect changes
      loadData();
      setFile(null); // Clear file input
    } catch (err) {
      console.error('Error during file upload/update:', err);
    }
  };

  const isUploadDisabled = existingReadingExam 
    ? !file 
    : !file || !examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0;

  const renderPart1 = (part1: ExamPartDetail['part1']) => {
    if (!part1) return null;
    return (
      <Accordion>
        {part1.map((group, index) => (
          <Accordion.Item key={index} value={`group-${index}`}>
            <Accordion.Control>Group {group.group}</Accordion.Control>
            <Accordion.Panel>
              <List>
                {group.questions.map((question, qIndex) => (
                  <div key={qIndex}>
                    <List.Item>
                      <Text fw={500}>{question.sentence}</Text>
                      {question.options ? (
                        <div>
                          {question.options.map((opt, i) => {
                            const isCorrect = opt.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
                            return (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: 4,
                                  borderRadius: 4,
                                  padding: '2px 8px'
                                }}
                              >
                                <span style={{ color: isCorrect ? 'green' : undefined, fontWeight: isCorrect ? 'bold' : undefined }}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Text size="sm" c="green">Correct answer: {question.correct_answer}</Text>
                      )}
                    </List.Item>

                    {/* Explain cho Part 1 */}
                    {(question as any).explain && (
                      <Box mb="md" mt="md" style={{ width: '100%', marginLeft: '-16px', marginRight: '-16px' }}>
                        <Paper p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e', width: '100%' }}>
                          <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={8}>
                            Explain:
                          </Text>
                          <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.6', wordBreak: 'break-word' }}>
                            {(question as any).explain}
                          </Text>
                        </Paper>
                      </Box>
                    )}
                  </div>
                ))}
              </List>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

  const renderPart2 = (part2: ExamPartDetail['part2']) => {
    if (!part2) return null; 
    return (
      <Accordion>
        {part2.map((topic, index) => (
          <Accordion.Item key={index} value={`topic-${index}`}>
            <Accordion.Control>{topic.topic}</Accordion.Control>
            <Accordion.Panel>
              <List>
                {topic.sentences.map((sentence, sIndex) => (
                  <List.Item key={sIndex}>
                    <Text fw={500}>
                      {sentence.text}
                      {typeof sentence.key === 'number' && (
                        <span style={{ marginLeft: 8, color: '#888' }}>({Math.trunc(sentence.key)})</span>
                      )}
                    </Text>
                    {sentence.is_example_first && (
                      <Text size="sm" c="green">(Example)</Text>
                    )}
                  </List.Item>
                ))}
              </List>

              {/* Explain cho Part 2 */}
              {(topic as any).explain && (
                <Box mb="md" mt="md" style={{ width: '100%', marginLeft: '-16px', marginRight: '-16px' }}>
                  <Paper p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e', width: '100%' }}>
                    <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={8}>
                      Explain:
                    </Text>
                    <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.6', wordBreak: 'break-word' }}>
                      {(topic as any).explain}
                    </Text>
                  </Paper>
                </Box>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

  const renderPart3 = (part3: ExamPartDetail['part3']) => {
    if (!part3) return null;
    return (
      <Accordion>
        {part3.map((group, index) => (
          <Accordion.Item key={index} value={`part3-${index}`}>
            <Accordion.Control>{group.topic}</Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <Box>
                  <Text fw={500}>Person A:</Text>
                  <Text>{group.person_A}</Text>
                </Box>
                <Box>
                  <Text fw={500}>Person B:</Text>
                  <Text>{group.person_B}</Text>
                </Box>
                <Box>
                  <Text fw={500}>Person C:</Text>
                  <Text>{group.person_C}</Text>
                </Box>
                <Box>
                  <Text fw={500}>Person D:</Text>
                  <Text>{group.person_D}</Text>
                </Box>
                <Box>
                  <Text fw={500}>Questions:</Text>
                  <List>
                    {group.questions.map((question, qIndex) => (
                      <div key={qIndex}>
                        <List.Item>
                          <Text>{question.text}</Text>
                          <Text size="sm" c="green">Correct answer: {question.correct_answer}</Text>
                        </List.Item>
                        
                        {/* Explain cho từng question trong Part 3 */}
                        {(question as any).explain && (
                          <Box mb="md" mt="md" style={{ width: '100%', marginLeft: '-16px', marginRight: '-16px' }}>
                            <Paper p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e', width: '100%' }}>
                              <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={8}>
                                Explain:
                              </Text>
                              <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.6', wordBreak: 'break-word' }}>
                                {(question as any).explain}
                              </Text>
                            </Paper>
                          </Box>
                        )}
                      </div>
                    ))}
                  </List>
                </Box>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

  const renderPart4 = (part4: ExamPartDetail['part4']) => {
    if (!part4) return null;
    return (
      <Accordion>
        {part4.map((group, index) => (
          <Accordion.Item key={index} value={`part4-${index}`}>
            <Accordion.Control>{group.topic}</Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <Box>
                  <Text fw={500}>Options:</Text>
                  <List>
                    {group.options.map((option, oIndex) => (
                      <List.Item key={oIndex}>{option}</List.Item>
                    ))}
                  </List>
                </Box>
                <Box>
                  <Text fw={500}>Questions:</Text>
                  <List>
                    {group.questions.map((question, qIndex) => (
                      <div key={qIndex}>
                        <List.Item>
                          <Text>{question.text}</Text>
                          {typeof question.correct_answer === 'number' && Array.isArray(group.options) ? (
                            <span style={{ color: 'green', fontWeight: 'bold', marginLeft: 8 }}>
                              Đáp án: {group.options[question.correct_answer]}
                            </span>
                          ) : (
                            <Text size="sm" c="green">Correct answer: {question.correct_answer}</Text>
                          )}
                        </List.Item>
                        
                        {/* Explain cho từng question trong Part 4 */}
                        {(question as any).explain && (
                          <Box mb="md" mt="md" style={{ width: '100%', marginLeft: '-16px', marginRight: '-16px' }}>
                            <Paper p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e', width: '100%' }}>
                              <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={8}>
                                Explain:
                              </Text>
                              <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.6', wordBreak: 'break-word' }}>
                                {(question as any).explain}
                              </Text>
                            </Paper>
                          </Box>
                        )}
                      </div>
                    ))}
                  </List>
                </Box>
              </Stack>
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
        <Title order={2} c="green">Exam Set Reading: {examSet?.title || 'Loading...'}</Title>
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
            <Title order={3} mb="md">{existingReadingExam ? 'Update Reading Part File' : 'Upload New Reading Part'}</Title>
            <Stack mb="md" gap="md">
              <TextInput
                label="Exam Part Code"
                placeholder="Enter unique code"
                value={examPartCode}
                onChange={(e) => setExamPartCode(e.target.value)}
                required
                disabled={!!existingReadingExam}
                styles={horizontalInputStyles}
              />
              <TextInput
                label="Title for Part"
                placeholder="Enter title for this part"
                value={titleForPart}
                onChange={(e) => setTitleForPart(e.target.value)}
                required
                disabled={!!existingReadingExam}
                styles={horizontalInputStyles}
              />
              <NumberInput size='md'
                label="Time Limit (m)"
                placeholder="Enter time limit"
                value={timeLimitMinutesForPart}
                onChange={(value) => setTimeLimitMinutesForPart(value as number | '')}
                required
                min={0}
                disabled={!!existingReadingExam}
                styles={horizontalInputStyles}
              />
              <FileInput size='md'
                label="Upload File"
                placeholder={existingReadingExam ? 'Upload a new PDF file to update' : 'Upload PDF file'}
                value={file}
                onChange={setFile}
                leftSection={<IconUpload size={16} />}
                required
                styles={horizontalInputStyles}
              />
              <Button onClick={handleFileUpload} disabled={isUploadDisabled} color="green">
                {existingReadingExam ? 'Update File' : 'Upload Reading Part'}
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
      
      {examPartDetail && (
        <Paper mt="xl" p="md" withBorder>
          <Title order={3} mb="md">Reading Content</Title>
          <Stack gap="xl">
            {(examPartDetail.part1 || examPartDetail.part2 || examPartDetail.part3 || examPartDetail.part4) ? (
              <>
                {examPartDetail.part1 && (
                  <Box>
                    <Title order={4} mb="md">Part 1: Word Choice</Title>
                    {renderPart1(examPartDetail.part1)}
                  </Box>
                )}
                {examPartDetail.part2 && (
                  <Box>
                    <Title order={4} mb="md">Part 2: Text Cohesion</Title>
                    {renderPart2(examPartDetail.part2)}
                  </Box>
                )}
                {examPartDetail.part3 && (
                  <Box>
                    <Title order={4} mb="md">Part 3: Opinion Matching</Title>
                    {renderPart3(examPartDetail.part3)}
                  </Box>
                )}
                {examPartDetail.part4 && (
                  <Box mt="xl">
                    <Title order={4} mb="md">Part 4: Long Text</Title>
                    {renderPart4(examPartDetail.part4)}
                  </Box>
                )}
              </>
            ) : (
              <Text>No reading content available for this exam part.</Text>
            )}
          </Stack>
        </Paper>
      )}
    </Paper>
  );
};

export default ExamSetReading; 