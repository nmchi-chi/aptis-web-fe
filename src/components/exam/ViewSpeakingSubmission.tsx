import React, { useState, useCallback } from 'react';
import { Paper, Title, Text, Button, Stack, Box, Group, Image, Divider, Badge, Loader, Textarea, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconBulb, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import SpeakingTipChat from './SpeakingTipChat';

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

// Component để phát audio câu trả lời với controls như listening exam
function AudioPlayer({ audioPath, questionNumber }: { audioPath: string; questionNumber: number }) {
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
  ai_review?: Record<string, string>;
  transcript?: string[];
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
  const { examData, audioPaths, submittedAt, teacherComments, ai_review, transcript } = submissionData;
  
  // Speaking Tip states
  const [showSpeakingTip, setShowSpeakingTip] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [selectedImagePaths, setSelectedImagePaths] = useState<string[]>([]);
  
  // AI Review expand/collapse states
  const [expandedAIReviews, setExpandedAIReviews] = useState<Record<string, boolean>>({});

  // Tạo mapping giữa question ID và audio path
  const getAudioPathForQuestion = (questionIndex: number): string | null => {
    return audioPaths[questionIndex] || null;
  };

  // Speaking Tip handlers
  const handleSpeakingTipClick = (question: string, imagePaths: string[]) => {
    setSelectedQuestion(question);
    setSelectedImagePaths(imagePaths);
    setShowSpeakingTip(true);
  };

  const handleSpeakingTipClose = () => {
    setShowSpeakingTip(false);
    setSelectedQuestion('');
    setSelectedImagePaths([]);
  };

  const handleTipUsed = () => {
    // No limit for speaking tips
  };

  const toggleAIReview = (questionKey: string) => {
    setExpandedAIReviews(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
    }));
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
                    <Group justify="space-between" mb="sm" align="flex-start">
                      <Text size="lg" fw={500} style={{ flex: 1 }}>
                        Q{qIndex + 1}: {question.text}
                      </Text>
                      
                      {/* Speaking Tip Button */}
                      <Group gap="xs">
                        <Badge 
                          size="lg" 
                          variant="light" 
                          color="green"
                          style={{ fontSize: '14px' }}
                        >
                          Unlimited tips
                        </Badge>
                        <ActionIcon
                          size="lg"
                          variant="light"
                          color="green"
                          onClick={() => {
                            const imagePaths = [];
                            // Chỉ gửi ảnh cho câu hỏi đầu tiên của part 2 và 3
                            if ((part.part === 2 || part.part === 3) && qIndex === 0) {
                              if (part.image_url_1) imagePaths.push(part.image_url_1);
                              if (part.image_url_2) imagePaths.push(part.image_url_2);
                            }
                            handleSpeakingTipClick(question.text, imagePaths);
                          }}
                          title="Get Speaking Tip"
                        >
                          <IconBulb size={24} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    
                    {audioPath && (
                      <Group gap="sm" mb="md">
                        <AudioPlayer
                          key={`${part.part}-${qIndex}-${audioPath}`}
                          audioPath={audioPath}
                          questionNumber={qIndex + 1}
                        />
                      </Group>
                    )}

                    {/* Transcript - View Mode */}
                    {!isScoring && transcript && transcript[currentQuestionIndex] && (
                      <Paper mt="md" p="sm" radius="md" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                        <Text size="md" fw={500} c="gray.7" mb="xs">📝 Transcript:</Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', color: '#000000' }}>
                          {transcript[currentQuestionIndex]}
                        </Text>
                      </Paper>
                    )}

                    {/* AI Review - View Mode */}
                    {!isScoring && ai_review && ai_review[currentQuestionIndex.toString()] && (
                      <Paper mt="md" p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                        <Group justify="space-between" align="center" mb="xs">
                          <Text size="md" fw={500} style={{ color: '#26522b' }}>🤖 AI Review:</Text>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            onClick={() => toggleAIReview(currentQuestionIndex.toString())}
                            title={expandedAIReviews[currentQuestionIndex.toString()] ? "Collapse" : "Expand"}
                          >
                            {expandedAIReviews[currentQuestionIndex.toString()] ? (
                              <IconChevronUp size={16} />
                            ) : (
                              <IconChevronDown size={16} />
                            )}
                          </ActionIcon>
                        </Group>
                        {expandedAIReviews[currentQuestionIndex.toString()] ? (
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#418a47' }}>
                            {ai_review[currentQuestionIndex.toString()]}
                          </Text>
                        ) : (
                          <Text size="sm" style={{ color: '#418a47', lineHeight: '1.6' }}>
                            {ai_review[currentQuestionIndex.toString()].length > 200 
                              ? `${ai_review[currentQuestionIndex.toString()].substring(0, 200)}...` 
                              : ai_review[currentQuestionIndex.toString()]
                            }
                          </Text>
                        )}
                      </Paper>
                    )}

                    {/* Teacher Comment - View Mode */}
                    {!isScoring && teacherComments && teacherComments[currentQuestionIndex.toString()] && (
                      <Paper mt="md" p="md" radius="md" style={{ backgroundColor: '#fff9c4', border: '1px solid #ffc107' }}>
                        <Text size="md" fw={500} c="orange.7" mb="xs">Teacher's comments:</Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {teacherComments[currentQuestionIndex.toString()]}
                        </Text>
                      </Paper>
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
      
      {/* Speaking Tip Chat */}
      {showSpeakingTip && (
        <SpeakingTipChat
          instruction={examData?.find(p => p.part === 1)?.instruction || ''}
          question={selectedQuestion}
          imagePaths={selectedImagePaths}
          onClose={handleSpeakingTipClose}
          remainingTips={999}
          onTipUsed={handleTipUsed}
        />
      )}
    </Paper>
  );
}
