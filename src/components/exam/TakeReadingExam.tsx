import React, { useCallback } from 'react';
import { Paper, Title, Stack, Text, Group, Radio, Select } from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface TakeReadingExamProps {
  exam: any;
  userAnswers: any;
  submitted: boolean;
  onAnswerChange: (key: string, value: string) => void;
  onDragEnd: (result: DropResult, topicIdx: number) => void;
}

const TakeReadingExam: React.FC<TakeReadingExamProps> = ({
  exam,
  userAnswers,
  submitted,
  onAnswerChange,
  onDragEnd
}) => {
  const handleDragEnd = useCallback((result: DropResult, topicIdx: number) => {
    onDragEnd(result, topicIdx);
  }, [onDragEnd]);

  const renderReadingPart1 = useCallback(() => {
    if (!exam) return null;
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 1</Title>
        <Stack gap="md">
          {Array.isArray(exam.part1) && exam.part1.length > 0 ? (
            exam.part1.map((group: any, gIdx: number) => (
              <Paper key={gIdx} withBorder p="md">
                <Title order={4}>Group {group.group}</Title>
                {group.questions.map((q: any, qIdx: number) => {
                  const qKey = `r1_g${gIdx}_q${qIdx}`;
                  const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                  return (
                    <div key={qKey} style={{ marginBottom: 16 }}>
                      <Text fw={500}>{q.sentence}</Text>
                      <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                        {q.options.map((opt: string, i: number) => {
                          const isCorrect = opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                          return <Radio key={i} value={opt} checked={userAnswers[qKey] === opt} onChange={() => onAnswerChange(qKey, opt)} label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>} />;
                        })}
                      </Group>
                      {submitted && (<Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>{correct ? 'Đúng' : `Sai. Đáp án: ${q.correct_answer}`}</Text>)}
                    </div>
                  );
                })}
              </Paper>
            ))
          ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
        </Stack>
      </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  const renderReadingPart2 = useCallback(() => {
    if (!exam) return null;
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 2</Title>
        <Stack gap="md">
          {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
            exam.part2.map((topic: any, idx: number) => {
              const sentences = Array.isArray(topic.sentences)
                ? topic.sentences.filter((s: any) => !s.is_example_first)
                : [];
              const exampleSentence = Array.isArray(topic.sentences)
                ? topic.sentences.find((s: any) => s.is_example_first)
                : null;
              const dndKey = `r2_dnd_${idx}`;
              const allKeys = sentences.map((s: any) => String(s.key));
              const currentOrder = userAnswers[dndKey] ?? allKeys;
              let orderedSentences = currentOrder.map((k: string) => sentences.find((s: any) => String(s.key) === k));
              if (orderedSentences.some((s: any) => !s)) {
                orderedSentences = sentences;
              }
              const correctOrder = [...sentences].sort((a, b) => a.key - b.key);
              return (
                <Paper key={idx} withBorder p="md">
                  <Title order={4}>{topic.topic}</Title>
                  {exampleSentence && (
                    <Text mb={8}>
                      <b>Example.</b> {exampleSentence.text}
                      <span style={{ marginLeft: 8, color: 'blue' }}>(0)</span>
                    </Text>
                  )}
                  <DragDropContext onDragEnd={result => onDragEnd(result, idx)}>
                    <Droppable droppableId={`droppable-${idx}`} isDropDisabled={submitted}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {orderedSentences.map((s: any, sIdx: number) => {
                            let borderColor = '#dee2e6';
                            if (submitted) {
                              const correctIdx = correctOrder.findIndex((ss: any) => ss.key === s.key);
                              borderColor = (sIdx === correctIdx) ? 'green' : 'red';
                            }
                            return (
                              <Draggable key={s.key} draggableId={String(s.key)} index={sIdx} isDragDisabled={submitted}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      userSelect: 'none',
                                      padding: 16,
                                      margin: '0 0 8px 0',
                                      background: snapshot.isDragging ? '#e7f5ff' : '#fff',
                                      border: `2px solid ${borderColor}`,
                                      borderRadius: 6,
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    <Text fw={500}>{s.text}</Text>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  {submitted && (
                    <div style={{ marginTop: 16 }}>
                      <Text fw="bold" color="green" mb={4}>Đáp án:</Text>
                      <ol style={{ paddingLeft: 20 }}>
                        {correctOrder.map((s: any, idx: number) => (
                          <li key={s.key} style={{ marginBottom: 4 }}>
                            <Text size="sm">{s.text}</Text>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </Paper>
              );
            })
          ) : (
            <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
          )}
        </Stack>
      </Paper>
    );
  }, [exam, userAnswers, submitted, handleDragEnd, handleDragEnd, onDragEnd]);

  const renderReadingPart3 = useCallback(() => {
    if (!exam) return null;
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 3</Title>
        <Stack gap="md">
          {Array.isArray(exam.part3) && exam.part3.length > 0 ? (
            exam.part3.map((item: any, idx: number) => (
              <Paper key={idx} withBorder p="md">
                <Title order={4}>{item.topic}</Title>
                <Stack gap={4} mt={4}>
                  <Text fw={500}>Person A: <span style={{ fontWeight: 400 }}>{item.person_A}</span></Text>
                  <Text fw={500}>Person B: <span style={{ fontWeight: 400 }}>{item.person_B}</span></Text>
                  <Text fw={500}>Person C: <span style={{ fontWeight: 400 }}>{item.person_C}</span></Text>
                  <Text fw={500}>Person D: <span style={{ fontWeight: 400 }}>{item.person_D}</span></Text>
                </Stack>
                <Stack gap={12} mt={16}>
                  {item.questions.map((q: any, qIdx: number) => {
                    const qKey = `r3_${idx}_${qIdx}`;
                    const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                    const options = [
                      { value: 'Person_A', label: 'Person A' },
                      { value: 'Person_B', label: 'Person B' },
                      { value: 'Person_C', label: 'Person C' },
                      { value: 'Person_D', label: 'Person D' },
                    ];
                    return (
                      <div key={qKey} style={{ marginBottom: 16 }}>
                        <Text fw={500}>{q.text}</Text>
                        <Select
                          data={options}
                          value={userAnswers[qKey] || ''}
                          onChange={val => onAnswerChange(qKey, val || '')}
                          placeholder="Chọn đáp án"
                          disabled={submitted}
                          error={submitted && !correct}
                          style={{ width: 180, marginTop: 4 }}
                        />
                        {submitted && (
                          <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                            {correct ? 'Đúng' : `Sai. Đáp án: Person ${q.correct_answer.slice(-1)}`}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </Stack>
              </Paper>
            ))
          ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
        </Stack>
      </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  const renderReadingPart4 = useCallback(() => {
    if (!exam) return null;
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 4</Title>
        <Stack gap="md">
          {Array.isArray(exam.part4) && exam.part4.length > 0 ? (
            exam.part4.map((item: any, idx: number) => (
              <Paper key={idx} withBorder p="md">
                <Title order={4}>{item.topic}</Title>
                {Array.isArray(item.questions) && item.questions.map((q: any, qIdx: number) => {
                  const qKey = `r4_${idx}_${qIdx}`;
                  const correctIdx = Number(q.correct_answer);
                  const correct = submitted && userAnswers[qKey] === String(correctIdx);
                  return (
                    <div key={qKey} style={{ marginBottom: 16 }}>
                      <Text fw={500} mb={8}>{q.text}</Text>
                      <Select
                        data={Array.isArray(item.options) ? item.options.map((opt: string, i: number) => ({
                          value: String(i),
                          label: opt
                        })) : []}
                        value={userAnswers[qKey] || ''}
                        onChange={(value) => onAnswerChange(qKey, value || '')}
                        placeholder="Chọn đáp án"
                        disabled={submitted}
                      />
                      {submitted && (
                        <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={4}>
                          {correct ? 'Đúng' : `Sai. Đáp án: ${item.options[correctIdx]}`}
                        </Text>
                      )}
                    </div>
                  );
                })}
              </Paper>
            ))
          ) : (
            <Text c="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
          )}
        </Stack>
      </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  // Early return if exam is not available
  if (!exam) {
    return <Text c="red">Đang tải dữ liệu bài thi...</Text>;
  }

  return (
    <>
      {renderReadingPart1()}
      {renderReadingPart2()}
      {renderReadingPart3()}
      {renderReadingPart4()}
    </>
  );
};

export default TakeReadingExam;
