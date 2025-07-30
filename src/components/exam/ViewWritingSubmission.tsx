import React from 'react';
import { Title, Text, Stack, Box, Divider, Badge, Group, Paper } from '@mantine/core';

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
                    {renderAnswer(questionKey, part.part_id)}

                    {/* Teacher Comment */}
                    {teacherComments && teacherComments[questionKey] && (
                      <Paper mt="md" p="md" radius="md" style={{ backgroundColor: '#fff9c4', border: '1px solid #ffc107' }}>
                        <Text size="md" fw={500} c="orange.7" mb="xs">Teacher's comments:</Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {teacherComments[questionKey]}
                        </Text>
                      </Paper>
                    )}

                    {/* AI Review */}
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
