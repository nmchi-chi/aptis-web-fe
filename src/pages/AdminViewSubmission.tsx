import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Text, Button, Group, Center, Loader, Badge, Stack } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { submissionService } from '../services/submissionService';
import { SubmissionDetail } from '../types/submission';
import ExamRenderer from '../components/exam/ExamRenderer';
import ViewSpeakingSubmission from '../components/exam/ViewSpeakingSubmission';
import ViewWritingSubmission from '../components/exam/ViewWritingSubmission';

const AdminViewSubmission: React.FC = () => {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
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

                // Get submission data using admin API
                const submissionData = await submissionService.getSubmissionDetail(parseInt(submissionId));
                setSubmission(submissionData);

                // Parse the answer data (response format: submissionData.answer)
                const answerData = submissionData.answer || {};
                console.log('Admin submission data:', submissionData);
                console.log('Answer data:', answerData);
                console.log('User answers:', answerData.userAnswers);
                console.log('Exam data:', answerData.examData);

                setUserAnswers(answerData.userAnswers || {});
                setUserPart2Answers(answerData.userPart2Answers || {});
                setPartType(answerData.partType || '');

                // Use exam data from submission snapshot
                if (answerData.examData) {
                    setExam(answerData.examData);
                } else {
                    setError('Không tìm thấy dữ liệu đề thi trong bài làm');
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
                <Stack align="center">
                    <Text c="red">{error}</Text>
                    <Button variant="outline" onClick={() => navigate('/submissions-management')}>
                        Back to List
                    </Button>
                </Stack>
            </Center>
        );
    }

    if (!submission || !exam) {
        return (
            <Center style={{ height: '60vh' }}>
                <Stack align="center">
                    <Text>Không tìm thấy dữ liệu bài làm</Text>
                    <Button variant="outline" onClick={() => navigate('/submissions-management')}>
                        Back to List
                    </Button>
                </Stack>
            </Center>
        );
    }

    // Check if this is a speaking submission
    if (partType === 'speaking') {
        return (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Group justify="flex-end" mb="lg">
                    <Button variant="outline" onClick={() => navigate('/submissions-management')}>
                        Back to List
                    </Button>
                </Group>

                <ViewSpeakingSubmission
                    submissionData={submission.answer}
                    score={submission.score || '0'}
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
                        <Title order={2}>Writing Test Submission Review</Title>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/submissions-management')}>
                        Back to List
                    </Button>
                </Group>

                <ViewWritingSubmission
                    submissionData={submission.answer}
                    score={submission.score || '0'}
                />
            </Paper>
        );
    }

    // For reading/listening submissions, use ExamRenderer
    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2} mb="md">Test Submission Review</Title>
                    <Group gap="md">
                        <Badge color="blue" size="lg">Score: {submission.score}</Badge>
                        <Text size="sm" c="dimmed">
                            Submitted: {(() => {
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
                <Button variant="outline" onClick={() => navigate('/submissions-management')}>
                    Back to List
                </Button>
            </Group>

            <ExamRenderer
                partType={partType}
                exam={exam}
                userAnswers={userAnswers}
                userPart2Answers={userPart2Answers}
                submitted={true}
                onAnswerChange={() => {}} // No-op for view mode
                onPart2AnswerChange={() => {}} // No-op for view mode
                onDragEnd={() => {}} // No-op for view mode
                onSpeakingSubmit={() => {}} // No-op for view mode
            />
        </Paper>
    );
};

export default AdminViewSubmission;
