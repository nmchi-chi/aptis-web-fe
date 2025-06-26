import React from 'react';
import { Grid, Stack, Text, Group, Anchor, rem, Box } from '@mantine/core';
import { IconBrandFacebook, IconMail, IconBrandInstagram, IconBrandTwitter } from '@tabler/icons-react';

const footerBg = '#2d5c2f';
const textColor = '#fff';

export default function Footer() {
  return (
    <Box style={{ background: footerBg, color: textColor, padding: '40px 0 0 0' }}>
      <Grid gutter={40} justify="center" align="flex-start" style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Logo */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Stack align="center" gap={8}>
            <img color='white' src="/assets/logo-white-150x150.png" alt="Aptis One Logo" style={{ width: 200, height: 200, objectFit: 'contain' }} />
          </Stack>
        </Grid.Col>
        {/* Thông tin liên hệ */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Text fw={700} size="lg" mb={8} style={{ color: textColor }}>THÔNG TIN LIÊN HỆ</Text>
          <ul style={{ margin: 0, paddingLeft: rem(18), color: textColor, fontSize: rem(15) }}>
            <li>Trung tâm luyện thi APTIS ONE</li>
            <li>Hotline: <Anchor href="tel:0965483350" c={textColor} underline="never">0965 483 350</Anchor></li>
            <li>Gmail: <Anchor href="mailto:aptisplus.vn@gmail.com" c={textColor} underline="never">aptisplus.vn@gmail.com</Anchor></li>
            <li>Fanpage: <Anchor href="https://www.facebook.com/share/1JTAxrvEW9/?mibextid=wwXIfr" target="_blank" c={textColor} underline="never">APTIS ONE - Thi 1 Lần Là Đạt</Anchor></li>
          </ul>
        </Grid.Col>
        {/* Danh sách khóa học */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Text fw={700} size="lg" mb={8} style={{ color: textColor }}>DANH SÁCH KHÓA HỌC</Text>
          <Stack gap={4} style={{ color: textColor }}>
            <Anchor href="#" c={textColor} underline="never">Khóa học B1 Aptis</Anchor>
            <Anchor href="#" c={textColor} underline="never">Khóa học B2 Aptis</Anchor>
            <Anchor href="#" c={textColor} underline="never">Khóa học Master C Aptis</Anchor>
          </Stack>
        </Grid.Col>
        {/* Về Aptis One */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Text fw={700} size="lg" mb={8} style={{ color: textColor }}>VỀ APTIS ONE</Text>
          <Stack gap={4} style={{ color: textColor }}>
            <Anchor href="#" c={textColor} underline="never">Giới thiệu</Anchor>
            <Anchor href="#" c={textColor} underline="never">Cảm nhận học viên</Anchor>
            <Anchor href="#" c={textColor} underline="never">Hệ thống cơ sở</Anchor>
            <Anchor href="#" c={textColor} underline="never">Đội ngũ giáo viên</Anchor>
            <Anchor href="#" c={textColor} underline="never">Lịch khai giảng</Anchor>
            <Anchor href="#" c={textColor} underline="never">Liên hệ</Anchor>
          </Stack>
          <Group mt={16} gap={8}>
            <Anchor href="https://www.facebook.com/share/1JTAxrvEW9/?mibextid=wwXIfr" target="_blank" title="Theo dõi trên Facebook">
              <IconBrandFacebook size={28} color={textColor} style={{ transition: '0.2s', cursor: 'pointer' }} />
            </Anchor>
            <Anchor href="mailto:aptisplus.vn@gmail.com" target="_blank" title="Gửi email">
              <IconMail size={28} color={textColor} style={{ transition: '0.2s', cursor: 'pointer' }} />
            </Anchor>
            <IconBrandInstagram size={28} color={textColor} style={{ opacity: 0.5 }} />
            <IconBrandTwitter size={28} color={textColor} style={{ opacity: 0.5 }} />
          </Group>
        </Grid.Col>
      </Grid>
      <Box style={{ background: '#1e3a22', color: '#fff', textAlign: 'center', padding: '12px 0', marginTop: 32, fontSize: 15 }}>
        Copyright © {new Date().getFullYear()} Aptis One
      </Box>
    </Box>
  );
} 