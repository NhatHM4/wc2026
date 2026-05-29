# World Cup 2026 Betting Application

Ứng dụng cá cược tỉ số World Cup 2026 với Backend Spring Boot và Frontend React TypeScript, chạy cơ sở dữ liệu PostgreSQL.

## Yêu cầu hệ thống
- Docker & Docker Compose
- Node.js v20+
- Java JDK 17

## Hướng dẫn chạy nhanh bằng Docker
Chạy toàn bộ ứng dụng (Postgres, Backend, Frontend) chỉ bằng một câu lệnh:
```bash
docker compose up -d --build
```
- **Frontend**: Truy cập tại `http://localhost:3000`
- **Backend API**: Truy cập tại `http://localhost:8080`
- **Database**: PostgreSQL chạy tại cổng `5432`

## Chạy cục bộ từng phần để phát triển (Development)

### 1. Khởi động Cơ sở dữ liệu
```bash
docker compose up -d postgres
```

### 2. Chạy Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```

### 3. Chạy Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
```
Truy cập Frontend ở cổng mặc định: `http://localhost:5173`

## Tích hợp liên tục (CI)
Dự án cấu hình tự động kiểm tra biên dịch và test thông qua GitHub Actions ở mỗi lượt push/pull request lên nhánh `main`/`master` (cấu hình tại `.github/workflows/ci.yml`).
