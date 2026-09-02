# 🎮 GDG Game Arcade

Nền tảng web tổ hợp **9 trò chơi** giải đố, chiến thuật và rèn luyện phản xạ của CLB **Google Developer Group on Campus (HUST)**. Được thiết kế theo chuẩn **Google Material Design 3** kết hợp nhận diện thương hiệu GDG.

---

## 🕹️ Danh Sách 9 Trò Chơi

| # | Trò chơi | Thể loại | Mô tả |
|---|---|---|---|
| 1 | **Minesweeper** | Logic | Dò mìn cổ điển 3 cấp độ, cơ chế chống nổ click đầu, BFS flood-fill và cắm cờ. |
| 2 | **Wordle** | Đoán từ | Đoán từ 5 chữ cái tiếng Anh trong 6 lượt (Daily & Unlimited mode), kho từ điển 12k+ từ. |
| 3 | **Sequence Memory** | Ghi nhớ | Lưới 3x3 ghi nhớ chuỗi ô sáng theo nhịp điệu tăng dần. |
| 4 | **Dino Run** | Endless runner | Khủng long sa mạc chuẩn Chromium physics, variable jump, fast drop, seamless horizon, retro audio. |
| 5 | **Othello** | Chiến thuật | Cờ lật 8x8, chế độ 2 người chơi (PvP) hoặc đấu với AI (Minimax + Alpha-Beta Pruning 3 cấp độ). |
| 6 | **Guess Who** | Suy luận | 16 sản phẩm Google/GDG bí ẩn, ngân hàng câu hỏi suy luận, NLP Matcher hỏi tự do, loại trừ thẻ logic. |
| 7 | **Tetris** | Puzzle | Xếp khối tetromino 7 màu Google, xoay khối, ghost piece, giữ khối và xóa dòng. |
| 8 | **Math Blaster** | Tính toán | Thử thách tính nhẩm nhanh áp lực thời gian, chuỗi combo x2 - x5, 4 cấp độ toán học. |
| 9 | **Stroop Test** | Phản xạ | Kiểm tra phản xạ nhận thức Stroop Effect với 4 màu Google, đo lường phản xạ thực tế (ms). |

---

## 🏆 Tính Năng Nổi Bật

- **Bảng Xếp Hạng Cá Nhân**: Tự động ghi nhận và lưu trữ kỷ lục của toàn bộ 9 trò chơi qua `localStorage`.
- **Hồ Sơ Game Thủ**: Cho phép tùy chỉnh biệt danh (Nickname GDG), theo dõi tổng điểm và mở khóa các huy hiệu danh dự (Hall of Fame).
- **Material Design 3 & Dark Theme**: Tự động thích ứng giao diện Sáng / Tối (Light & Dark mode).
- **Âm thanh Arcade sống động**: Tích hợp bộ tổng hợp âm thanh retro bằng Web Audio API không cần nạp file audio ngoài.
- **Tương thích Đa nền tảng**: Tối ưu phím tắt trên Desktop và nút cảm ứng to bản cho thiết bị di động (Touch targets ≥ 44px).

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Frontend**: [React 19](https://react.dev), [TypeScript 5](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (`@theme inline`, Material 3 Tokens)
- **Icons**: [Lucide React](https://lucide.dev)
- **Audio**: Web Audio API (Native browser synthesizer)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Chạy môi trường phát triển (Development server)**:
   ```bash
   npm run dev
   ```
   Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để trải nghiệm.

3. **Kiểm tra cú pháp & Linting**:
   ```bash
   npm run lint
   ```

4. **Biên dịch bản thương mại (Production build)**:
   ```bash
   npm run build
   npm run start
   ```

---

*Phát triển bởi CLB Google Developer Group on Campus.*
