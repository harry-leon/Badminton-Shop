const fs = require('fs');
const path = require('path');
const sharp = require('C:/badminton-shop/frontend/node_modules/sharp/dist/index.cjs');

const dir = 'c:/badminton-shop/frontend/public/images/branches';

const STORES = [
  {
    filename: 'branch-quan-1.png',
    badge: 'FLAGSHIP SUPER CENTER',
    name: 'SMASHCOURT QUẬN 1',
    address: '123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1, TP.HCM',
    bg1: '#0F5132',
    bg2: '#143826',
    accent: '#C8F31D'
  },
  {
    filename: 'branch-quan-7.png',
    badge: 'PREMIUM SHOWROOM',
    name: 'SMASHCOURT QUẬN 7',
    address: '475 Nguyễn Thị Thập, P. Tân Hưng, Quận 7, TP.HCM',
    bg1: '#1E3A8A',
    bg2: '#0F172A',
    accent: '#60A5FA'
  },
  {
    filename: 'branch-cau-giay.png',
    badge: 'SUPER CENTER HÀ NỘI',
    name: 'SMASHCOURT CẦU GIẤY',
    address: '45 Xuân Thủy, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội',
    bg1: '#831843',
    bg2: '#500724',
    accent: '#F472B6'
  },
  {
    filename: 'branch-hai-chau.png',
    badge: 'SHOWROOM ĐÀ NẴNG',
    name: 'SMASHCOURT HẢI CHÂU',
    address: '78 Nguyễn Văn Linh, P. Nam Dương, Q. Hải Châu, Đà Nẵng',
    bg1: '#064E3B',
    bg2: '#022C22',
    accent: '#34D399'
  }
];

async function generate() {
  const width = 800;
  const height = 500;

  for (const store of STORES) {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${store.bg1}" />
            <stop offset="100%" stop-color="${store.bg2}" />
          </linearGradient>
          <linearGradient id="overlay" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="rgba(0,0,0,0.85)" />
            <stop offset="60%" stop-color="rgba(0,0,0,0.3)" />
            <stop offset="100%" stop-color="rgba(0,0,0,0.1)" />
          </linearGradient>
          <pattern id="court" width="100" height="100" patternUnits="userSpaceOnUse">
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
          </pattern>
        </defs>

        <rect width="${width}" height="${height}" fill="url(#bg)" />
        <rect width="${width}" height="${height}" fill="url(#court)" />

        <!-- Interior illustration aesthetic lines -->
        <circle cx="680" cy="120" r="180" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="40" />
        <circle cx="120" cy="380" r="220" fill="none" stroke="${store.accent}" stroke-opacity="0.08" stroke-width="60" />

        <!-- Dark Gradient Overlay -->
        <rect width="${width}" height="${height}" fill="url(#overlay)" />

        <!-- Top Badge -->
        <g transform="translate(48, 48)">
          <rect width="220" height="34" rx="17" fill="${store.accent}" />
          <text x="110" y="22" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="12" fill="#0F172A" text-anchor="middle" letter-spacing="1.5">${store.badge}</text>
        </g>

        <!-- Center Store Identity -->
        <g transform="translate(48, 320)">
          <!-- Icon Tag -->
          <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="bold" fill="${store.accent}" letter-spacing="2">HỆ THỐNG CỬA HÀNG SMASHCOURT</text>
          
          <!-- Store Name -->
          <text x="0" y="55" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">${store.name}</text>
          
          <!-- Address -->
          <g transform="translate(0, 95)">
            <circle cx="8" cy="-5" r="5" fill="${store.accent}" />
            <text x="24" y="0" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="rgba(255,255,255,0.85)">${store.address}</text>
          </g>
        </g>

        <!-- Right Side Graphic / Emblem -->
        <g transform="translate(620, 260)">
          <rect x="-80" y="-80" width="160" height="160" rx="32" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
          <text x="0" y="-10" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="900" fill="#FFFFFF" text-anchor="middle">100%</text>
          <text x="0" y="20" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="${store.accent}" text-anchor="middle" letter-spacing="1">CHÍNH HÃNG</text>
          <text x="0" y="42" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="rgba(255,255,255,0.7)" text-anchor="middle">CHUẨN BWF</text>
        </g>
      </svg>
    `;

    const dest = path.join(dir, store.filename);
    await sharp(Buffer.from(svg)).png().toFile(dest);
    console.log('Generated:', dest);
  }
}

generate().catch(console.error);
