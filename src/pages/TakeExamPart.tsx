import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Paper, Title, Loader, Center, Button, Text, Group, Badge } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { userExamService } from '../services/userExamService';
import { DropResult } from 'react-beautiful-dnd';
import ExamRenderer from '../components/exam/ExamRenderer';
import ViewSpeakingSubmission from '../components/exam/ViewSpeakingSubmission';
import ViewWritingSubmission from '../components/exam/ViewWritingSubmission';

const TakeExamPart: React.FC = () => {
    const { examSetId, partType } = useParams<{ examSetId: string; partType: string }>();
    const [searchParams] = useSearchParams();
    const submissionId = searchParams.get('submissionId');
    const [exam, setExam] = useState<any>(null);
    const [examId, setExamId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<any>({});
    const [userPart2Answers, setUserPart2Answers] = useState<any>({});
    const [submitted, setSubmitted] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [submissionData, setSubmissionData] = useState<any>(null);
    const [submissionScore, setSubmissionScore] = useState<string>('');
    const navigate = useNavigate();

    // Load exam data and submission data if viewing a submission
    useEffect(() => {
        const loadExam = async () => {
            if (!examSetId || !partType) return;

            try {
                setLoading(true);

                // First get the exam set details
                const examSetResponse = await userExamService.getUserExamSetDetail(Number(examSetId));
                console.log('Exam set response:', examSetResponse);

                // Find the exam with the matching part type
                const foundExam = examSetResponse.exams?.find((exam: any) => exam.exam_type === partType);
                console.log('Found exam:', foundExam);

                if (!foundExam) {
                    throw new Error(`Không tìm thấy phần thi ${partType} trong bộ đề này`);
                }

                console.log('Calling getUserExamPartDetail with ID:', foundExam.id);
                // Store the exam ID for later use
                setExamId(foundExam.id);

                // Get the detailed exam content using the admin API endpoint
                const response = await userExamService.getUserExamDetail(foundExam.id);
                console.log('Exam part detail response:', response);
                setExam(response);

                // If submissionId is provided, load the submission data
                if (submissionId) {
                    console.log('Loading submission data for ID:', submissionId);
                    const submissionData = await userExamService.getSubmission(parseInt(submissionId));
                    console.log('Submission data:', submissionData);

                    // Parse the answer data (response format: submissionData.answer)
                    const answerData = submissionData.answer || {};

                    // Check if this is a speaking submission
                    if (answerData?.partType === 'speaking') {
                        // For speaking submissions, store the full submission data
                        setSubmissionData(answerData);
                        setSubmissionScore(submissionData.score || '0');

                        // Use exam data from submission snapshot
                        if (answerData?.examData) {
                            setExam(answerData.examData);
                        }
                    } else if (answerData?.partType === 'writing') {
                        // For writing submissions, store the full submission data
                        setSubmissionData(answerData);
                        setSubmissionScore(submissionData.score || '0');

                        // Use exam data from submission snapshot
                        if (answerData.examData) {
                            setExam(answerData.examData);
                        }
                    } else {
                        // For other exam types, set the user answers from submission
                        setUserAnswers(answerData?.userAnswers || {});
                        setUserPart2Answers(answerData?.userPart2Answers || {});

                        // Use exam data from submission snapshot if available
                        if (answerData.examData) {
                            setExam(answerData.examData);
                        }
                    }

                    // Mark as submitted to show results
                    setSubmitted(true);
                } else {
                    // Set timer if available and not viewing submission
                    if (foundExam.time_limit) {
                        console.log('Setting timer to:', foundExam.time_limit, 'minutes');
                        setRemainingTime(foundExam.time_limit * 60);
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu bài thi');
            } finally {
                setLoading(false);
            }
        };

        loadExam();
    }, [examSetId, partType, submissionId]);

    const handleSubmit = useCallback(async () => {
        try {
            if (!examId) {
                throw new Error('Exam ID is missing');
            }

            // Calculate correct answers before submitting
            let correct = 0;
            if (partType === 'reading') {
                if (Array.isArray(exam.part1)) {
                    exam.part1.forEach((group: any, gIdx: number) => {
                        group.questions.forEach((q: any, qIdx: number) => {
                            const qKey = `r1_g${gIdx}_q${qIdx}`;
                            if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                        });
                    });
                }
                if (Array.isArray(exam.part2)) {
                    exam.part2.forEach((topic: any, idx: number) => {
                        const dndKey = `r2_dnd_${idx}`;
                        const sentences = topic.sentences.filter((s: any) => !s.is_example_first);
                        const allKeys = sentences.map((s: any) => String(s.key));
                        const userOrder = userAnswers[dndKey] ?? allKeys;
                        const correctOrder = [...sentences].sort((a, b) => a.key - b.key);
                        userOrder.forEach((userKey: string, userIdx: number) => {
                            if (correctOrder[userIdx] && String(correctOrder[userIdx].key) === userKey) {
                                correct++;
                            }
                        });
                    });
                }
                if (Array.isArray(exam.part3)) {
                    exam.part3.forEach((item: any, idx: number) => {
                        item.questions.forEach((q: any, qIdx: number) => {
                            const qKey = `r3_${idx}_${qIdx}`;
                            if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                        });
                    });
                }
                if (Array.isArray(exam.part4)) {
                    exam.part4.forEach((item: any, idx: number) => {
                        item.questions.forEach((q: any, qIdx: number) => {
                            const qKey = `r4_${idx}_${qIdx}`;
                            const correctIdx = Number(q.correct_answer);
                            if (userAnswers[qKey] === String(correctIdx)) correct++;
                        });
                    });
                }
            } else {
                // Listening exam logic
                if (Array.isArray(exam.part1)) {
                    if (exam.part1[0]?.questions) {
                        exam.part1.forEach((group: any, gIdx: number) => {
                            group.questions.forEach((q: any, qIdx: number) => {
                                const qKey = `p1_g${gIdx}_q${qIdx}`;
                                if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                            });
                        });
                    } else {
                        exam.part1.forEach((q: any, qIdx: number) => {
                            const qKey = `p1_${qIdx}`;
                            const userSelectedOption = userAnswers[qKey];
                            const correctIdx = Number(q.correct_answer) - 1;
                            const correctOption = Array.isArray(q.options) && correctIdx >= 0 ? q.options[correctIdx] : '';
                            if (userSelectedOption === correctOption) correct++;
                        });
                    }
                }
            }
            if (Array.isArray(exam.part2)) {
                exam.part2.forEach((item: any, idx: number) => {
                    if (Array.isArray(item.options)) {
                        item.options.forEach((_: string, i: number) => {
                            const personKeys = ['a', 'b', 'c', 'd'];
                            const personLabels = ['A', 'B', 'C', 'D'];
                            const correctPersons = personKeys.map((key, idx2) => (item[key] === i + 1 ? personLabels[idx2] : null)).filter(Boolean);
                            if (correctPersons.length > 0) {
                                const answerKey = `p2_${idx}_${i}`;
                                const userValue = userPart2Answers[answerKey] || '';
                                if (userValue) {
                                    if (correctPersons.includes(userValue)) correct++;
                                }
                            }
                        });
                    }
                });
            }
            if (Array.isArray(exam.part3)) {
                exam.part3.forEach((item: any, idx: number) => {
                    if (Array.isArray(item.questions) && Array.isArray(item.correct_answers)) {
                        item.questions.forEach((_: any, qIdx: number) => {
                            const qKey = `p3_${idx}_${qIdx}`;
                            const userAnswer = userAnswers[qKey]?.trim().toLowerCase() || '';
                            const correctAnswer = item.correct_answers[qIdx]?.trim().toLowerCase() || '';
                            if (userAnswer === correctAnswer) correct++;
                        });
                    }
                });
            }
            if (Array.isArray(exam.part4)) {
                const topicMap: { [topic: string]: any[] } = {};
                exam.part4.forEach((item: any) => {
                    if (!topicMap[item.topic]) {
                        topicMap[item.topic] = [];
                    }
                    topicMap[item.topic].push(item);
                });

                Object.entries(topicMap).forEach(([_, items], topicIdx) => {
                    items.forEach((item: any, itemIdx: number) => {
                        if (Array.isArray(item.questions) && Array.isArray(item.correct_answers)) {
                            item.questions.forEach((_: any, qIdx: number) => {
                                const qKey = `p4_t${topicIdx}_i${itemIdx}_q${qIdx}`;
                                const userSelectedIdx = Number(userAnswers[qKey]);
                                const correctIdx = Number(item.correct_answers[qIdx]) - 1;
                                if (userSelectedIdx === correctIdx) correct++;
                            });
                        }
                    });
                });
            }

            const score = `${correct}/${totalQuestions}`;
            console.log('Calculated score:', score, 'correct:', correct, 'total:', totalQuestions);

            // Prepare submission data as JSON object including exam data snapshot
            const jsonData = {
                userAnswers,
                userPart2Answers,
                partType,
                examId: examId,
                examData: exam, // Include full exam data for historical viewing
                submittedAt: new Date().toISOString()
            };

            // Prepare submission payload - only include score for reading/listening
            const submissionPayload: any = {
                json_data: jsonData
            };

            // Only include score for reading and listening exams
            if (partType === 'reading' || partType === 'listening') {
                submissionPayload.score = score;
            }

            console.log('Submitting data:', submissionPayload);

            // Submit to API
            await userExamService.submitExam(examId, submissionPayload);

            // Set submitted state and correct count for UI
            setSubmitted(true);
            setCorrectCount(correct);

            showNotification({
                title: 'Thành công',
                message: 'Bài làm đã được lưu thành công!',
                color: 'green'
            });

            // Scroll to top after state update to view submitted answers
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error('Error submitting exam:', error);
            showNotification({
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi lưu bài làm',
                color: 'red'
            });
        }
    }, [userAnswers, userPart2Answers, partType, examId, totalQuestions, exam]);

    const handleSpeakingSubmit = useCallback(async (audioPaths: string[]) => {
        try {
            if (!examId) {
                throw new Error('Exam ID is missing');
            }

            // Prepare submission data for speaking exam
            const jsonData = {
                audioPaths: audioPaths, // Array of audio file paths from uploads
                partType: 'speaking',
                examId: examId,
                examData: exam, // Include full exam data for historical viewing
                submittedAt: new Date().toISOString()
            };

            console.log('Submitting speaking data:', { json_data: jsonData });

            // Submit to API - no score field for speaking exams (manual grading)
            await userExamService.submitExam(examId, {
                json_data: jsonData
            });

            // Set submitted state
            setSubmitted(true);

            showNotification({
                title: 'Thành công',
                message: 'Bài thi speaking đã được nộp thành công!',
                color: 'green'
            });

            // Navigate back to exam set detail after a delay
            setTimeout(() => {
                if (examSetId) {
                    console.log('Navigating to exam set:', examSetId);
                    navigate(`/take-exam/${examSetId}`);
                } else {
                    console.log('No examSetId found, navigating to dashboard');
                    navigate('/dashboard');
                }
            }, 2000);

        } catch (error) {
            console.error('Error submitting speaking exam:', error);
            showNotification({
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi nộp bài speaking',
                color: 'red'
            });
        }
    }, [examId, exam, navigate, examSetId]);

    // Timer countdown effect
    useEffect(() => {
        if (remainingTime === undefined || remainingTime <= 0 || submitted) return;

        const timer = setInterval(() => {
            setRemainingTime(prev => {
                if (prev === undefined || prev <= 1) {
                    // Time's up - auto submit only for reading/listening, not speaking
                    if (partType !== 'speaking') {
                        handleSubmit();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [remainingTime, submitted, handleSubmit, partType]);

    // Calculate total questions
    useEffect(() => {
        if (!exam) return;

        let total = 0;
        if (Array.isArray(exam.part1)) {
            if (exam.part1[0]?.questions) {
                exam.part1.forEach((group: any) => {
                    if (Array.isArray(group.questions)) total += group.questions.length;
                });
            } else {
                total += exam.part1.length;
            }
        }
        if (Array.isArray(exam.part3)) {
            exam.part3.forEach((item: any) => {
                if (Array.isArray(item.questions)) total += item.questions.length;
            });
        }
        if (Array.isArray(exam.part4)) {
            exam.part4.forEach((item: any) => {
                if (Array.isArray(item.questions)) total += item.questions.length;
            });
        }
        if (partType === 'reading' && Array.isArray(exam.part2)) {
            exam.part2.forEach((topic: any) => {
                const sentencesToOrder = topic.sentences.filter((s: any) => !s.is_example_first);
                total += sentencesToOrder.length;
            });
        }
        if (partType !== 'reading' && Array.isArray(exam.part2)) {
            exam.part2.forEach((item: any) => {
                if (Array.isArray(item.options)) {
                    item.options.forEach((_: string, i: number) => {
                        const personKeys = ['a', 'b', 'c', 'd'];
                        const personLabels = ['A', 'B', 'C', 'D'];
                        const correctPersons = personKeys.map((key, idx2) => (item[key] === i + 1 ? personLabels[idx2] : null)).filter(Boolean);
                        if (correctPersons.length > 0) total++;
                    });
                }
            });
        }
        setTotalQuestions(total);
    }, [exam, partType]);

    // Calculate correct answers
    useEffect(() => {
        if (!submitted) return;
        let correct = 0;
        if (partType === 'reading') {
            if (Array.isArray(exam.part1)) {
                exam.part1.forEach((group: any, gIdx: number) => {
                    group.questions.forEach((q: any, qIdx: number) => {
                        const qKey = `r1_g${gIdx}_q${qIdx}`;
                        if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                    });
                });
            }
            if (Array.isArray(exam.part2)) {
                exam.part2.forEach((topic: any, idx: number) => {
                    const dndKey = `r2_dnd_${idx}`;
                    const sentences = topic.sentences.filter((s: any) => !s.is_example_first);
                    const allKeys = sentences.map((s: any) => String(s.key));
                    const userOrder = userAnswers[dndKey] ?? allKeys; // Sử dụng thứ tự ban đầu nếu chưa kéo thả
                    const correctOrder = [...sentences].sort((a, b) => a.key - b.key);
                    userOrder.forEach((userKey: string, userIdx: number) => {
                        if (correctOrder[userIdx] && String(correctOrder[userIdx].key) === userKey) {
                            correct++;
                        }
                    });
                });
            }
            if (Array.isArray(exam.part3)) {
                exam.part3.forEach((item: any, idx: number) => {
                    item.questions.forEach((q: any, qIdx: number) => {
                        const qKey = `r3_${idx}_${qIdx}`;
                        if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                    });
                });
            }
            if (Array.isArray(exam.part4)) {
                exam.part4.forEach((item: any, idx: number) => {
                    item.questions.forEach((q: any, qIdx: number) => {
                        const qKey = `r4_${idx}_${qIdx}`;
                        const correctIdx = Number(q.correct_answer);
                        if (userAnswers[qKey] === String(correctIdx)) correct++;
                    });
                });
            }
        } else {
            if (Array.isArray(exam.part1)) {
                if (exam.part1[0]?.questions) {
                    exam.part1.forEach((group: any, gIdx: number) => {
                        group.questions.forEach((q: any, qIdx: number) => {
                            const qKey = `p1_g${gIdx}_q${qIdx}`;
                            if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                        });
                    });
                } else {
                    exam.part1.forEach((q: any, qIdx: number) => {
                        const qKey = `p1_${qIdx}`;
                        const userSelectedOption = userAnswers[qKey];
                        const correctIdx = Number(q.correct_answer) - 1;
                        const correctOption = Array.isArray(q.options) && correctIdx >= 0 ? q.options[correctIdx] : '';
                        if (userSelectedOption === correctOption) correct++;
                    });
                }
            }
            if (Array.isArray(exam.part2)) {
                exam.part2.forEach((item: any, idx: number) => {
                    if (Array.isArray(item.options)) {
                        item.options.forEach((_: string, i: number) => {
                            const personKeys = ['a', 'b', 'c', 'd'];
                            const personLabels = ['A', 'B', 'C', 'D'];
                            const correctPersons = personKeys.map((key, idx2) => (item[key] === i + 1 ? personLabels[idx2] : null)).filter(Boolean);
                            if (correctPersons.length > 0) {
                                const answerKey = `p2_${idx}_${i}`;
                                const userValue = userPart2Answers[answerKey] || '';
                                if (userValue) {
                                    if (correctPersons.includes(userValue)) correct++;
                                }
                            }
                        });
                    }
                });
            }
            if (Array.isArray(exam.part3)) {
                exam.part3.forEach((item: any, idx: number) => {
                    if (Array.isArray(item.questions) && Array.isArray(item.correct_answers)) {
                        item.questions.forEach((q: any, qIdx: number) => {
                            const qKey = `p3_${idx}_${qIdx}`;
                            const userAnswer = userAnswers[qKey]?.trim().toLowerCase() || '';
                            const correctAnswer = item.correct_answers[qIdx]?.trim().toLowerCase() || '';
                            if (userAnswer === correctAnswer) correct++;
                        });
                    }
                });
            }
            if (Array.isArray(exam.part4)) {
                // Group by topic first
                const topicMap: { [topic: string]: any[] } = {};
                exam.part4.forEach((item: any) => {
                    if (!topicMap[item.topic]) {
                        topicMap[item.topic] = [];
                    }
                    topicMap[item.topic].push(item);
                });

                Object.entries(topicMap).forEach(([topic, items], topicIdx) => {
                    items.forEach((item: any, itemIdx: number) => {
                        if (Array.isArray(item.questions) && Array.isArray(item.correct_answers)) {
                            item.questions.forEach((_: any, qIdx: number) => {
                                const qKey = `p4_t${topicIdx}_i${itemIdx}_q${qIdx}`;
                                const userSelectedIdx = Number(userAnswers[qKey]);
                                const correctIdx = Number(item.correct_answers[qIdx]) - 1;
                                if (userSelectedIdx === correctIdx) correct++;
                            });
                        }
                    });
                });
            }
        }
        setCorrectCount(correct);
    }, [submitted, exam, userAnswers, partType, userPart2Answers]);

    const handleChange = (qKey: string, value: string) => {
        setUserAnswers((prev: any) => ({ ...prev, [qKey]: value }));
    };

    const handlePart2AnswerChange = (qKey: string, value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] : value;
        setUserPart2Answers((prev: any) => ({ ...prev, [qKey]: stringValue }));
    };

    const handleDragEnd = (result: DropResult, topicIdx: number) => {
        const { source, destination } = result;
        if (!destination) return;
        const dndKey = `r2_dnd_${topicIdx}`;
        const topic = exam.part2[topicIdx];
        const allKeys = topic.sentences.filter((s: any) => !s.is_example_first).map((s: any) => String(s.key));
        const prevOrder = userAnswers[dndKey] ?? allKeys;
        const keyOrder = prevOrder.filter((k: string) => allKeys.includes(k));
        const newOrder = [...keyOrder];
        const [removed] = newOrder.splice(source.index, 1);
        newOrder.splice(destination.index, 0, removed);
        setUserAnswers((prev: any) => ({
            ...prev,
            [dndKey]: newOrder,
        }));
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <Center style={{ height: '60vh' }}><Loader /></Center>;
    }
    if (error) {
        return <Center style={{ height: '60vh' }}><Text c="red">{error}</Text></Center>;
    }
    if (!exam) {
        return <Center style={{ height: '60vh' }}><Text>Không tìm thấy dữ liệu bài thi.</Text></Center>;
    }

    const isViewingSubmission = !!submissionId;

    // If viewing a speaking submission, use the special component
    if (isViewingSubmission && submissionData && submissionData.partType === 'speaking') {
        return (
            <div>
                <Group justify="space-between" mb="lg">
                    <Title order={2}>Xem bài đã làm - Speaking: {exam?.title}</Title>
                    <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
                </Group>

                <ViewSpeakingSubmission
                    submissionData={submissionData}
                    score={submissionScore}
                />
            </div>
        );
    }

    // If viewing a writing submission, use the special component
    if (isViewingSubmission && submissionData && submissionData.partType === 'writing') {
        return (
            <div>
                <Group justify="space-between" mb="lg">
                    <Title order={2}>Xem bài đã làm - Writing: {exam?.title}</Title>
                    <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
                </Group>

                <ViewWritingSubmission
                    submissionData={submissionData}
                    score={submissionScore}
                />
            </div>
        );
    }

    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Title order={2} mb="lg">
                {isViewingSubmission ? 'Xem bài đã làm' : 'Làm bài'}: {exam?.title}
            </Title>

            {/* Hiển thị Note cho phần Listening khi không xem submission */}
            {partType === 'listening' && !isViewingSubmission && (
                <Text c="red" fw={700} mb="md" style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Lưu ý: Ở bài thi, mỗi câu hỏi chỉ được nghe tối đa 2 lần!!!
                </Text>
            )}

            {/* Timer chỉ hiển thị khi không xem submission và không phải speaking */}
            {!submitted && remainingTime !== undefined && !isViewingSubmission && partType !== 'speaking' && (
                <Text size='lg' c='red' mb='md' fw='bold'>
                    Thời gian còn lại: {formatTime(remainingTime)}
                </Text>
            )}

            {/* Kết quả hiển thị khi đã submit hoặc đang xem submission */}
            {submitted && (
                <Group gap="md" mb="lg">
                    <Badge color="blue" size="lg">
                        Score: {correctCount}/{totalQuestions}
                    </Badge>
                    <Text size="sm" c="dimmed">
                        Submitted
                    </Text>
                </Group>
            )}

            <form onSubmit={e => { e.preventDefault(); if (!isViewingSubmission) handleSubmit(); }}>
                <ExamRenderer
                    partType={partType || ''}
                    exam={exam}
                    userAnswers={userAnswers}
                    userPart2Answers={userPart2Answers}
                    submitted={submitted}
                    onAnswerChange={isViewingSubmission ? () => { } : handleChange}
                    onPart2AnswerChange={isViewingSubmission ? () => { } : handlePart2AnswerChange}
                    onDragEnd={isViewingSubmission ? () => { } : handleDragEnd}
                    onSpeakingSubmit={isViewingSubmission ? () => { } : handleSpeakingSubmit}
                />
                <Group mt="xl">
                    {!isViewingSubmission && !submitted && partType !== 'speaking' && (
                        <Button
                            type="submit"
                            onClick={partType === 'writing' ? () => navigate(-1) : undefined}
                        >
                            Nộp bài
                        </Button>
                    )}
                    {(isViewingSubmission || submitted) && partType !== 'speaking' && (
                        <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
                    )}
                </Group>
            </form>
        </Paper>
    );
};

export default TakeExamPart;
