import React, { useState, useEffect, useCallback } from 'react';
import { Title, Text, Stack, Box, Group, NumberInput, Textarea, Button, Paper, Loader } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { submissionService } from '../../services/submissionService';
import { userExamService } from '../../services/userExamService';

// AudioPlayer component
interface AudioPlayerProps {
  audioPath: string;
  questionNumber: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioPath, questionNumber }) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const playAudio = useCallback(async () => {
    if (audio && !audio.paused) {
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
};

interface ScoreSpeakingSubmissionProps {
  submissionId: number;
  submissionData: any; // Use any for now to avoid type conflicts
  currentScore: string | null;
  onScoreSubmitted: () => void;
}

const ScoreSpeakingSubmission: React.FC<ScoreSpeakingSubmissionProps> = ({
  submissionId,
  submissionData,
  currentScore,
  onScoreSubmitted
}) => {
  const navigate = useNavigate();
  const { examData, audioPaths, submittedAt } = submissionData;

  // Debug logging
  console.log('ScoreSpeakingSubmission - submissionData:', submissionData);
  console.log('ScoreSpeakingSubmission - audioPaths:', audioPaths);
  console.log('ScoreSpeakingSubmission - examData:', examData);
  const [score, setScore] = useState<number>(0);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize score and comments from existing data
  useEffect(() => {
    if (currentScore && currentScore !== 'null' && currentScore !== null) {
      const scoreMatch = currentScore.match(/(\d+)/);
      if (scoreMatch) {
        setScore(parseInt(scoreMatch[1]));
      }
    }
    
    // Load existing teacher comments if any
    if (submissionData.teacherComments) {
      setComments(submissionData.teacherComments);
    }
  }, [currentScore, submissionData.teacherComments]);

  // Audio will be loaded individually by AudioPlayer components

  const handleCommentChange = (questionIndex: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [questionIndex]: comment
    }));
  };

  const handleSubmitScore = async () => {
    if (score < 0 || score > 50) {
      showNotification({
        title: 'Error',
        message: 'Score must be between 0 and 50',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare updated submission data with teacher comments
      const updatedSubmissionData = {
        ...submissionData,
        teacherComments: comments
      };

      await submissionService.scoreSubmission(submissionId, {
        score: `${score}/50`,
        json_data: updatedSubmissionData
      });

      showNotification({
        title: 'Success',
        message: 'Score and comments saved successfully',
        color: 'green'
      });

      onScoreSubmitted();

      // Navigate back to submissions management after successful save
      setTimeout(() => {
        navigate('/submissions-management');
      }, 500);
    } catch (error) {
      console.error('Error submitting score:', error);
      showNotification({
        title: 'Error',
        message: 'An error occurred while saving score',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  // Audio URLs will be handled by individual AudioPlayer components

  // Safety check for examData
  if (!examData || !Array.isArray(examData)) {
    return (
      <Box mb='lg'>
        <Text c="red">Error: Invalid exam data</Text>
      </Box>
    );
  }

  return (
    <Box mb='lg'>
      {/* Scoring Header */}
      <Paper p="md" mb="xl" withBorder>
        <Group justify="space-between" align="center">
          <div>
            <Text size="lg" fw={500} mb="xs">Score Speaking Exam</Text>
            <Text size="sm" c="dimmed">
              Submitted: {new Date(submittedAt).toLocaleString()}
            </Text>
          </div>
          <Group>
            <NumberInput mb='lg'
              label="Score"
              placeholder="0-50"
              value={score}
              onChange={(value) => setScore(Number(value) || 0)}
              min={0}
              max={50}
              style={{ width: 100 }}
              maxLength={2}
            />
            <Button mt='xs'
              onClick={handleSubmitScore}
              loading={loading}
              disabled={loading}
            >
              Save Score
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* All Parts */}
      <Stack gap="xl">
        {examData.map((part: any, partIndex: number) => {
          let questionIndex = 0;
          // Calculate starting question index for this part
          for (let i = 0; i < partIndex; i++) {
            questionIndex += examData[i].question?.length || 0;
          }

          return (
            <Box key={partIndex}>
              {/* Part Header */}
              <Title order={3} c="orange.7" mb="md">
                Part {part.part}: {part.topic}
              </Title>

              {/* Instructions */}
              <Text fw={500} c="dimmed" mb="xs">Instructions:</Text>
              <Text mb="lg" style={{ whiteSpace: 'pre-line' }}>
                {part.instruction}
              </Text>

              {/* Questions and Answers */}
              <Stack gap="lg">
                {part.question?.map((question: any, qIndex: number) => {
                  const commentKey = (questionIndex + qIndex).toString();
                  const audioPath = audioPaths?.[questionIndex + qIndex];

                  return (
                    <Box key={qIndex}>
                      {/* Question */}
                      <Text fw={500} c="orange.6" mb="xs">
                        Q{qIndex + 1}: {question.text}
                      </Text>

                      {/* Audio Player */}
                      {audioPath && (
                        <Group gap="sm" mb="md">
                          <AudioPlayer
                            audioPath={audioPath}
                            questionNumber={qIndex + 1}
                          />
                        </Group>
                      )}

                      {/* Teacher Comment Input */}
                      <Textarea
                        label="Teacher's comments"
                        placeholder="Teacher's comments..."
                        value={comments[commentKey] || ''}
                        onChange={(event) => handleCommentChange(commentKey, event.currentTarget.value)}
                        minRows={2}
                        autosize
                        mt="md"
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ScoreSpeakingSubmission;
