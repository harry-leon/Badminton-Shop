#!/usr/bin/env node

/**
 * Script kiểm tra quy tắc thiết kế Quiet Court cho storefront.
 * Quét các file trong frontend/src/app (ngoại trừ admin) và báo lỗi nếu vi phạm:
 * - font-(semibold|bold|extrabold|black)
 * - uppercase
 * - tracking-(wide|wider|widest)
 * - text-[(8|9|10|11|12)px]
 * - text-transparent
 * - bg-gradient-*
 * Ngoại lệ: dòng có comment chứa 'design-rule-ignore: lý do'
 */

const fs = require('fs');
const path = require('path');

const STOREFRONT_DIR = path.resolve(__dirname, '../frontend/src/app');
const EXCLUDE_DIRS = ['admin', 'api'];

const FORBIDDEN_RULES = [
  { name: 'font-weight-600+', regex: /\bfont-(semibold|bold|extrabold|black)\b/g, desc: 'Cấm font weight >= 600 ở storefront (chỉ dùng font-normal/400 hoặc font-medium/500)' },
  { name: 'uppercase-class', regex: /\buppercase\b/g, desc: 'Cấm class uppercase ở storefront (dùng sentence case)' },
  { name: 'wide-tracking', regex: /\btracking-(wide|wider|widest)\b/g, desc: 'Cấm tracking rộng ở nhãn/nút/tiêu đề' },
  { name: 'tiny-text', regex: /\btext-\[(8|9|10|11|12)px\]\b/g, desc: 'Cấm chữ nhỏ dưới 13px (nội dung tối thiểu 13px)' },
  { name: 'text-transparent', regex: /\btext-transparent\b/g, desc: 'Cấm text-transparent (không dùng chữ gradient)' },
  { name: 'bg-gradient', regex: /\bbg-gradient-[a-z0-9-]+\b/g, desc: 'Cấm gradient sặc sỡ (chỉ cho phép gradient rất nhẹ cùng tông ở nền hero có ignore comment)' },
];

function scanDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        scanDir(fullPath, fileList);
      }
    } else if (entry.isFile() && /\.(tsx|jsx|ts|js|css)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function runAudit() {
  const files = scanDir(STOREFRONT_DIR);
  const violations = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for inline bypass comment
      if (line.includes('design-rule-ignore:')) {
        return;
      }

      for (const rule of FORBIDDEN_RULES) {
        if (rule.regex.test(line)) {
          const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);
          violations.push({
            file: relativePath,
            line: index + 1,
            rule: rule.name,
            desc: rule.desc,
            snippet: line.trim(),
          });
        }
      }
    });
  }

  console.log(`\n=== QUIET COURT DESIGN RULES AUDIT ===`);
  console.log(`Đã quét ${files.length} file storefront.`);

  if (violations.length === 0) {
    console.log(`✓ 100% PASS: Không phát hiện bất kỳ vi phạm quy tắc thiết kế nào!\n`);
    process.exit(0);
  } else {
    console.log(`! CẢNH BÁO / VI PHẠM: Tìm thấy ${violations.length} vi phạm quy tắc thiết kế:\n`);
    const grouped = {};
    violations.forEach(v => {
      grouped[v.rule] = (grouped[v.rule] || 0) + 1;
    });

    console.log('Thống kê theo quy tắc:');
    Object.entries(grouped).forEach(([rule, count]) => {
      console.log(`  - ${rule}: ${count} chỗ vi phạm`);
    });

    console.log('\nChi tiết các vi phạm tiêu biểu:');
    violations.slice(0, 15).forEach((v, i) => {
      console.log(`  ${i + 1}. [${v.file}:${v.line}] (${v.rule}): ${v.snippet.substring(0, 80)}...`);
    });

    if (violations.length > 15) {
      console.log(`  ... và ${violations.length - 15} vi phạm khác.`);
    }

    console.log(`\n(Mã thoát: 1 khi ở CI, các vi phạm này sẽ được chuẩn hóa triệt để qua các Phase UI-1 đến UI-7).\n`);
    // Exit with 1 if --strict flag is passed
    if (process.argv.includes('--strict')) {
      process.exit(1);
    }
  }
}

runAudit();
