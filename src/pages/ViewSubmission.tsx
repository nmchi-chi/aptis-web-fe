import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Text, Button, Group, Center, Loader, Badge } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import ExamRenderer from '../components/exam/ExamRenderer';
import ViewSpeakingSubmission from '../components/exam/ViewSpeakingSubmission';
import ViewWritingSubmission from '../components/exam/ViewWritingSubmission';
import { userExamService } from '../services/userExamService';

const ViewSubmission: React.FC = () => {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [exam, setExam] = useState<any>(null);
    const [userAnswers, setUserAnswers] = useState<any>({});
    const [userPart2Answers, setUserPart2Answers] = useState<any>({});
    const [partType, setPartType] = useState<string>('');

    useEffect(() => {
        const loadSubmission = async () => {
            if (!submissionId) {
                setError('Submission ID không hợp lệ');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Get submission data
                const submissionData = await userExamService.getSubmission(parseInt(submissionId));
                setSubmission(submissionData);

                // Parse the answer data (response format: submissionData.answer)
                const answerData = submissionData.answer || {};
                setUserAnswers(answerData.userAnswers || {});
                setUserPart2Answers(answerData.userPart2Answers || {});
                setPartType(answerData.partType || '');

                // Use exam data from submission snapshot (no need to fetch current exam)
                if (answerData.examData) {
                    setExam(answerData.examData);
                } else {
                    // Fallback: get current exam data if examData not available in submission
                    if (answerData.examId) {
                        const examData = await userExamService.getUserExamDetail(answerData.examId);
                        setExam(examData);
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu bài làm');
                showNotification({
                    title: 'Lỗi',
                    message: 'Không thể tải dữ liệu bài làm',
                    color: 'red'
                });
            } finally {
                setLoading(false);
            }
        };

        loadSubmission();
    }, [submissionId]);

    if (loading) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader />
            </Center>
        );
    }

    if (error) {
        return (
            <Center style={{ height: '60vh' }}>
                <Text c="red">{error}</Text>
            </Center>
        );
    }

    if (!submission || !exam) {
        return (
            <Center style={{ height: '60vh' }}>
                <Text>Submission data not found</Text>
            </Center>
        );
    }

    // Check if this is a speaking submission
    if (partType === 'speaking') {
        return (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Group justify="space-between" mb="lg">
                    <div>
                        <Title order={2}>Submitted Exam - Speaking</Title>
                    </div>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Group>

                <ViewSpeakingSubmission
                    submissionData={submission.answer}
                    score={submission.score}
                />
            </Paper>
        );
    }

    // Check if this is a writing submission
    if (partType === 'writing') {
        return (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Group justify="space-between" mb="lg">
                    <div>
                        <Title order={2}>Submitted Exam - Writing</Title>
                    </div>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Group>

                <ViewWritingSubmission
                    submissionData={submission.answer}
                    score={submission.score}
                />
            </Paper>
        );
    }

    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2} mb="md">Submitted Exam</Title>
                    <Group gap="md">
                        <Badge color="blue" size="lg">Score: {submission.score}</Badge>
                        <Text size="sm" c="dimmed">
                            Submitted: {(() => {
                                // Try different date fields from submission
                                const dateStr = submission.created_at ||
                                              submission.updated_at ||
                                              (submission.answer && submission.answer.submittedAt) ||
                                              null;
                                if (dateStr) {
                                    try {
                                        return new Date(dateStr).toLocaleString();
                                    } catch (e) {
                                        return 'Unknown';
                                    }
                                }
                                return 'Unknown';
                            })()}
                        </Text>
                    </Group>
                </div>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Group>

            <ExamRenderer
                partType={partType}
                exam={exam}
                userAnswers={userAnswers}
                userPart2Answers={userPart2Answers}
                submitted={true} // Always show as submitted
                onAnswerChange={() => {}} // Disabled
                onPart2AnswerChange={() => {}} // Disabled
                onDragEnd={() => {}} // Disabled
            />
        </Paper>
    );
};

export default ViewSubmission;
