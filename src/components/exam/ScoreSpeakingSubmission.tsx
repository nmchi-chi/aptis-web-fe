import React, { useState, useEffect } from 'react';
import { Title, Text, Stack, Box, Divider, Group, NumberInput, Textarea, Button, Paper } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { submissionService } from '../../services/submissionService';
import ViewSpeakingSubmission from './ViewSpeakingSubmission';

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
            <NumberInput mt='xs'
              label="Score"
              placeholder="0-50"
              value={score}
              onChange={(value) => setScore(Number(value) || 0)}
              min={0}
              max={50}
              maxLength={2}
              style={{ width: 100 }}
            />
            <Button
              onClick={handleSubmitScore}
              loading={loading}
              disabled={loading}
            >
              Save the score
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Reuse ViewSpeakingSubmission component */}
      <ViewSpeakingSubmission
        submissionData={submissionData}
        score={score.toString()}
      />

      {/* Teacher Comments Section */}
      <Paper p="md" mt="xl" withBorder>
        <Title order={4} mb="md" c="orange.7">Teacher Comments</Title>
        <Stack gap="md">
          {examData.map((part: any, partIndex: number) => {
            let questionIndex = 0;
            // Calculate starting question index for this part
            for (let i = 0; i < partIndex; i++) {
              questionIndex += examData[i].questions?.length || 0;
            }

            return (
              <Box key={part.part_id || partIndex}>
                <Text fw={500} mb="sm">Part {part.part_id || partIndex + 1}</Text>
                <Stack gap="sm">
                  {part.questions && Array.isArray(part.questions) ? part.questions.map((question: any, qIndex: number) => {
                    const currentQuestionIndex = questionIndex + qIndex;
                    const commentKey = currentQuestionIndex.toString();

                    return (
                      <Textarea
                        key={qIndex}
                        label={`Q${qIndex + 1}: ${question.text ? question.text.substring(0, 50) + '...' : 'Question ' + (qIndex + 1)}`}
                        placeholder="Enter comments for this answer..."
                        value={comments[commentKey] || ''}
                        onChange={(event) => handleCommentChange(commentKey, event.currentTarget.value)}
                        minRows={2}
                        autosize
                      />
                    );
                  }) : null}
                </Stack>
                {partIndex < examData.length - 1 && <Divider my="md" />}
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ScoreSpeakingSubmission;
