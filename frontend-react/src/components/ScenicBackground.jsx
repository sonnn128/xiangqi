import React from 'react';

export function ScenicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Base deep warm antique dark-wood tone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 68% 18%, #2e2017 0%, #1a120d 42%, #0e0906 100%)',
        }}
      />

      {/* SVG Antique Scholar Chamber / Wood Desk ("Thư phòng kỳ án cổ phong") */}
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Wood tabletop plank gradient */}
          <linearGradient id="plankLight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#150f0c" />
            <stop offset="25%" stopColor="#251b14" />
            <stop offset="65%" stopColor="#2c2018" />
            <stop offset="100%" stopColor="#18110d" />
          </linearGradient>

          {/* Candle warm radial glow */}
          <radialGradient id="candleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe6a3" stopOpacity="0.88" />
            <stop offset="18%" stopColor="#ffb94f" stopOpacity="0.65" />
            <stop offset="42%" stopColor="#e27c1f" stopOpacity="0.32" />
            <stop offset="75%" stopColor="#96430b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1a120d" stopOpacity="0" />
          </radialGradient>

          {/* Soft candle flame gradient */}
          <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ff4500" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ffaa00" stopOpacity="0.95" />
            <stop offset="78%" stopColor="#fff2a8" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>

          {/* Dark wood shadow filter */}
          <filter id="deskDropShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.75" />
          </filter>
          <filter id="brushShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#050302" floodOpacity="0.75" />
          </filter>
        </defs>

        {/* 1. Dark antique wood table surface with subtle vertical seams */}
        <g opacity="0.95">
          {/* Plank seams */}
          <rect x="0" y="0" width="310" height="1000" fill="#18110d" />
          <line x1="310" y1="0" x2="310" y2="1000" stroke="#0a0604" strokeWidth="2.5" opacity="0.8" />
          <rect x="312" y="0" width="330" height="1000" fill="#1d1510" />
          <line x1="642" y1="0" x2="642" y2="1000" stroke="#0a0604" strokeWidth="2.5" opacity="0.8" />
          <rect x="644" y="0" width="340" height="1000" fill="#241913" />
          <line x1="984" y1="0" x2="984" y2="1000" stroke="#0a0604" strokeWidth="2.5" opacity="0.8" />
          <rect x="986" y="0" width="330" height="1000" fill="#201711" />
          <line x1="1316" y1="0" x2="1316" y2="1000" stroke="#0a0604" strokeWidth="2.5" opacity="0.8" />
          <rect x="1318" y="0" width="282" height="1000" fill="#19120e" />

          {/* Subtle wood grain fine streaks */}
          <path
            d="M80,0 Q110,400 90,1000 M210,0 Q240,600 230,1000 M430,0 Q410,500 440,1000 M560,0 Q580,450 550,1000 M750,0 Q790,650 770,1000 M910,0 Q880,500 900,1000 M1110,0 Q1140,550 1120,1000 M1240,0 Q1220,450 1250,1000 M1440,0 Q1460,500 1430,1000"
            stroke="#2e1f16"
            strokeWidth="1.2"
            fill="none"
            opacity="0.25"
          />
        </g>

        {/* 2. Top-Left: Antique Bookshelf, Thread-bound Books & Carved Wood Corner */}
        <g filter="url(#deskDropShadow)">
          {/* Bookshelf wooden frame & shelf board */}
          <rect x="0" y="0" width="280" height="230" fill="#130c08" />
          <rect x="0" y="0" width="265" height="215" fill="#1e140d" />
          {/* Shelf divider shadow */}
          <line x1="0" y1="215" x2="265" y2="215" stroke="#3d2a1d" strokeWidth="3" />
          <line x1="0" y1="218" x2="270" y2="218" stroke="#080402" strokeWidth="4" />

          {/* Carved wooden openwork lattice corner piece (hoa văn triện góc tủ cổ) */}
          <g stroke="#3a271a" strokeWidth="2.2" fill="none" opacity="0.8">
            <path d="M15,15 L75,15 L75,45 L45,45 L45,75 L15,75 Z" />
            <path d="M25,25 L65,25 L65,38 L38,38 L38,65 L25,65 Z" strokeWidth="1.5" />
            <rect x="180" y="15" width="40" height="18" rx="2" />
            <rect x="190" y="20" width="20" height="8" rx="1" />
          </g>

          {/* Antique thread-bound Chinese books/scrolls (Sách cổ gáy chỉ) */}
          <g transform="translate(60, 35)">
            {/* Book 1: Indigo cloth cover, slightly tilted */}
            <g transform="rotate(-6, 20, 160)">
              <rect x="0" y="10" width="26" height="155" rx="2" fill="#223348" />
              <rect x="2" y="10" width="22" height="155" fill="#2a3f58" />
              <rect x="4" y="24" width="7" height="60" fill="#f4ebd9" rx="1" />
              {/* Binding stitches */}
              <line x1="22" y1="20" x2="22" y2="155" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2,8" opacity="0.85" />
            </g>

            {/* Book 2: Aged terracotta/brown */}
            <g transform="translate(28, 0)">
              <rect x="0" y="6" width="24" height="162" rx="2" fill="#582a1e" />
              <rect x="3" y="6" width="18" height="162" fill="#6c3425" />
              <rect x="5" y="26" width="6" height="52" fill="#f4ebd9" rx="1" />
              <line x1="20" y1="14" x2="20" y2="158" stroke="#e8dfce" strokeWidth="1.2" strokeDasharray="2,8" opacity="0.8" />
            </g>

            {/* Book 3: Parchment ivory/yellow paper scroll stack */}
            <g transform="translate(56, 0)">
              <rect x="0" y="15" width="20" height="152" rx="2" fill="#756247" />
              <rect x="2" y="15" width="16" height="152" fill="#a48c66" />
              <rect x="4" y="30" width="5" height="45" fill="#f7f3e8" rx="1" />
              <line x1="16" y1="22" x2="16" y2="157" stroke="#3a2c1b" strokeWidth="1.2" strokeDasharray="2,7" opacity="0.9" />
            </g>

            {/* Book 4: Sage/bamboo green cover */}
            <g transform="translate(80, 0)">
              <rect x="0" y="8" width="25" height="160" rx="2" fill="#283e30" />
              <rect x="3" y="8" width="19" height="160" fill="#355240" />
              <rect x="5" y="22" width="6" height="55" fill="#f4ebd9" rx="1" />
              <line x1="21" y1="16" x2="21" y2="158" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2,8" opacity="0.8" />
            </g>

            {/* Book 5 & 6 lying horizontally on the shelf */}
            <g transform="translate(112, 120)">
              <rect x="0" y="18" width="125" height="18" rx="2" fill="#543122" />
              <line x1="0" y1="24" x2="125" y2="24" stroke="#cbb28b" strokeWidth="2.5" opacity="0.85" />
              <rect x="5" y="0" width="118" height="18" rx="2" fill="#2b3b4c" />
              <line x1="5" y1="6" x2="123" y2="6" stroke="#d5c19d" strokeWidth="2.5" opacity="0.85" />
            </g>
          </g>
        </g>

        {/* 3. Top-Right: Warm Candle Stand & Cozy Amber Light Glow */}
        {/* Large ambient room glow radiating on the table */}
        <circle cx="1160" cy="115" r="480" fill="url(#candleGlow)" />
        <circle cx="1160" cy="115" r="220" fill="url(#candleGlow)" opacity="0.85" />

        <g transform="translate(1125, 80)" filter="url(#deskDropShadow)">
          {/* Round wooden candle plate/saucer */}
          <ellipse cx="35" cy="48" rx="36" ry="18" fill="#22150c" />
          <ellipse cx="35" cy="46" rx="33" ry="15" fill="#382214" stroke="#4d301c" strokeWidth="1.5" />
          <ellipse cx="35" cy="45" rx="24" ry="10" fill="#28170c" />

          {/* Candle wax cylinder (chân nến sáp trắng ngà) */}
          <rect x="23" y="24" width="24" height="22" rx="3" fill="#ecdcc4" />
          <ellipse cx="35" cy="24" rx="12" ry="4.5" fill="#fbf5ea" stroke="#d9c3a3" strokeWidth="0.8" />
          {/* Melted wax drop */}
          <path d="M26,26 Q24,36 27,37 Q29,37 28,26 Z" fill="#f5ede0" />

          {/* Wick */}
          <line x1="35" y1="24" x2="35" y2="15" stroke="#332211" strokeWidth="1.6" strokeLinecap="round" />

          {/* Candle Flame (Ngọn lửa nến ấm áp) */}
          <ellipse cx="35" cy="12" rx="6.5" ry="11" fill="url(#flameGrad)" filter="drop-shadow(0 0 8px #ff9e24)" />
          <ellipse cx="35" cy="14" rx="2.5" ry="5.5" fill="#ffffff" opacity="0.9" />
        </g>

        {/* 4. Bottom Area: Traditional Calligraphy Brush (Bút lông) & Red Silk Tassel (Dây thao đỏ) */}
        {/* Calligraphy Brush Pen */}
        <g transform="translate(790, 855) rotate(-34)" filter="url(#brushShadow)">
          {/* Main brush shaft (Thân bút gỗ mun bóng) */}
          <rect x="0" y="-3.5" width="210" height="7" rx="3" fill="#1b130e" stroke="#2d1f17" strokeWidth="0.8" />
          {/* Bamboo grain luster highlight */}
          <line x1="15" y1="-1" x2="195" y2="-1" stroke="#4a3528" strokeWidth="1.2" opacity="0.75" />

          {/* Brass / Gilded ferrule ring (Ngàm đồng bọc đầu bút) */}
          <rect x="200" y="-4.2" width="16" height="8.4" rx="1.5" fill="#c99738" stroke="#e6b856" strokeWidth="0.8" />
          <line x1="208" y1="-4" x2="208" y2="4" stroke="#8c641d" strokeWidth="1" />

          {/* Brush Hair Tip (Đầu lông bút vuốt nhọn tự nhiên) */}
          <path
            d="M216,-4 Q232,-3.5 246,0 Q232,3.5 216,4 Z"
            fill="#e2d4bd"
            stroke="#261b14"
            strokeWidth="0.5"
          />
          {/* Ink stain on tip */}
          <path
            d="M232,-2 Q240,-1 246,0 Q240,1 232,2 Z"
            fill="#1c1613"
            opacity="0.92"
          />

          {/* Brush end finial cap (Đuôi bút có ngọc/sừng) */}
          <circle cx="0" cy="0" r="4.5" fill="#c99738" />
          <circle cx="-3" cy="0" r="1.5" fill="#f4ebd9" />
        </g>

        {/* Coiled Red Silk Cord / Tassel (Dây thao bện màu đỏ thắm) */}
        <g transform="translate(1210, 835)" filter="url(#deskDropShadow)">
          {/* Main coiled rope loops */}
          <path
            d="M40,55 C10,25 35,-15 75,5 C115,25 90,75 55,85 C20,95 -5,55 25,35 C55,15 105,40 120,70"
            stroke="#911e17"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M40,55 C10,25 35,-15 75,5 C115,25 90,75 55,85 C20,95 -5,55 25,35 C55,15 105,40 120,70"
            stroke="#b82d24"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,3"
          />
          {/* Silk tassel knot & fringe tail */}
          <circle cx="125" cy="72" r="7.5" fill="#751510" stroke="#a3241c" strokeWidth="2" />
          <path
            d="M130,76 Q150,92 165,115 M131,79 Q145,96 155,122 M128,81 Q138,98 142,125"
            stroke="#b82d24"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* 5. Ambient Vignette - Darkens corners so center jade board stands out prominently */}
        <rect
          x="0"
          y="0"
          width="1600"
          height="1000"
          fill="url(#vignetteMask)"
          style={{ mixBlendMode: 'multiply' }}
        />
        <defs>
          <radialGradient id="vignetteMask" cx="50%" cy="50%" r="60%">
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="70%" stopColor="#080503" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.82" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
