import React, { useState, useCallback } from 'react';
import { Paper, Title, Text, Button, Stack, Box, Group, Image, Divider, Badge, Loader, Textarea } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';

import { userExamService } from '../../services/userExamService';

// Component hiển thị ảnh từ image_url
function ImageViewer({ imagePath, alt }: { imagePath: string; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadImage = useCallback(async () => {
    setLoading(true);
    try {
      // Use API for server paths
      const response = await userExamService.getUserExamAudio({ audio_path: imagePath });

      let base64;
      if (typeof response === 'string') {
        base64 = response;
      } else if (response && response.base64) {
        base64 = response.base64;
      } else if (response && response.audio) {
        base64 = response.audio;
      } else {
        console.error('Unexpected image response format');
        return;
      }

      if (base64) {
        setImageUrl(`data:image/jpeg;base64,${base64}`);
      }
    } catch (error) {
      console.error('Error loading image:', error);
    } finally {
      setLoading(false);
    }
  }, [imagePath]);

  React.useEffect(() => {
    if (imagePath) {
      handleLoadImage();
    }
  }, [imagePath, handleLoadImage]);

  if (loading) {
    return <Loader size="sm" />;
  }

  if (!imageUrl) {
    return <Text size="sm" c="dimmed">No image available</Text>;
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      style={{ maxWidth: '40%', height: 'auto' }}
      radius="md"
    />
  );
}

// Component để phát audio câu trả lời
function AudioPlayer({ audioPath, questionNumber }: { audioPath: string; questionNumber: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playAudio = useCallback(async () => {
    if (audio && !audio.paused) {
      // Đang phát, dừng lại
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`Playing answer audio: ${audioPath}`);
      const response = await userExamService.getUserExamAudio({ audio_path: audioPath });

      let base64;
      if (typeof response === 'string') {
        base64 = response;
      } else if (response && response.base64) {
        base64 = response.base64;
      } else if (response && response.audio) {
        base64 = response.audio;
      } else {
        console.error('Unexpected audio response format');
        return;
      }

      const audioUrl = `data:audio/mpeg;base64,${base64}`;
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => {
        setIsPlaying(false);
      };

      newAudio.onerror = () => {
        console.error('Error playing audio');
        setIsPlaying(false);
      };

      setAudio(newAudio);
      await newAudio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setLoading(false);
    }
  }, [audioPath, audio]);

  return (
    <Button
      variant="outline"
      size="sm"
      leftSection={loading ? <Loader size={16} /> : (isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />)}
      onClick={playAudio}
      disabled={loading}
    >
      {loading ? 'Loading...' : (isPlaying ? 'Pause' : `Play Answer ${questionNumber}`)}
    </Button>
  );
}

interface SpeakingQuestion {
  id: number;
  text: string;
  audio: string | null;
}

interface SpeakingPart {
  part: number;
  topic: string;
  instruction: string;
  instruction_audio: string[];
  question: SpeakingQuestion[];
  image_url_1: string | null;
  image_url_2: string | null;
}

interface SpeakingSubmissionData {
  audioPaths: string[];
  partType: string;
  examId: number;
  examData: SpeakingPart[];
  submittedAt: string;
  teacherComments?: Record<string, string>;
}

interface ViewSpeakingSubmissionProps {
  submissionData: SpeakingSubmissionData;
  score: string;
  isScoring?: boolean;
  comments?: Record<string, string>;
  onCommentChange?: (questionIndex: string, comment: string) => void;
}

export default function ViewSpeakingSubmission({
  submissionData,
  score,
  isScoring = false,
  comments = {},
  onCommentChange
}: ViewSpeakingSubmissionProps) {
  const { examData, audioPaths, submittedAt, teacherComments } = submissionData;

  // Tạo mapping giữa question ID và audio path
  const getAudioPathForQuestion = (questionIndex: number): string | null => {
    return audioPaths[questionIndex] || null;
  };

  let questionIndex = 0;

  return (
    <Paper p="xl" shadow="sm">
      <Stack gap="lg">
        <Box>
          <Title order={2} mb="md">Speaking Test Submission Review</Title>
          <Group gap="md" mb="lg">
            {score && score !== '0' && score !== 'null' && score !== null ? (
              <Badge color="orange" size="lg">Score: {score}</Badge>
            ) : (
              <Badge color="yellow" size="lg">Pending Review</Badge>
            )}
            <Text size="sm" c="dimmed">
              Submitted: {new Date(submittedAt).toLocaleString()}
            </Text>
          </Group>
        </Box>

        {examData?.map((part) => (
          <Paper key={part.part} p="lg" withBorder>
            <Stack gap="md">
              <Box>
                <Title order={3} c="blue" mb="sm">
                  Part {part.part}: {part.topic}
                </Title>
                <Text style={{ whiteSpace: 'pre-line' }} mb="lg">
                  {part.instruction}
                </Text>
              </Box>

              {/* Images for this part */}
              {(part.image_url_1 || part.image_url_2) && (
                <Group justify="center" gap="lg" mb="lg">
                  {part.image_url_1 && (
                    <ImageViewer imagePath={part.image_url_1} alt={`Part ${part.part} Image 1`} />
                  )}
                  {part.image_url_2 && (
                    <ImageViewer imagePath={part.image_url_2} alt={`Part ${part.part} Image 2`} />
                  )}
                </Group>
              )}

              {/* Questions and answers */}
              {part?.question?.map((question, qIndex) => {
                const currentQuestionIndex = questionIndex++;
                const audioPath = getAudioPathForQuestion(currentQuestionIndex);
                
                return (
                  <Box key={question.id}>
                    <Text size="lg" fw={500} mb="sm">
                      Q{qIndex + 1}: {question.text}
                    </Text>
                    
                    {audioPath && (
                      <Group gap="sm" mb="md">
                        <AudioPlayer
                          audioPath={audioPath}
                          questionNumber={qIndex + 1}
                        />
                        <Text size="sm" c="dimmed">
                          Your recorded answer
                        </Text>
                      </Group>
                    )}

                    {/* Teacher Comment - View Mode */}
                    {!isScoring && teacherComments && teacherComments[currentQuestionIndex.toString()] && (
                      <Box mt="md" p="md" style={{ backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                        <Text size="sm" fw={500} c="orange.7" mb="xs">Teacher's comments:</Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {teacherComments[currentQuestionIndex.toString()]}
                        </Text>
                      </Box>
                    )}

                    {/* Teacher Comment - Scoring Mode */}
                    {isScoring && onCommentChange && (
                      <Box mt="md">
                        <Textarea
                          label="Teacher's comments"
                          placeholder="Teacher's comments..."
                          value={comments[currentQuestionIndex.toString()] || ''}
                          onChange={(event) => onCommentChange(currentQuestionIndex.toString(), event.currentTarget.value)}
                          minRows={3}
                          autosize
                        />
                      </Box>
                    )}

                    {qIndex < part.question.length - 1 && <Divider my="md" />}
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}
