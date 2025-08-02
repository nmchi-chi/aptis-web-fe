import React, { useState } from 'react';
import { Title, Text, Stack, Box, Divider, Badge, Group, Paper, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface WritingPart {
  part_id: number;
  topic: string;
  instruction: string;
  questions: string[];
}

interface WritingSubmissionData {
  partType: string;
  examId: number;
  examData: WritingPart[];
  userAnswers: Record<string, string>;
  submittedAt: string;
  teacherComments?: Record<string, string>;
  ai_review?: Record<string, string>;
}

interface ViewWritingSubmissionProps {
  submissionData: WritingSubmissionData;
  score: string;
}

const ViewWritingSubmission: React.FC<ViewWritingSubmissionProps> = ({
  submissionData,
  score
}) => {
  const { examData, userAnswers, submittedAt, teacherComments, ai_review } = submissionData;
  
  // AI Review expand/collapse states
  const [expandedAIReviews, setExpandedAIReviews] = useState<Record<string, boolean>>({});

  // Debug logging
  console.log('ViewWritingSubmission - submissionData:', submissionData);
  console.log('ViewWritingSubmission - examData:', examData);
  console.log('ViewWritingSubmission - userAnswers:', userAnswers);

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
          <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.3' }}>
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
            lineHeight: '1.3',
            fontFamily: 'inherit'
          }}
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </Box>
    );
  };

  const toggleAIReview = (questionKey: string) => {
    setExpandedAIReviews(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
    }));
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
      {/* Header */}
      <Group gap="md" mb="xl">
        {score && score !== '0' && score !== 'null' && score !== null ? (
          <Badge color="purple" size="lg">Score: {score}</Badge>
        ) : (
          <Badge color="yellow" size="lg">Pending Review</Badge>
        )}
        <Text size="sm" c="dimmed">
          Submitted: {new Date(submittedAt).toLocaleString()}
        </Text>
      </Group>

      {/* All Parts */}
      <Stack gap="xl">
        {examData.map((part, partIndex) => (
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
              {part.questions && Array.isArray(part.questions) ? part.questions.map((question, qIndex) => {
                const questionKey = `w_p${part.part_id}_q${qIndex + 1}`;

                return (
                  <Box key={qIndex}>
                    {/* Question */}
                    <Text fw={500} c="purple.6" mb="xs">
                      Q{qIndex + 1}: {question}
                    </Text>

                    {/* Answer */}
                    <Paper p="md" radius="md" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                      <Text size="md" fw={500} mb="md" style={{ color: '#6c757d' }}>📝 Student's Answer:</Text>
                      {renderAnswer(questionKey, part.part_id)}
                    </Paper>

                    {/* AI Review */}
                    {ai_review && ai_review[questionKey] && (
                      <Paper mt="md" p="md" radius="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                        <Group justify="space-between" align="center" mb="md">
                          <Text size="md" fw={500} style={{ color: '#26522b' }}>🤖 AI Review:</Text>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            onClick={() => toggleAIReview(questionKey)}
                            title={expandedAIReviews[questionKey] ? "Collapse" : "Expand"}
                          >
                            {expandedAIReviews[questionKey] ? (
                              <IconChevronUp size={16} />
                            ) : (
                              <IconChevronDown size={16} />
                            )}
                          </ActionIcon>
                        </Group>
                        {expandedAIReviews[questionKey] ? (
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#418a47' }}>
                            {ai_review[questionKey]}
                          </Text>
                        ) : (
                          <Text size="sm" style={{ color: '#418a47', lineHeight: '1.6' }}>
                            {ai_review[questionKey].length > 200 
                              ? `${ai_review[questionKey].substring(0, 200)}...` 
                              : ai_review[questionKey]
                            }
                          </Text>
                        )}
                      </Paper>
                    )}

                    {/* Teacher Comment */}
                    {teacherComments && teacherComments[questionKey] && (
                      <Paper mt="lg" p="md" radius="md" style={{ backgroundColor: '#fff9c4', border: '1px solid #ffc107' }}>
                        <Text size="md" fw={500} c="orange.7" mb="md">Teacher's comments:</Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {teacherComments[questionKey]}
                        </Text>
                      </Paper>
                    )}
                  </Box>
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

export default ViewWritingSubmission;
