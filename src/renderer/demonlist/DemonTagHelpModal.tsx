import React from 'react'
import { IoCloseOutline, IoInformationCircleOutline } from 'react-icons/io5'

interface GdTagHelpModalProps {
  onClose: () => void;
}

interface TagDesc {
  tag: string;
  category: string;
  description: string;
}

const TAG_DEFINITIONS: TagDesc[] = [
  // Phiên bản
  { tag: '2.2', category: 'Phiên bản', description: 'Được xây dựng hoặc cập nhật trong GD 2.2, áp dụng camera trigger, swing copter, shader, SFX mới.' },
  { tag: '2.1', category: 'Phiên bản', description: 'Tạo trong thời kỳ GD 2.1 (chiếm phần lớn các extreme demon nổi tiếng).' },
  { tag: '1.9 / 1.9PS', category: 'Phiên bản', description: 'Level phong cách cổ điển hoặc được xây dựng trên private server 1.9.' },

  // Thời lượng
  { tag: 'Long', category: 'Thời lượng', description: 'Thời lượng từ 1 đến 2 phút.' },
  { tag: 'XL / XXL', category: 'Thời lượng', description: 'Thời lượng siêu dài (trên 2 phút), đòi hỏi sự kiên nhẫn và độ ổn định tâm lý rất cao.' },

  // Gameplay & Kỹ năng
  { tag: 'Timings', category: 'Độ khó & Kỹ năng', description: 'Đòi hỏi sự chuẩn xác gần như tuyệt đối về thời điểm nhấp phím (micro-timing, frame-perfect).' },
  { tag: 'Chokepoints', category: 'Độ khó & Kỹ năng', description: 'Có những đoạn cực khó đột biến so với phần còn lại của màn (rất dễ chết ở 80% - 99%).' },
  { tag: 'High CPS', category: 'Độ khó & Kỹ năng', description: 'Yêu cầu tốc độ bấm phím cực nhanh (Clicks Per Second cao), spam nhấp chuột chuẩn xác.' },
  { tag: 'Nerve Control', category: 'Độ khó & Kỹ năng', description: 'Đòi hỏi khả năng giữ vững tâm lý và kiểm soát tim đập mạnh khi chơi về đoạn cuối màn.' },
  { tag: 'Fast-Paced', category: 'Độ khó & Kỹ năng', description: 'Gameplay tốc độ nhanh chóng mặt (thường là tốc độ 3x, 4x liên tục).' },
  { tag: 'Memory', category: 'Độ khó & Kỹ năng', description: 'Đòi hỏi phải học thuộc đường đi, né bẫy ẩn, fake blocks và mê cung.' },
  { tag: 'Dual', category: 'Độ khó & Kỹ năng', description: 'Đoạn điều khiển 2 icon cùng một lúc với các quỹ đạo bay/nhảy khác nhau.' },
  { tag: 'Consistency', category: 'Độ khó & Kỹ năng', description: 'Độ khó phân bổ đều toàn bộ màn chơi, yêu cầu kỹ năng ổn định từ đầu tới cuối.' },

  // Chế độ chơi
  { tag: 'Wave', category: 'Gamemode', description: 'Chế độ mũi tên Wave là phần gameplay chủ đạo, khe hẹp và tốc độ cao.' },
  { tag: 'Ship', category: 'Gamemode', description: 'Chế độ tàu bay (straight fly khe hẹp, gravity switches liên tục).' },
  { tag: 'Swing', category: 'Gamemode', description: 'Chế độ Swing Copter mới của bản 2.2.' },

  // Khác
  { tag: 'NONG', category: 'Âm nhạc', description: 'Not On Newgrounds - bài hát không có trên Newgrounds, người chơi cần tải thủ công file nhạc mp3 bỏ vào game.' },
  { tag: '2P', category: 'Đặc biệt', description: 'Two-Player mode: Cần 2 người chơi hoặc 1 người dùng 2 tay điều khiển 2 phím riêng biệt.' }
];

export default function GdTagHelpModal({ onClose }: GdTagHelpModalProps) {
  return (
    <div className="gd-modal-backdrop" onClick={onClose}>
      <div className="gd-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="gd-modal-header">
          <h2>
            <IoInformationCircleOutline size={22} color="#ff5e00" />
            <span>Ý nghĩa các Tag trong Geometry Dash</span>
          </h2>
          <button className="gd-modal-close-btn" onClick={onClose}>
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="gd-modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#aaa', lineHeight: 1.5 }}>
            Bảng giải thích thuật ngữ các thể loại gameplay và đặc điểm của các Extreme Demon trên Demonlist:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TAG_DEFINITIONS.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px', 
                  background: '#222', 
                  padding: '10px 14px', 
                  borderRadius: '6px',
                  border: '1px solid #2d2d2d'
                }}
              >
                <div style={{ minWidth: '90px' }}>
                  <span className="gd-tag-pill" style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700, color: '#ff7824', background: 'rgba(255, 94, 0, 0.15)' }}>
                    {item.tag}
                  </span>
                  <span style={{ display: 'block', fontSize: '10px', color: '#777', marginTop: '4px' }}>
                    {item.category}
                  </span>
                </div>
                <div style={{ flex: 1, fontSize: '13px', color: '#ddd', lineHeight: 1.4 }}>
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
