# 🎮 GDG Game Arcade — Tài liệu chi tiết các trò chơi

Web tổ hợp **9 trò chơi** của CLB Google Developer Group on Campus (HUST).
Mỗi game là 1 thư mục riêng trong `src/games/<slug>/`, gắn vào trang `/games/<slug>`.

---

## Tổng quan

| # | Game | Thể loại | Trạng thái | Thư mục |
|---|------|----------|-----------|---------|
| 1 | Minesweeper | Logic | ✅ Hoàn thành | `src/games/minesweeper/` |
| 2 | Wordle | Đoán từ | ✅ Hoàn thành | `src/games/wordle/` |
| 3 | Sequence Memory | Nhớ | ✅ Hoàn thành | `src/games/sequence-memory/` |
| 4 | Dino Run | Endless runner | ✅ Hoàn thành | `src/games/dino-run/` |
| 5 | Othello | Chiến thuật | ✅ Hoàn thành | `src/games/othello/` |
| 6 | Guess Who | Suy luận | ✅ Hoàn thành | `src/games/guess-who/` |
| 7 | Tetris | Puzzle | ✅ Hoàn thành | `src/games/tetris/` |
| 8 | Math Blaster | Tính toán | ✅ Hoàn thành | `src/games/math-blaster/` |
| 9 | Stroop Test | Phản xạ | ✅ Hoàn thành | `src/games/stroop-test/` |

> Registry game: `src/lib/games.ts` (slug, tên, mô tả, icon, màu).
> Trang game dynamic: `src/app/games/[slug]/page.tsx`.

---

## 1. Minesweeper 💣

**Thể loại:** Logic · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- **Click trái** mở ô, **click phải** cắm/gỡ cờ.
- Ô hiện số = số mìn kề bên (8 hướng). Dùng logic suy luận.
- Mở trúng mìn = thua. Mở hết ô không có mìn = thắng.

### Cơ chế
- **3 độ khó** (`DIFFICULTIES`):
  - Dễ: 9×9, 10 mìn
  - Trung bình: 16×16, 40 mìn
  - Khó: 16×30, 99 mìn
- **Mìn đặt sau click đầu tiên** — ô đầu tiên luôn an toàn (không nổ ngay).
- **Flood fill** (BFS bằng stack): mở ô trống (adjacent=0) lan rộng vùng.
- **Timer** đếm giây (bắt đầu từ click đầu tiên), **đếm mìn còn lại** = mìn − cờ.
- Số 1-8 có màu chuẩn Minesweeper (`NUMBER_COLORS`).

### API — `logic.ts` (thuần logic, test được bằng node)
| Hàm | Mô tả |
|-----|-------|
| `createEmptyBoard(rows, cols)` | Tạo board trống (mọi ô hidden, không mìn) |
| `placeMines(board, mines, safeRow, safeCol)` | Đặt mìn ngẫu nhiên (Fisher-Yates), loại trừ ô an toàn, tính adjacent |
| `countAdjacent(board, row, col)` | Đếm mìn 8 ô kề |
| `revealCell(board, row, col)` | Mở ô + flood fill (trả board mới, immutable) |
| `toggleFlag(board, row, col)` | Cắm/gỡ cờ |
| `revealAllMines(board)` | Hiện toàn bộ mìn (khi thua) |
| `checkWin(board)` | Kiểm tra thắng (mọi ô không mìn đã mở) |
| `countFlags(board)` | Đếm số cờ |

### State — `minesweeper.tsx`
| State | Kiểu | Mô tả |
|-------|------|-------|
| `difficulty` | `Difficulty` | Độ khó hiện tại |
| `board` | `Board` | Bàn cờ (immutable, mỗi thay đổi tạo board mới) |
| `status` | `"playing" \| "won" \| "lost"` | Trạng thái game |
| `minesPlaced` | `boolean` | Đã đặt mìn chưa (sau click đầu) |
| `time` | `number` | Số giây đã chơi |

### UI
- Nút chọn độ khó (pill), thanh thông tin (cờ + timer + nút chơi lại).
- Board dùng CSS grid `repeat(cols, minmax(0,1fr))`, ô 32-36px.
- Thắng = `PartyPopper` xanh lá, thua = `Skull` đỏ.

---

## 2. Wordle 🔤

**Thể loại:** Đoán từ · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Đoán từ tiếng Anh **5 chữ** trong **6 lượt**.
- Gợi ý màu: 🟩 đúng vị trí · 🟨 có trong từ sai vị trí · ⬜ không có.
- Gõ bằng **bàn phím thật** hoặc **keyboard ảo** trên màn hình.

### Cơ chế
- **2 chế độ** (`GameMode`):
  - `daily`: từ cố định theo ngày (seeded), cùng từ cho mọi người — tạo lý do quay lại.
  - `unlimited`: từ ngẫu nhiên mỗi ván.
- **Từ điển local** 12.974 từ: `ANSWER_WORDS` (2.315 đáp án) + `VALID_WORDS` (10.657 từ hợp lệ). Không cần API.
- **So màu chuẩn Wordle**: xử lý trùng chữ bằng đếm số lần xuất hiện còn lại.
  - Ví dụ `APPLE` vs `PAPER` → `[present, present, correct, present, absent]`.
- **Keyboard ảo** đổi màu theo trạng thái đã dùng, ưu tiên `correct > present > absent`.
- Hiệu ứng **shake** khi từ không hợp lệ.
- **Chống lỗi focus**: mọi nút dùng `onMouseDown preventDefault` — Enter không gõ thêm chữ vào lượt sau.

### API — `logic.ts`
| Hàm | Mô tả |
|-----|-------|
| `isValidWord(word)` | Kiểm tra từ có trong từ điển |
| `getDailyWord(date?)` | Từ hằng ngày (index theo ngày từ 1/1/2024) |
| `getRandomWord()` | Từ ngẫu nhiên từ ANSWER_WORDS |
| `evaluateGuess(guess, target)` | So màu chuẩn Wordle (trả `LetterState[]`) |
| `getDailyNumber(date?)` | Số thứ tự ngày (cho hiển thị `#970`) |

### State — `wordle.tsx`
| State | Kiểu | Mô tả |
|-------|------|-------|
| `mode` | `GameMode` | daily / unlimited |
| `target` | `string` | Từ cần đoán |
| `board` | `TileData[][]` | 6×5, mỗi tile có char + state |
| `currentRow` | `number` | Hàng đang gõ |
| `currentGuess` | `string` | Chữ đang gõ (hiện live trên hàng hiện tại) |
| `gameOver` / `won` | `boolean` | Trạng thái kết thúc |
| `keyStates` | `Record<string, LetterState>` | Màu từng phím keyboard |

### UI
- Board 6×5, tile 56-64px, `uppercase`, màu theo state.
- Keyboard 3 hàng QWERTY + Enter/Backspace (icon lucide).
- Thắng = `PartyPopper`, thua = `Lightbulb` + hiện từ đúng.

---

## 3. Sequence Memory 🧠

**Thể loại:** Nhớ · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Lưới **3×3**, các ô sáng lên tuần tự theo 1 dãy ngẫu nhiên.
- Click lại **đúng thứ tự**. Đúng → level tăng, dãy dài thêm 1 ô.
- Click sai → game over, hiện level đạt được.

### Cơ chế
- Level 1 = 1 ô, mỗi level +1 ô (dãy tích lũy).
- Ô sáng **xanh dương** khi hiện dãy, **xanh lá** khi người chơi click.
- **800ms nghỉ** giữa hoàn thành level và hiện dãy tiếp theo (đủ thời gian nhận biết).
- **Kỷ lục** lưu localStorage key `sequence-memory-best`.
- **Cleanup timer**: mọi `setTimeout` đưa vào `timersRef`, clear khi reset/unmount.

### Hằng số
| Hằng | Giá trị | Mô tả |
|------|--------|-------|
| `GRID_SIZE` | 3 | Lưới 3×3 |
| `CELLS` | 9 | Số ô |
| `SHOW_MS` | 500 | Thời gian 1 ô sáng |
| `GAP_MS` | 200 | Khoảng cách giữa 2 ô |

### State
| State | Kiểu | Mô tả |
|-------|------|-------|
| `phase` | `"idle" \| "showing" \| "input" \| "gameover"` | Trạng thái game |
| `sequence` | `number[]` | Dãy ô cần nhớ |
| `activeCell` | `number \| null` | Ô đang sáng (hiện dãy) |
| `inputIndex` | `number` | Vị trí người chơi đang click |
| `level` / `best` | `number` | Level hiện tại / kỷ lục |

---

## 4. Dino Run 🦖

**Thể loại:** Endless runner · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Nhảy qua chướng ngại vật, càng chạy xa càng nhiều điểm.
- **SPACE / ↑** nhảy · **↓** cúi (né chim) · **chạm** nhảy (mobile).

### Cơ chế
- **Sprite gốc Chromium** (`public/games/dino/sprite.png`, 1233×68 grayscale) — dino, cactus, chim, mây, mặt đất chuẩn Google.
- **3 loại chướng ngại**: xương rồng (nhảy) · chim bay (cúi) · khối bay.
- **3 power-up**: 🧲 nam châm (hút điểm) · 🛡 khiên (chịu 1 va) · ⚡ tăng tốc.
- **Tốc độ tăng dần** theo điểm, có `MAX_SPEED` giới hạn.
- **Night mode**: đổi theme tối khi điểm > 500.
- **Combo/Streak**: né liên tiếp nhân điểm (x2, x3...).
- **Parallax**: mây + mặt đất chuyển tốc độ khác nhau.
- **Chuẩn hóa 60fps** (`dtScale = dt / 16.67`) — chạy đúng tốc độ trên mọi màn hình (fix lỗi chạy nhanh trên 120Hz/144Hz).
- **2.5s đầu không có chướng ngại** — thời gian làm quen.
- **Kỷ lục** lưu localStorage key `dino-run-best`.

### Hằng số
| Hằng | Giá trị | Mô tả |
|------|--------|-------|
| `W` / `H` | 800 / 300 | Kích thước canvas |
| `GROUND_Y` | 250 | Vị trí mặt đất |
| `GRAVITY` | 0.6 | Trọng lực |
| `JUMP_V` | -13 | Vận tốc nhảy |
| `BASE_SPEED` | 3 | Tốc độ ban đầu |
| `MAX_SPEED` | 7 | Tốc độ tối đa |

### Sprite tọa độ (từ Chromium)
| Phần | x | w | h |
|------|---|----|----|
| TREX | 848 | 44 | 47 |
| CACTUS_SMALL | 228 | 17 | 35 |
| CACTUS_LARGE | 332 | 25 | 50 |
| PTERO (chim) | 134 | 46 | 40 |
| CLOUD | 86 | 46 | 14 |
| HORIZON (mặt đất) | 2 | 600 | 12 |

### Game loop (trong `g.current` ref)
- `update(dt)` — physics, spawn, collision, score, power-up.
- `draw()` — vẽ background, obstacles, dino, particles.
- `loop(time)` — `requestAnimationFrame`, `dt = min(50, time - lastTime)`.

### State (React, sync từ ref qua `syncUI`)
| State | Kiểu | Mô tả |
|-------|------|-------|
| `phase` | `"idle" \| "playing" \| "gameover"` | Trạng thái |
| `score` / `best` | `number` | Điểm / kỷ lục |
| `shield` / `magnet` / `speedBoost` | `boolean` | Power-up đang hoạt động |
| `combo` | `number` | Cấp combo |

---

## 5. Othello ⚫

**Thể loại:** Chiến thuật · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Bàn cờ chuẩn 8×8, 2 người chơi (hoặc đấu với AI).
- Đặt quân để kẹp quân đối thủ theo hàng ngang, dọc hoặc chéo và lật thành màu của mình.
- Bên nào nhiều quân hơn khi hết nước đi sẽ giành chiến thắng.

### Cơ chế
- **2 Chế độ chơi**: Đấu với AI (`pve`) hoặc 2 người chơi trên cùng thiết bị (`pvp`).
- **AI Minimax + Alpha-Beta Pruning**: 3 cấp độ (Dễ, Vừa, Khó).
  - Sử dụng ma trận trọng số ô góc và biên (`POSITION_WEIGHTS`).
  - Đánh giá khả năng cơ động (`mobility`) và tỷ lệ quân cờ (`parity`).
- **Gợi ý nước đi**: Hiển thị chấm sáng tinh tế trên các ô hợp lệ.
- **Tự động xử lý bỏ lượt (Pass)** khi một bên không còn nước đi hợp lệ.
- Hiệu ứng âm thanh retro (Web Audio API) khi đặt quân và chiến thắng.
- Kỷ lục số trận thắng lưu tại localStorage key `othello-best`.

---

## 6. Guess Who 🕵️

**Thể loại:** Suy luận · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Hệ thống chọn ngẫu nhiên 1 sản phẩm / linh vật bí ẩn của Google (trong số 16 nhân vật).
- Người chơi đặt câu hỏi suy luận (theo danh mục hoặc gõ tự do) để nhận câu trả lời ĐÚNG / SAI.
- Dùng logic để loại trừ các thẻ không thỏa mãn, sau đó bấm **Đoán** để tìm ra nhân vật bí ẩn.

### Cơ chế
- **Bộ dữ liệu 16 sản phẩm Google & GDG** (`CHARACTERS`): Gemini, Chrome, Android, YouTube, Gmail, Flutter, Google Maps, TensorFlow, Google Drive, Go, Dino, Google Cloud, Pixel, Google Dịch, Photos, GDG on Campus.
- **Hệ thống câu hỏi theo 4 nhóm thuộc tính**: Thể loại sản phẩm, Đặc điểm & Linh vật, Màu sắc nhận diện, Thời gian ra mắt.
- **Bộ nhận diện ngôn ngữ tự nhiên (NLP Query Matcher)**: Hỗ trợ gõ câu hỏi tự do bằng tiếng Việt hoặc tiếng Anh.
- **Chế độ tự động úp thẻ**: Tự động loại trừ các thẻ không hợp lệ dựa theo câu trả lời (hoặc úp/mở thủ công).
- Giới hạn 3 lần đoán sai (❌ strikes), điểm số tối đa 1000đ (trừ điểm theo số câu hỏi và cảnh cáo).
- Kỷ lục lưu tại localStorage key `guess-who-best`.

---

## 7. Tetris 🧱

**Thể loại:** Puzzle · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Điều khiển các khối tetromino rơi tự do từ trên xuống lưới ma trận 10×20.
- Xoay và dịch chuyển khối sao cho các ô lấp đầy hoàn chỉnh các hàng ngang để ghi điểm và xóa dòng.
- Xóa cùng lúc 4 hàng để đạt cú **TETRIS** điểm thưởng tối đa! Trò chơi kết thúc khi các khối chất đống chạm nóc màn hình.

### Cơ chế
- **7 Khối Tetromino tiêu chuẩn** mang bảng màu Google Material 3 (I: Blue, J: Deep Blue, L: Amber, O: Yellow, S: Green, T: Purple, Z: Red).
- **Bộ tạo ngẫu nhiên 7-Bag Randomizer**: Đảm bảo phân phối công bằng các khối, tránh tình trạng chờ lâu không có thanh I.
- **Hệ thống xem trước điểm rơi (Ghost Piece)**: Hiển thị hình chiếu vị trí khối sẽ tiếp đất.
- **Hàng đợi Tiếp theo (Next Queue)**: Xem trước 3 khối tiếp theo để tính toán chiến thuật.
- **Ô Giữ Khối (Hold Queue)**: Bấm phím `C` hoặc `Shift` để lưu trữ khối hiện tại và hoán đổi khi cần.
- **Rơi nhanh (Soft Drop) & Thả tức thì (Hard Drop)**: Bấm `↓` để rơi nhanh nhận thêm điểm, bấm `Space` để thả ghim khối ngay lập tức.
- **Hệ thống âm thanh Web Audio**: Hiệu ứng di chuyển, xoay khối, va đập, xóa dòng và hợp âm ăn 4 dòng TETRIS.
- **Hỗ trợ cảm ứng Mobile**: Bộ điều khiển ảo với các phím Trái, Phải, Rơi, Xoay, Drop, Hold.
- Kỷ lục điểm cao lưu tại localStorage key `tetris-best`.

---

## 8. Math Blaster 🧮

**Thể loại:** Tính toán · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Phép tính toán học xuất hiện nhanh trên màn hình, người chơi chọn 1 trong 4 đáp án.
- Thời gian đếm ngược liên tục: Đúng +điểm +thêm thời gian (2.5s), Sai −3.5s và ngắt combo streak.
- Cố gắng giữ chuỗi đúng liên tiếp để kích hoạt hệ số nhân điểm (x2, x3, x4, x5).

### Cơ chế
- **4 Cấp độ độ khó tăng dần theo điểm số** (`generateQuestion`):
  - *Cấp 1*: Phép cộng trừ số nguyên (10 - 60).
  - *Cấp 2*: Bảng nhân chia mở rộng.
  - *Cấp 3*: Phương trình tìm ẩn số x (`? + 24 = 63`, `15 × ? = 75`).
  - *Cấp 4*: Biểu thức hỗn hợp 2 bước tính có dấu ngoặc đơn.
- **Tạo đáp án nhiễu thông minh**: Sinh các phương án sai cận kề đáp án đúng.
- **Phím tắt nhanh**: Bấm phím `1`, `2`, `3`, `4` để chọn ngay đáp án không cần chuột.
- Thống kê cuối trận: Tổng điểm, số câu đúng, streak lớn nhất.
- Kỷ lục lưu tại localStorage key `math-blaster-best`.

---

## 9. Stroop Test 🎨

**Thể loại:** Phản xạ · **Trạng thái:** ✅ Hoàn thành

### Cách chơi
- Dựa trên hiện tượng tâm lý học nhận thức **Stroop Effect**: Não bộ bị xung đột giữa nghĩa của chữ và màu mực hiển thị.
- Đọc kỹ yêu cầu trên thẻ (Chọn màu mực, chọn nghĩa của từ, hoặc màu hình dạng) và chọn nút màu tương ứng thật nhanh.

### Cơ chế
- **4 Màu chuẩn Google**: Xanh dương (`#4285f4`), Đỏ (`#ea4335`), Vàng (`#fbbc04`), Xanh lá (`#34a853`).
- **Nhiều biến thể thử thách**:
  - *Màu mực*: Bỏ qua chữ viết, chọn màu mực in chữ.
  - *Ý nghĩa*: Bỏ qua màu mực, chọn nghĩa thực của từ.
  - *Hình dạng*: Chọn màu sắc của các hình biểu tượng (hình tròn, vuông, tam giác, ngôi sao).
- **Đo lường thời gian phản xạ thời gian thực** (miligiây ms). Trả lời dưới 450ms nhận điểm thưởng tốc độ tối đa!
- **Đánh giá chỉ số phản xạ nhận thức**: *Phản xạ thần thánh ⚡*, *Nhanh như chớp 🎯*, *Phản xạ khá tốt 👍*.
- Phím tắt bàn phím: `1/Q`, `2/W`, `3/E`, `4/R`.
- Kỷ lục lưu tại localStorage key `stroop-test-best`.

---

## Kiến trúc chung

```
src/
├── app/
│   ├── page.tsx              # Trang chủ arcade (9 game cards)
│   ├── games/[slug]/page.tsx # Trang game dynamic
│   └── leaderboard/          # Bảng xếp hạng
├── components/
│   ├── layout/               # Header, ThemeProvider
│   └── ui/                   # GameIcon
├── games/<slug>/             # Mỗi game 1 thư mục
├── lib/games.ts              # Registry 9 game
└── db/                       # Prisma (chưa dùng)
```

### Quy ước mỗi game
- **`logic.ts`** — thuần logic, không phụ thuộc React (test được bằng node).
- **`<game>.tsx`** — UI component (client component, `"use client"`).
- Gắn vào `src/app/games/[slug]/page.tsx` bằng `slug === "..." ? <Game /> : ...`.
- **High score** lưu localStorage (key: `<slug>-best`).
- Nút bấm dùng `onMouseDown preventDefault` để tránh giữ focus (lỗi Enter gõ thêm chữ).
- **Immutable state**: mỗi thay đổi board tạo mảng mới (không mutate).

### Design (xem `DESIGN.md`)
- Material 3 + 4 màu Google (blue/red/yellow/green).
- Roboto font, tabular-nums cho điểm số.
- Light/dark theme (View Transitions API loang).
