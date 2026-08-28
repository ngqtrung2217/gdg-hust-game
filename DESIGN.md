# DESIGN.md — GDG Game Arcade

Design system cho web tổ hợp 9 game của CLB Google Developer Group on Campus.
Dựa trên **Google Material Design 3** + **GDG Brand Guidelines**.

## 1. Visual Theme & Atmosphere

- **Phong cách**: Material 3 — clean, playful, enterprise. Giao diện kiểu arcade hiện đại, không quá "gamey" (tránh neon, pixel art rối mắt).
- **Cảm giác**: vui tươi, dễ tiếp cận, phù hợp booth truyền thông — người chơi nhìn là hiểu ngay.
- **Hỗ trợ**: light + dark theme (Material 3 dynamic color).

## 2. Color System

### Brand colors (GDG / Google)

| Token | Hex | Role |
|---|---|---|
| google-blue | `#4285F4` | Primary / brand |
| google-red | `#EA4335` | Accent / danger |
| google-yellow | `#FBBC04` | Accent / highlight |
| google-green | `#34A853` | Success / correct |
| gdg-blue | `#0B57D0` | Primary dark variant |

### Material 3 tokens (light)

| Token | Hex | Role |
|---|---|---|
| primary | `#0B57D0` | Primary / brand |
| on-primary | `#FFFFFF` | Text on primary |
| background | `#FFFFFF` | Background |
| surface | `#F8F9FA` | Surface / cards |
| border | `#DADCE0` | Border |
| text | `#1F1F1F` | Text |
| text-muted | `#444746` | Muted text |
| accent | `#1A0DAB` | Accent |

### Material 3 tokens (dark)

| Token | Hex | Role |
|---|---|---|
| primary | `#8AB4F8` | Primary / brand |
| on-primary | `#062E6F` | Text on primary |
| background | `#202124` | Background |
| surface | `#292A2D` | Surface / cards |
| border | `#3C4043` | Border |
| text | `#E8EAED` | Text |
| text-muted | `#9AA0A6` | Muted text |
| accent | `#AECBFA` | Accent |

### Quy tắc dùng màu

- **4 màu Google** dùng cho: logo, icon game, streak/combo, phân biệt người chơi (Othello, Guess Who).
- **Không dùng quá 2 màu Google trong 1 màn hình game** — tránh rối.
- Màu đỏ chỉ dùng cho: sai, game over, nguy hiểm. Màu xanh lá chỉ dùng cho: đúng, thành công.
- Contrast tối thiểu WCAG AA (4.5:1 cho text).

## 3. Typography

- **Font**: Roboto (Google font) — headings + body. Fallback: system-ui, sans-serif.
- **Google Sans** (nếu có license) cho logo/title lớn — không bắt buộc.

| Style | Size | Weight | Use |
|---|---|---|---|
| Display | 48-64px | 700 | Trang chủ, game title |
| Headline | 28-36px | 600 | Tên game, score lớn |
| Title | 20-24px | 600 | Card game, section |
| Body | 16px | 400 | Nội dung chính |
| Label | 14px | 500 | Button, tab, badge |
| Caption | 12px | 400 | Hint, footer |

- Số điểm dùng **tabular-nums** (font-variant-numeric) để không nhảy chữ khi đếm.

## 4. Components & Patterns

- **Card game (arcade home)**: surface + border 1px + radius 16px + hover elevation. Icon game 48px, tên game, mô tả 1 dòng, badge thể loại.
- **Button**: Material 3 filled (primary) / tonal (secondary) / text. Radius 20px (pill). Min height 40px.
- **Board game**: grid ô vuông, border 1px, radius 8px, cell hover highlight. Kích thước ô tối thiểu 40px (touch-friendly).
- **Modal**: surface, radius 28px, backdrop blur + dim 50%.
- **Toast**: surface, radius 8px, bottom center, auto-dismiss 2s.
- **Badge thể loại**: pill, tonal, caption size.
- **Leaderboard**: bảng đơn giản, hàng highlight top 3 (vàng/bạc/đồng), avatar = chữ cái đầu.

## 5. Spacing & Layout

- **Hệ spacing 4px** (Material 3): 4, 8, 12, 16, 24, 32, 48, 64.
- **Container**: max-width 1200px, padding 16px mobile / 24px desktop.
- **Grid arcade home**: 1 cột mobile → 2 cột tablet → 3 cột desktop.
- **Game area**: căn giữa, max-width 600px, luôn fit viewport (không scroll ngang).
- **Header**: sticky, surface, height 64px, logo trái + theme toggle phải.

## 6. Motion & Interaction

- **Duration**: 150ms (micro) / 300ms (standard) / 500ms (celebrate).
- **Easing**: Material 3 standard — `cubic-bezier(0.2, 0, 0, 1)`.
- **Hover**: elevation +1, scale 1.02 (card game).
- **Press**: scale 0.98, ripple effect (Material).
- **Win/lose**: confetti hoặc shake nhẹ (300ms), không quá 1 lần/màn.
- **Countdown**: số đếm scale + fade (150ms mỗi số).
- **Giảm chuyển động**: tôn trọng `prefers-reduced-motion` — tắt confetti, dùng fade thay slide.

## 7. Accessibility

- Contrast WCAG AA tối thiểu.
- Toàn bộ game chơi được bằng **bàn phím** (tab, enter, space, arrow).
- Focus ring rõ ràng (2px, primary color, offset 2px).
- Không chỉ dùng màu để truyền đạt (kèm icon/text).
- Touch target ≥ 44px.
- `prefers-reduced-motion` hỗ trợ.

## 8. Game-specific notes

| Game | Màu chủ đạo | Ghi chú |
|---|---|---|
| Minesweeper | google-blue | Số 1-8 dùng màu chuẩn Minesweeper |
| Wordle | google-green/yellow | Đúng = green, sai vị trí = yellow |
| Memory Match | google-4 màu | Card back dùng logo GDG |
| Dino Run | google-green | Desert theme, dino pixel |
| Othello | google-blue vs google-red | 2 người chơi |
| Guess Who | google-blue | Avatar dùng màu Google |
| Sokoban | google-yellow | Box = yellow, target = green |
| Math Blaster | google-red | Timer đếm ngược |
| Stroop Test | google-4 màu | Màu chữ = 4 màu Google |
