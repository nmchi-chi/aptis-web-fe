import React, { useState, useEffect } from 'react';
import { Title, Text, Stack, Box, Divider, Group, NumberInput, Textarea, Button, Paper } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { submissionService } from '../../services/submissionService';


interface ScoreWritingSubmissionProps {
  submissionId: number;
  submissionData: any; // Use any to avoid type conflicts
  currentScore: string | null;
  onScoreSubmitted: () => void;
}

const ScoreWritingSubmission: React.FC<ScoreWritingSubmissionProps> = ({
  submissionId,
  submissionData,
  currentScore,
  onScoreSubmitted
}) => {
  const navigate = useNavigate();
  const { examData, userAnswers, submittedAt, ai_review } = submissionData;
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

  const handleCommentChange = (questionKey: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [questionKey]: comment
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

  const renderAnswer = (questionKey: string, partId: number) => {
    const answer = userAnswers[questionKey] || '';

    if (!answer) {
      return (
        <Text c="dimmed" fs="italic" ml="md">
          No answer provided
        </Text>
      );
    }

    // For Part 1 (plain text), display as simple text
    if (partId === 1) {
      return (
        <Box p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <Text style={{ whiteSpace: 'pre-wrap' }}>
            {answer}
          </Text>
        </Box>
      );
    }

    // For Parts 2-4 (rich text), display HTML content
    return (
      <Box p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <div
          style={{
            minHeight: '40px',
            lineHeight: '1.5',
            fontFamily: 'inherit'
          }}
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </Box>
    );
  };

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
            <Text size="lg" fw={500} mb="xs">Score Writing Exam</Text>
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
              Save the score
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* All Parts */}
      <Stack gap="xl">
        {examData.map((part: any, partIndex: number) => (
          <Box key={part.part_id}>
            {/* Part Header */}
            <Title order={3} c="purple.7" mb="md">
              Part {part.part_id}: {part.topic}
            </Title>

            {/* Instructions */}
            <Text fw={500} c="dimmed" mb="xs">Instructions:</Text>
            <Text mb="lg" style={{ whiteSpace: 'pre-line' }}>
              {part.instruction}
            </Text>

            {/* Questions and Answers */}
            <Stack gap="lg">
              {part.questions && Array.isArray(part.questions) ? part.questions.map((question: any, qIndex: number) => {
                const questionKey = `w_p${part.part_id}_q${qIndex + 1}`;

                return (
                  <Paper key={qIndex} p="md" withBorder>
                    {/* Question */}
                    <Text fw={500} c="purple.6" mb="xs">
                      Q{qIndex + 1}: {question}
                    </Text>

                    {/* Student Answer */}
                    <Box mb="md">
                      <Text size="sm" fw={500} mb="xs">Student's Answer:</Text>
                      {renderAnswer(questionKey, part.part_id)}
                    </Box>

                    {/* Teacher Comment */}
                    <Textarea
                      label="Teacher's comments"
                      placeholder="Teacher's comments..."
                      value={comments[questionKey] || ''}
                      onChange={(event) => handleCommentChange(questionKey, event.currentTarget.value)}
                      minRows={3}
                      autosize
                      styles={{
                        label: {
                          fontSize: '16px',
                          fontWeight: 500
                        }
                      }}
                    />

                    {/* AI Review - Display only */}
                    {ai_review && ai_review[questionKey] && (
                      <Paper mt="md" p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                        <Group gap="xs" mb="xs">
                          <Text size="sm" fw={500} c="green.7">🤖 AI Review:</Text>
                        </Group>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {ai_review[questionKey]}
                        </Text>
                      </Paper>
                    )}
                  </Paper>
                );
              }) : (
                <Text c="dimmed">No questions available</Text>
              )}
            </Stack>

            {/* Divider between parts (except last) */}
            {partIndex < examData.length - 1 && (
              <Divider my="xl" />
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default ScoreWritingSubmission;
