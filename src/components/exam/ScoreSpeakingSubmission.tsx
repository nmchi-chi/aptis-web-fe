import React, { useState, useEffect, useCallback } from 'react';
import { Title, Text, Stack, Box, Group, NumberInput, Textarea, Button, Paper, Image, Loader, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { submissionService } from '../../services/submissionService';
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

// AudioPlayer component with controls like listening exam
interface AudioPlayerProps {
  audioPath: string;
  questionNumber: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioPath, questionNumber }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handlePlay = useCallback(async () => {
    if (hasLoaded) return; // Prevent multiple loads

    setLoading(true);
    try {
      const response = await userExamService.getUserExamAudio({ audio_path: audioPath });

      let base64;
      if (typeof response === 'string') {
        base64 = response;
      } else if (response && response.audio && response.audio.audio) {
        // Handle nested audio structure: response.audio.audio
        base64 = response.audio.audio;
      } else if (response && response.audio) {
        base64 = response.audio;
      } else if (response && response.base64) {
        base64 = response.base64;
      } else {
        console.error('Unexpected audio response format:', response);
        return;
      }

      if (!base64) {
        console.error('No base64 data found');
        return;
      }

      // Validate base64 data
      if (base64.length < 100) {
        console.error('Base64 data too short, likely corrupted');
        return;
      }

      // Try different audio formats
      const audioUrl = `data:audio/mp3;base64,${base64}`;
      console.log('Setting audio URL for question', questionNumber, 'length:', base64.length);
      setAudioUrl(audioUrl);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setLoading(false);
    }
  }, [audioPath, hasLoaded, questionNumber]);



  console.log(`AudioPlayer render - Question ${questionNumber}:`, {
    audioUrl: audioUrl ? 'SET' : 'NOT SET',
    loading,
    audioUrlLength: audioUrl?.length
  });

  return (
    <div style={{ marginBottom: 8 }}>
      {!audioUrl && (
        <Button
          size="sm"
          onClick={handlePlay}
          loading={loading}
          mb={4}
          leftSection={<IconPlayerPlay size={16} />}
          variant="outline"
        >
          {loading ? 'Loading...' : `Play Answer ${questionNumber}`}
        </Button>
      )}
      {audioUrl && (
        <div>
          <audio
            controlsList="nodownload noplaybackrate"
            onContextMenu={e => e.preventDefault()}
            autoPlay
            src={audioUrl}
            controls
            preload="metadata"
          />
        </div>
      )}
    </div>
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
  
  // AI Review expand/collapse states
  const [expandedAIReviews, setExpandedAIReviews] = useState<Record<string, boolean>>({});

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

  const toggleAIReview = (questionKey: string) => {
    setExpandedAIReviews(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
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

                      {/* Transcript Display */}
                      {submissionData.transcript && submissionData.transcript[parseInt(commentKey)] && (
                        <Paper mt="md" p="sm" radius="md" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                          <Text fw={600} size="md" style={{ color: '#6c757d' }} mb={4}>
                            📝 Transcript:
                          </Text>
                          <Text size="sm" style={{ color: '#000000', whiteSpace: 'pre-line', lineHeight: '1.6', wordBreak: 'break-word' }}>
                            {submissionData.transcript[parseInt(commentKey)]}
                          </Text>
                        </Paper>
                      )}

                      {/* AI Review Display */}
                      {submissionData.ai_review && submissionData.ai_review[commentKey] && (
                        <Paper mt="md" p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                          <Group justify="space-between" align="center" mb="md">
                            <Text size="md" fw={500} style={{ color: '#26522b' }}>🤖 AI Review:</Text>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="green"
                              onClick={() => toggleAIReview(commentKey)}
                              title={expandedAIReviews[commentKey] ? "Collapse" : "Expand"}
                            >
                              {expandedAIReviews[commentKey] ? (
                                <IconChevronUp size={16} />
                              ) : (
                                <IconChevronDown size={16} />
                              )}
                            </ActionIcon>
                          </Group>
                          {expandedAIReviews[commentKey] ? (
                            <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.6', wordBreak: 'break-word' }}>
                              {submissionData.ai_review[commentKey]}
                            </Text>
                          ) : (
                            <Text size="sm" style={{ color: '#418a47', lineHeight: '1.6' }}>
                              {submissionData.ai_review[commentKey].length > 200 
                                ? `${submissionData.ai_review[commentKey].substring(0, 200)}...` 
                                : submissionData.ai_review[commentKey]
                              }
                            </Text>
                          )}
                        </Paper>
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
                        styles={{
                          label: {
                            fontSize: '16px',
                            fontWeight: 500
                          }
                        }}
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
