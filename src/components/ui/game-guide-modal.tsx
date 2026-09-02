"use client";

import { useState } from "react";
import { HelpCircle, X, CheckCircle2, Gamepad2, Lightbulb } from "lucide-react";

export interface GameGuide {
  title: string;
  objective: string;
  rules: string[];
  controls: { key: string; action: string }[];
  tips: string[];
}

export const GAME_GUIDES: Record<string, GameGuide> = {
  minesweeper: {
    title: "Hướng dẫn chơi Minesweeper (Dò mìn)",
    objective: "Mở tất cả các ô an toàn trên bản đồ mà không kích nổ bất kỳ quả mìn nào.",
    rules: [
      "Con số trên ô cho biết chính xác số lượng quả mìn ẩn nấp ở 8 ô xung quanh.",
      "Ô không có mìn lân cận (ô trống) sẽ tự động kích hoạt hiệu ứng mở lan (flood-fill).",
      "Lần đào ô đầu tiên luôn an toàn 100%, hệ thống tự động di dời mìn nếu trúng.",
    ],
    controls: [
      { key: "Chuột trái / Chạm", action: "Đào mở ô (hoặc cắm cờ nếu đang bật chế độ cắm cờ)" },
      { key: "Chuột phải", action: "Cắm cờ / Gỡ cờ đánh dấu vị trí nghi ngờ có mìn" },
      { key: "Nút Đào / Cắm cờ", action: "Chuyển đổi chế độ thao tác tiện lợi trên điện thoại" },
    ],
    tips: [
      "Khi một ô số có số cờ xung quanh bằng đúng số của nó, các ô còn lại xung quanh chắc chắn an toàn!",
      "Hãy bắt đầu từ 4 góc hoặc vùng trống mở lan rộng để thu thập thông tin logic.",
    ],
  },
  wordle: {
    title: "Hướng dẫn chơi Wordle (Đoán từ)",
    objective: "Đoán chính xác từ khóa tiếng Anh có 5 chữ cái trong tối đa 6 lượt thử.",
    rules: [
      "Mỗi lần đoán phải là một từ tiếng Anh 5 chữ cái hợp lệ có trong từ điển.",
      "Sau mỗi lượt đoán, màu sắc của các ô chữ sẽ thay đổi để cung cấp manh mối:",
      "• Màu Xanh lá: Chữ cái xuất hiện trong từ và nằm đúng vị trí.",
      "• Màu Vàng: Chữ cái có trong từ nhưng đang nằm sai vị trí.",
      "• Màu Xám: Chữ cái hoàn toàn không xuất hiện trong từ khóa.",
    ],
    controls: [
      { key: "A - Z", action: "Nhập chữ cái (trên bàn phím vật lý hoặc bàn phím ảo)" },
      { key: "Enter", action: "Gửi lượt đoán để kiểm tra kết quả" },
      { key: "Backspace", action: "Xóa chữ cái vừa gõ" },
    ],
    tips: [
      "Lượt đoán đầu tiên nên chọn từ chứa nhiều nguyên âm phổ biến (như ARISE, AUDIO, TEARS).",
      "Chú ý một chữ cái có thể xuất hiện 2 lần trong cùng một từ (ví dụ: SPEED, APPLE).",
    ],
  },
  "sequence-memory": {
    title: "Hướng dẫn Sequence Memory (Trí nhớ chuỗi)",
    objective: "Ghi nhớ và nhấn lại chính xác chuỗi ô phát sáng theo nhịp điệu tăng dần.",
    rules: [
      "Mỗi cấp độ, hệ thống sẽ phát lại toàn bộ chuỗi cũ và thêm vào 1 ô sáng mới.",
      "Người chơi chỉ được bấm khi chuỗi hiển thị mẫu đã hoàn tất.",
      "Chỉ cần bấm sai 1 ô duy nhất, lượt chơi sẽ kết thúc ngay lập tức.",
    ],
    controls: [
      { key: "Click / Chạm ô", action: "Bấm vào ô tương ứng trong lưới 3×3 theo đúng thứ tự đã xem" },
    ],
    tips: [
      "Mỗi ô có một cao độ âm thanh riêng biệt. Bạn có thể kết hợp ghi nhớ bằng giai điệu âm nhạc thay vì chỉ dùng thị giác.",
      "Hình dung đường di chuyển của ngón tay nối giữa các ô để tạo thành sơ đồ ghi nhớ.",
    ],
  },
  "dino-run": {
    title: "Hướng dẫn chơi Dino Run (Khủng long sa mạc)",
    objective: "Điều khiển chú khủng long T-Rex chạy càng xa càng tốt, né tránh xương rồng và dực long.",
    rules: [
      "Tốc độ chạy sẽ tự động tăng dần theo thời gian và điểm số.",
      "Dực long Pterodactyl sẽ xuất hiện từ 250 điểm trở lên với 3 độ cao khác nhau.",
      "Cứ mỗi 100 điểm, bạn sẽ nghe thấy tiếng ting ting báo mốc kỷ lục. Cứ mỗi 700 điểm, trời sẽ chuyển sang đêm với mặt trăng lưỡi liềm và các vì sao.",
      "Nhặt ngọc Khiên Bảo Hộ trên đường để tạo lớp màng năng lượng bảo vệ bạn khỏi 1 lần va chạm tử thần.",
    ],
    controls: [
      { key: "Space / Phím ↑", action: "Nhảy lên (Giữ phím lâu hơn để nhảy cao hơn)" },
      { key: "Phím ↓", action: "Cúi người né dực long bay tầm trung hoặc rơi nhanh khi đang trên không" },
      { key: "Chạm màn hình", action: "Nhảy trên thiết bị cảm ứng điện thoại" },
    ],
    tips: [
      "Nhặt Khiên Năng Lượng khi xuất hiện để có thêm 1 mạng sống miễn phí!",
      "Hãy thử chế độ Turbo Nitro để xuất phát ngay ở tốc độ cao và nhận thưởng hệ số điểm x1.5!",
      "Tùy biến ngoại trang Khủng long: Kính râm cực ngầu, Vương miện hoàng gia hoặc Android Robot.",
    ],
  },
  othello: {
    title: "Hướng dẫn chơi Othello (Cờ lật Reversi)",
    objective: "Kết thúc ván cờ với số lượng quân màu của mình nhiều hơn đối thủ trên bàn cờ 8×8.",
    rules: [
      "Bạn chỉ được đặt quân vào ô mà tại đó kẹp được ít nhất một quân của đối thủ giữa quân mới đặt và một quân cùng màu đã có từ trước.",
      "Tất cả quân địch bị kẹp theo hàng ngang, hàng dọc hoặc đường chéo sẽ bị lật màu sang quân của bạn.",
      "Nếu không có nước đi hợp lệ nào, lượt chơi sẽ tự động chuyển cho đối thủ.",
    ],
    controls: [
      { key: "Chuột trái / Chạm", action: "Đặt quân vào các ô có vòng tròn đánh dấu nước đi hợp lệ" },
    ],
    tips: [
      "4 ô góc bàn cờ (A1, A8, H1, H8) là vị trí bất khả xâm phạm! Ai chiếm được góc sẽ có lợi thế cực lớn.",
      "Đừng ham ăn nhiều quân ở giai đoạn đầu trận; hãy giữ ít quân và kiểm soát các ô viền ngoài.",
    ],
  },
  "guess-who": {
    title: "Hướng dẫn chơi Guess Who (Đoán nhân vật Google)",
    objective: "Tìm ra sản phẩm / linh vật bí ẩn của Google trong số 16 ứng viên trước khi bị 3 gậy phạt.",
    rules: [
      "Chọn các câu hỏi gợi ý có sẵn hoặc gõ câu hỏi tự do để nhận câu trả lời ĐÚNG hoặc SAI.",
      "Mỗi câu hỏi sẽ tiêu tốn một lượng điểm nhất định.",
      "Bấm 'Đoán' khi bạn đã tự tin xác định được chân tướng nhân vật. Đoán sai sẽ nhận 1 gậy (❌) và bị trừ 250 điểm.",
    ],
    controls: [
      { key: "Click vào thẻ", action: "Lật úp / Lật mở thủ công thẻ bài bị loại trừ" },
      { key: "Nút Đoán trên thẻ", action: "Đưa ra phán quyết nhân vật bí ẩn" },
    ],
    tips: [
      "Sau mỗi câu trả lời ĐÚNG/SAI, hãy nhấp vào các thẻ bài để tự tay lật úp những ứng viên không phù hợp.",
      "Nên hỏi những câu hỏi có tính chất phân đôi (như Năm ra mắt, Màu sắc chủ đạo) để loại trừ 50% số thẻ trong 1 lượt.",
    ],
  },
  tetris: {
    title: "Hướng dẫn chơi Tetris (Xếp hình cổ điển)",
    objective: "Điều khiển các khối tetromino rơi xuống, lấp đầy các hàng ngang để xóa dòng và ghi điểm tối đa.",
    rules: [
      "Các hàng ngang được lấp kín hoàn toàn sẽ tự động biến mất và cộng điểm.",
      "Cứ mỗi 10 dòng xóa được sẽ thăng cấp (Level up), khiến tốc độ rơi nhanh dần.",
      "Trò chơi kết thúc khi các khối chất đống chạm nóc bàn chơi.",
    ],
    controls: [
      { key: "← / → (A / D)", action: "Di chuyển khối sang trái / phải" },
      { key: "↑ / W / X", action: "Xoay khối theo chiều kim đồng hồ" },
      { key: "Z", action: "Xoay khối ngược chiều kim đồng hồ" },
      { key: "↓ / S", action: "Rơi nhanh (Soft drop - nhận +1 điểm/hàng)" },
      { key: "Space", action: "Thả ghim tức thì (Hard drop - nhận +2 điểm/hàng)" },
      { key: "C / Shift", action: "Giữ khối chiến lược (Hold)" },
      { key: "P / Esc", action: "Tạm dừng / Tiếp tục ván chơi" },
    ],
    tips: [
      "Dành riêng 1 cột ngoài cùng bên phải để xếp các khối khác, sau đó dùng thanh dài I để xóa cùng lúc 4 hàng (TETRIS) nhận điểm thưởng khổng lồ!",
      "Tận dụng hình chiếu bóng mờ (Ghost Piece) để căn vị trí rơi chuẩn xác mà không sợ đặt nhầm.",
    ],
  },
  "math-blaster": {
    title: "Hướng dẫn Math Blaster (Bắn toán siêu tốc)",
    objective: "Tính nhẩm và chọn đáp án chính xác trước khi thanh thời gian cạn kiệt.",
    rules: [
      "Mỗi câu trả lời đúng cộng thêm điểm và hồi phục +2.5 giây.",
      "Trả lời sai bị trừ −3.5 giây và làm đứt chuỗi combo liên tiếp.",
      "Đúng liên tiếp sẽ nhân hệ số điểm combo: x2 (từ 3 câu), x3 (từ 6 câu), x4 (từ 10 câu), x5 (từ 15 câu).",
    ],
    controls: [
      { key: "Phím 1, 2, 3, 4", action: "Chọn đáp án tương ứng cực nhanh trên bàn phím" },
      { key: "Click / Chạm", action: "Bấm trực tiếp vào ô đáp án" },
    ],
    tips: [
      "Tính toán chữ số hàng đơn vị trước để loại trừ nhanh các đáp án sai.",
      "Cố gắng giữ bình tĩnh khi thời gian báo đỏ, một câu trả lời đúng sẽ giúp bạn hồi máu kịp thời!",
    ],
  },
  "stroop-test": {
    title: "Hướng dẫn Stroop Test (Thử thách phản xạ)",
    objective: "Chọn đúng màu mực hiển thị của chữ cái hoặc hình dạng trong vòng 40 giây.",
    rules: [
      "Não bộ có xu hướng đọc ngữ nghĩa của chữ thay vì nhận diện màu sắc thực tế (Hiệu ứng Stroop).",
      "Nhiệm vụ của bạn: Bỏ qua ý nghĩa chữ viết, chỉ nhìn vào MÀU MỰC hiển thị và bấm màu tương ứng!",
      "Mỗi câu trả lời đúng tăng hệ số combo (tối đa x5) và cộng điểm tốc độ.",
    ],
    controls: [
      { key: "1 / Q", action: "Màu Xanh dương (Google Blue)" },
      { key: "2 / W", action: "Màu Đỏ (Google Red)" },
      { key: "3 / E", action: "Màu Vàng (Google Yellow)" },
      { key: "4 / R", action: "Màu Xanh lá (Google Green)" },
    ],
    tips: [
      "Hãy nheo mắt nhẹ hoặc tập trung vào viền nét chữ thay vì đọc chữ để não không bị đánh lừa ngữ nghĩa!",
      "Đặt sẵn 4 ngón tay lên các phím 1, 2, 3, 4 để phản xạ với tốc độ dưới 400ms.",
    ],
  },
};

export function GameGuideModal({ slug }: { slug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const guide = GAME_GUIDES[slug];

  if (!guide) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-all hover:bg-surface-hover hover:text-foreground active:scale-95 shadow-sm"
        aria-label="Xem hướng dẫn chơi"
      >
        <HelpCircle className="h-3.5 w-3.5 text-primary" />
        <span>Hướng dẫn</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-border bg-surface p-6 shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Gamepad2 className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {guide.title}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-4 flex flex-col gap-4 text-xs sm:text-sm text-foreground">
              {/* Objective */}
              <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3.5">
                <span className="font-bold text-primary block mb-1">Mục tiêu chính</span>
                <p className="text-muted leading-relaxed">{guide.objective}</p>
              </div>

              {/* Rules */}
              <div>
                <span className="font-bold text-foreground block mb-2">Luật chơi & Cơ chế</span>
                <ul className="space-y-1.5 text-muted leading-relaxed">
                  {guide.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-google-green shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Controls */}
              <div>
                <span className="font-bold text-foreground block mb-2">Điều khiển & Phím tắt</span>
                <div className="grid grid-cols-1 gap-2">
                  {guide.controls.map((ctrl, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-background/50 px-3 py-2"
                    >
                      <kbd className="rounded border border-border bg-surface px-2 py-0.5 text-xs font-mono font-bold text-foreground">
                        {ctrl.key}
                      </kbd>
                      <span className="text-xs text-muted text-right ml-2">{ctrl.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl border border-google-yellow/30 bg-google-yellow/5 p-3.5">
                <div className="flex items-center gap-1.5 font-bold text-google-yellow mb-1.5">
                  <Lightbulb className="h-4 w-4" />
                  <span>Mẹo cao thủ</span>
                </div>
                <ul className="space-y-1 text-xs text-muted leading-relaxed">
                  {guide.tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-on-primary shadow-md transition-all hover:scale-105 active:scale-95"
              >
                Đã hiểu, bắt đầu chơi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
