# Aptis Web FE

Aptis Web FE là ứng dụng frontend (React + Mantine UI) cho hệ thống thi đánh giá năng lực tiếng Anh Aptis, kết nối với backend FastAPI. Ứng dụng hỗ trợ quản lý người dùng, bộ đề thi (exam set), upload và quản lý đề Listening/Reading, và cho phép thí sinh làm bài trực tuyến.

## Tính năng chính

### Quản trị viên (Admin)
- Đăng nhập, xác thực phân quyền.
- Quản lý người dùng: tạo, sửa, xoá, kích hoạt/vô hiệu hoá, đặt lại mật khẩu, lọc theo vai trò.
- Quản lý bộ đề thi: tạo, sửa, xoá, tìm kiếm, phân trang.
- Upload, cập nhật file đề thi Listening/Reading (hỗ trợ file và link Google Drive cho audio).
- Xem chi tiết, chỉnh sửa nội dung từng part của đề thi.

### Thí sinh (User)
- Đăng nhập, xác thực.
- Xem danh sách bộ đề thi được phép làm.
- Xem chi tiết đề thi, chọn part để làm bài.
- Làm bài trực tuyến cho từng part (Listening/Reading), có phát audio, chọn đáp án, nộp bài.
- Xem kết quả chấm điểm tự động: tổng số câu đúng, đáp án đúng/sai được tô màu rõ ràng.

## Hướng dẫn cài đặt

### Yêu cầu
- Node.js >= 14
- npm >= 6

### Cài đặt & chạy local

```bash
npm install
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`.

### Cấu hình môi trường
Tạo file `.env` hoặc `.env.development` ở thư mục gốc:
```
REACT_APP_API_URL=http://localhost:5055
```

## Cấu trúc thư mục

```
aptis_web_fe/
  ├── public/                # Tài nguyên tĩnh, logo, index.html
  ├── src/
  │   ├── components/        # Header, Footer, Layout
  │   ├── pages/             # Các trang: Login, Dashboard, UserManagement, ExamManagement, ...
  │   ├── services/          # Gọi API backend (user, exam set, user exam)
  │   ├── store/             # Redux store, slice, saga
  │   ├── types/             # Định nghĩa kiểu dữ liệu
  │   └── App.tsx, index.tsx # Khởi tạo app
  ├── package.json
  └── README.md
```

## Công nghệ sử dụng
- React 18 + TypeScript
- Mantine UI (component, notification, theme)
- Redux Toolkit, Redux Saga
- React Router v6
- Axios
- FastAPI (backend, không nằm trong repo này)

## Scripts
- `npm start` — Chạy dev server
- `npm run build` — Build production
- `npm test` — Chạy test
- `npm run eject` — Eject cấu hình CRA

## Backend API
- Yêu cầu backend FastAPI hỗ trợ CORS, JWT, các endpoint quản lý user, exam set, upload file, chấm điểm.
- Cấu hình endpoint qua biến môi trường `REACT_APP_API_URL`.

## Đóng góp/phát triển
- Fork, clone repo về máy.
- Tạo branch mới cho mỗi tính năng/bugfix.
- Pull request về nhánh `main`.

---

Mọi thắc mắc/hỗ trợ vui lòng liên hệ admin hoặc tạo issue trên GitHub.
