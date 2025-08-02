import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Text, Button, Group, Center, Loader, Stack, Paper } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { submissionService } from '../services/submissionService';
import { SubmissionDetail } from '../types/submission';
import ScoreSpeakingSubmission from '../components/exam/ScoreSpeakingSubmission';
import ScoreWritingSubmission from '../components/exam/ScoreWritingSubmission';

const AdminScoreSubmission: React.FC = () => {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
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

                // Parse the answer data
                const answerData = submissionData.answer || {};
                setPartType(answerData.partType || '');

                console.log('Admin score submission data:', submissionData);
                console.log('Answer data:', answerData);
                console.log('Part type:', answerData.partType);

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

    const handleScoreSubmitted = () => {
        // Reload submission data to get updated score
        if (submissionId) {
            submissionService.getSubmissionDetail(parseInt(submissionId))
                .then(updatedSubmission => {
                    setSubmission(updatedSubmission);
                })
                .catch(error => {
                    console.error('Error reloading submission:', error);
                });
        }
    };

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

    if (!submission) {
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

    // Only allow scoring for speaking and writing submissions that are not scored yet
    if (partType !== 'speaking' && partType !== 'writing') {
        return (
            <Center style={{ height: '60vh' }}>
                <Stack align="center">
                    <Text>Chỉ có thể chấm điểm cho bài Speaking và Writing</Text>
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
                <Group justify="space-between" mb="lg">
                    <div>
                        <Title order={2}>Score Speaking Exam</Title>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/submissions-management')}>
                        Back to List
                    </Button>
                </Group>

                <ScoreSpeakingSubmission
                    submissionId={parseInt(submissionId!)}
                    submissionData={submission.answer}
                    currentScore={submission.score}
                    onScoreSubmitted={handleScoreSubmitted}
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
                        <Title order={2}>Score Writing Exam</Title>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/submissions-management')}>
                        Back to List
                    </Button>
                </Group>

                <ScoreWritingSubmission
                    submissionId={parseInt(submissionId!)}
                    submissionData={submission.answer}
                    currentScore={submission.score}
                    onScoreSubmitted={handleScoreSubmitted}
                />
            </Paper>
        );
    }

    return null;
};

export default AdminScoreSubmission;
