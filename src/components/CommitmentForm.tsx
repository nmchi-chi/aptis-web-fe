import React, { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  Button,
  Paper,
  Title,
  Stack,
  Group,
  Box,
  Text,
  Notification,
  Divider,
  Center,
  Loader,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconUpload, IconSignature, IconDownload } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { commitmentService } from '../services/commitmentService';
import { showNotification } from '@mantine/notifications';

// Helper: convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const initialForm = {
  student_name: '',
  date_of_birth: '',
  national_id: '',
  address: '',
  phone: '',
  email: '',
  course_registered: '',
  start_date: '',
  end_date: '',
  fee_paid: '',
  fee_deadline: '',
  issue_date: '',
  commitment_output: '',
  target_output: '',
  signature_base64: '',
};

const CommitmentForm: React.FC = () => {
  const [form, setForm] = useState<any>({ ...initialForm });
  const [signatureType, setSignatureType] = useState<'upload' | 'draw'>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingMail, setSendingMail] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const closeButtonGroupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  // Handle input change
  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  // Helper to handle date change and format
  const handleDateChange = (field: string, value: Date | null) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: value ? dayjs(value).format('DD/MM/YYYY') : ''
    }));
  };

  // Handle signature upload
  const handleSignatureUpload = async (file: File | null) => {
    if (file) {
      const base64 = await fileToBase64(file);
      setForm((prev: any) => ({ ...prev, signature_base64: base64 }));
    } else {
      setForm((prev: any) => ({ ...prev, signature_base64: '' }));
    }
  };

  // Handle signature draw
  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    isDrawingRef.current = true;
  };
  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawingRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };
  const handleDrawEnd = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    // Save signature as base64
    if (canvas) {
      const base64 = canvas.toDataURL('image/png');
      setForm((prev: any) => ({ ...prev, signature_base64: base64 }));
    }
  };
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setForm((prev: any) => ({ ...prev, signature_base64: '' }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setPdfBase64(null);
    try {
      // Validate required fields
      const required = [
        'student_name', 'date_of_birth', 'national_id', 'address', 'phone', 'email',
        'course_registered', 'start_date', 'end_date', 'fee_paid', 'fee_deadline',
        'issue_date', 'commitment_output', 'target_output', 'signature_base64'
      ];
      for (const key of required) {
        if (!form[key]) {
          setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
          setSubmitting(false);
          return;
        }
      }
      // Call API
      const pdfBase64String = await commitmentService.generateCommitment(form);
      setPdfBase64(pdfBase64String.replace(/^"|"$/g, ''));
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMail = async () => {
    setSendingMail(true);
    try {
      await commitmentService.sendCommitmentEmail(form);
      showNotification({ color: 'green', message: 'Gửi email thành công!' });
    } catch (err: any) {
      showNotification({ color: 'red', message: err.message || 'Gửi email thất bại!' });
    } finally {
      setSendingMail(false);
    }
  };

  // Sau khi có pdfBase64, scroll lên đầu preview
  useEffect(() => {
    if (pdfBase64 && paperRef.current) {
      paperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        window.scrollBy({ top: -40, left: 0, behavior: 'smooth' });
      }, 400); // delay để scrollIntoView xong mới offset lên
    }
  }, [pdfBase64]);

  return (
    <Paper ref={paperRef} shadow="sm" p="xl" radius="md" withBorder>
      <Title order={3} mb="md">Phiếu Cam Kết Học Viên</Title>
      {pdfBase64 ? (
        <>
          <Group ref={closeButtonGroupRef} mt="md" justify="right">
            <Button
              color="green"
              leftSection={<IconDownload size={16} />}
              component="a"
              href={`data:image/png;base64,${pdfBase64}`}
              download={`commitment_${form.student_name || 'file'}.png`}
            >
              Tải xuống
            </Button>
            <Button color="blue" leftSection={<IconUpload size={16} />} onClick={handleSendMail} disabled={sendingMail}>
              {sendingMail ? 'Đang gửi...' : 'Gửi email'}
            </Button>
            <Button color="red" variant="outline" onClick={() => setPdfBase64(null)}>
              Quay lại
            </Button>
          </Group>
          <Box mt='sm'
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              padding: 0,
            }}
          >
            <img
              src={`data:image/png;base64,${pdfBase64}`}
              alt="Commitment Preview"
              style={{
                width: '800px',
                height: 'auto',
                objectFit: 'contain',
                background: '#fff',
                boxShadow: '0 0 12px #ccc',
                display: 'block',
                margin: '0 auto',
              }}
            />

          </Box>

        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Group grow>
              <TextInput label="Họ và tên học viên" value={form.student_name} onChange={e => handleChange('student_name', e.target.value)} required />
              <DatePickerInput
                label="Ngày sinh"
                value={form.date_of_birth ? dayjs(form.date_of_birth, 'DD/MM/YYYY').toDate() : null}
                onChange={date => handleDateChange('date_of_birth', date as Date | null)}
                required
                placeholder="Chọn ngày sinh"
                clearable
                valueFormat="DD/MM/YYYY"
              />
              <TextInput label="Số CMND/CCCD" value={form.national_id} onChange={e => handleChange('national_id', e.target.value)} required />
            </Group>
            <Group grow>
              <TextInput label="Địa chỉ" value={form.address} onChange={e => handleChange('address', e.target.value)} required />
              <TextInput label="Số điện thoại" value={form.phone} onChange={e => handleChange('phone', e.target.value)} required />
              <TextInput label="Email" value={form.email} onChange={e => handleChange('email', e.target.value)} required />
            </Group>
            <Group grow>
              <TextInput label="Khóa học đăng ký" value={form.course_registered} onChange={e => handleChange('course_registered', e.target.value)} required />
              <DatePickerInput
                label="Ngày bắt đầu"
                value={form.start_date ? dayjs(form.start_date, 'DD/MM/YYYY').toDate() : null}
                onChange={date => handleDateChange('start_date', date as Date | null)}
                required
                placeholder="Chọn ngày bắt đầu"
                clearable
                valueFormat="DD/MM/YYYY"
              />
              <DatePickerInput
                label="Ngày kết thúc"
                value={form.end_date ? dayjs(form.end_date, 'DD/MM/YYYY').toDate() : null}
                onChange={date => handleDateChange('end_date', date as Date | null)}
                required
                placeholder="Chọn ngày kết thúc"
                clearable
                valueFormat="DD/MM/YYYY"
              />
            </Group>
            <Group grow>
              <TextInput label="Số tiền đã đóng" value={form.fee_paid} onChange={e => handleChange('fee_paid', e.target.value)} required />
              <DatePickerInput
                label="Hạn đóng phí"
                value={form.fee_deadline ? dayjs(form.fee_deadline, 'DD/MM/YYYY').toDate() : null}
                onChange={date => handleDateChange('fee_deadline', date as Date | null)}
                required
                placeholder="Chọn hạn đóng phí"
                clearable
                valueFormat="DD/MM/YYYY"
              />
              <DatePickerInput
                label="Ngày cấp phiếu cam kết"
                value={form.issue_date ? dayjs(form.issue_date, 'DD/MM/YYYY').toDate() : null}
                onChange={date => handleDateChange('issue_date', date as Date | null)}
                required
                placeholder="Chọn ngày cấp phiếu"
                clearable
                valueFormat="DD/MM/YYYY"
              />
            </Group>
            <Group grow>
              <TextInput label="Kết quả cam kết" value={form.commitment_output} onChange={e => handleChange('commitment_output', e.target.value)} required />
              <TextInput label="Mục tiêu đầu ra" value={form.target_output} onChange={e => handleChange('target_output', e.target.value)} required />
            </Group>
            <Divider label="Chữ ký" my="sm" />
            <Group>
              <Button
                variant={signatureType === 'upload' ? 'filled' : 'outline'}
                onClick={() => {
                  setSignatureType('upload');
                  setTimeout(() => {
                    fileInputRef.current?.click();
                  }, 0);
                }}
                leftSection={<IconUpload size={16} />}
              >
                Tải ảnh chữ ký
              </Button>
              <Button
                variant={signatureType === 'draw' ? 'filled' : 'outline'}
                onClick={() => setSignatureType('draw')}
                leftSection={<IconSignature size={16} />}
              >
                Vẽ chữ ký
              </Button>
            </Group>
            {signatureType === 'upload' && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  handleSignatureUpload(file);
                }}
              />
            )}
            {signatureType === 'draw' && (
              <Box>
                <Text mb={4}>Vẽ chữ ký của bạn bên dưới:</Text>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={120}
                  style={{ border: '1px solid #ccc', background: '#fff', borderRadius: 8 }}
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                />
                <Group mt={4}>
                  <Button variant="light" onClick={handleClearCanvas}>Xóa</Button>
                </Group>
              </Box>
            )}
            {form.signature_base64 && (
              <Box>
                <Text size="sm" c="dimmed">Xem trước:</Text>
                <img src={form.signature_base64} alt="Signature preview" style={{ maxWidth: 200, maxHeight: 80, border: '1px solid #eee', marginTop: 4 }} />
              </Box>
            )}
            {error && <Notification color="red">Vui lòng điền đầy đủ thông tin bắt buộc.</Notification>}
            <Button type="submit" loading={submitting} >Xác nhận thông tin phiếu cam kết</Button>
            {submitting && <Center><Loader /></Center>}
          </Stack>
        </form>
      )}
    </Paper>
  );
};

export default CommitmentForm; 