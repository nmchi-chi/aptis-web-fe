import React, { useState } from 'react';
import { Paper, Title, Text, Button, Stack, Group, Box, Progress, TextInput } from '@mantine/core';
import WritingRichTextEditor from './WritingRichTextEditor';

interface WritingPart {
  part_id: number;
  topic: string;
  instruction: string;
  questions: string[];
}

interface TakeWritingExamProps {
  exam: WritingPart[];
  userAnswers: any;
  submitted: boolean;
  onAnswerChange: (key: string, value: string) => void;
}

const TakeWritingExam: React.FC<TakeWritingExamProps> = ({
  exam,
  userAnswers,
  submitted,
  onAnswerChange
}) => {
  console.log('TakeWritingExam component rendered');
  console.log('Props:', { exam, userAnswers, submitted });

  const [currentPart, setCurrentPart] = useState(1);

  // Get current part data
  const currentPartData = exam?.find(part => part.part_id === currentPart);



  const handleNext = () => {
    if (currentPart < 4) {
      setCurrentPart(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPart > 1) {
      setCurrentPart(prev => prev - 1);
    }
  };

  const renderPartContent = () => {
    console.log('renderPartContent - currentPart:', currentPart);
    console.log('renderPartContent - currentPartData:', currentPartData);
    console.log('renderPartContent - exam:', exam);

    if (!currentPartData) {
      return (
        <Paper withBorder p="lg">
          <Text c="red">Part {currentPart} data not found</Text>
          <Text size="sm" c="dimmed" mt="md">Available parts:</Text>
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(exam?.map((p: any) => ({ part_id: p.part_id, topic: p.topic })), null, 2)}
          </pre>
        </Paper>
      );
    }

    return (
      <Stack gap="lg">
        {/* Part Header */}
        <Box>
          <Title order={3} c="purple.7" mb="md">
            Part {currentPartData.part_id}: {currentPartData.topic}
          </Title>
          
          {/* Progress indicator */}
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed">
              Part {currentPart} of 4
            </Text>
            <Progress value={(currentPart / 4) * 100} size="sm" style={{ width: 200 }} />
          </Group>
        </Box>

        {/* Instructions */}
        <Paper withBorder p="md" style={{ backgroundColor: '#f8f9fa' }}>
          <Text fw={500} mb="sm">Instructions:</Text>
          <Text style={{ whiteSpace: 'pre-line' }}>
            {currentPartData.instruction}
          </Text>
        </Paper>

        {/* Questions */}
        <Paper withBorder p="md">
          <Text fw={500} mb="md">Questions:</Text>
          <Stack gap="lg">
            {currentPartData.questions.map((question, qIndex) => {
              const questionKey = `w_p${currentPart}_q${qIndex + 1}`;
              
              return (
                <Box key={qIndex}>
                  <Text style={{ whiteSpace: 'pre-line' }} mb="md">
                    <Text component="span" size="sm" fw={500} c="purple.6">
                      Q{qIndex + 1}: 
                    </Text>
                    {' '} {question}
                  </Text>
                  
                  {/* Part 1 uses simple textarea, Parts 2-4 use rich text editor */}
                  {currentPart === 1 ? (
                    <TextInput
                      placeholder="Enter your answer here..."
                      value={userAnswers[questionKey] || ''}
                      onChange={(e) => onAnswerChange(questionKey, e.target.value)}
                      disabled={submitted}
                    />
                  ) : (
                    <Box>
                      <WritingRichTextEditor
                        key={questionKey}
                        questionKey={questionKey}
                        initialContent={userAnswers[questionKey] || ''}
                        onContentChange={onAnswerChange}
                        disabled={submitted}
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Paper>

        {/* Navigation */}
        <Group justify="space-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentPart === 1 || submitted}
          >
            Previous
          </Button>
          
          <Group gap="xs">
            {[1, 2, 3, 4].map(partNum => (
              <Button
                key={partNum}
                variant={partNum === currentPart ? "filled" : "outline"}
                size="sm"
                onClick={() => setCurrentPart(partNum)}
                disabled={submitted}
                color="purple"
              >
                {partNum}
              </Button>
            ))}
          </Group>
          
          <Button 
            onClick={handleNext}
            disabled={currentPart === 4 || submitted}
            color="purple"
          >
            Next
          </Button>
        </Group>
      </Stack>
    );
  };

  // Debug logging
  console.log('TakeWritingExam - exam data:', exam);
  console.log('TakeWritingExam - exam type:', typeof exam);
  console.log('TakeWritingExam - is array:', Array.isArray(exam));

  if (!exam) {
    return <Text c="red">Đang tải dữ liệu bài thi...</Text>;
  }

  if (!Array.isArray(exam)) {
    return (
      <Paper withBorder p="lg">
        <Text c="red">Invalid exam data format. Expected array, got: {typeof exam}</Text>
        <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(exam, null, 2)}
        </pre>
      </Paper>
    );
  }

  if (exam.length === 0) {
    return <Text c="red">No exam parts found</Text>;
  }

  try {
    return (
      <Paper withBorder p="lg">
        <Title order={2} mb="lg" ta="center">Writing Test</Title>
        {renderPartContent()}
      </Paper>
    );
  } catch (error) {
    console.error('TakeWritingExam render error:', error);
    return (
      <Paper withBorder p="lg">
        <Text c="red">Error rendering Writing exam: {String(error)}</Text>
        <Text size="sm" c="dimmed" mt="md">Please check console for details</Text>
      </Paper>
    );
  }
};

export default TakeWritingExam;
