/**
 * Comprehensive API Test Suite for SmashCourt Chatbot
 */
const http = require('http');

const BASE_URL = 'http://localhost:3000';

function postChat(message, history = []) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ message, history });
    const req = http.request(
      `${BASE_URL}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

let passCount = 0;
let failCount = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message} ${detail ? `| Detail: ${detail}` : ''}`);
    failCount++;
  }
}

async function runTests() {
  console.log('=== RUNNING CHATBOT API TEST SUITE ===\n');

  // Test 1: "Yonex Astrox 88D Pro giá bao nhiêu?"
  {
    console.log('[Test 1] Question: "Yonex Astrox 88D Pro giá bao nhiêu?"');
    const res = await postChat('Yonex Astrox 88D Pro giá bao nhiêu?');
    assert(res.statusCode === 200, 'HTTP Status is 200', `Got ${res.statusCode}`);
    assert(typeof res.body.reply === 'string' && res.body.reply.length > 20, 'Reply contains substantive text');
    assert(Array.isArray(res.body.products) && res.body.products.length > 0, 'Returns matched products array');
    const matched88D = res.body.products.some((p) => /88D/i.test(p.name));
    assert(matched88D, 'Product matches Astrox 88D Pro', JSON.stringify(res.body.products.map((p) => p.name)));
    const hasCategory = res.body.products.every((p) => p.category_id);
    assert(hasCategory, 'Products include category_id for dynamic URL rendering');
    assert(Array.isArray(res.body.suggested_chips) && res.body.suggested_chips.length > 0, 'Returns suggested_chips array');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  // Test 2: "giày cầu lông size 42"
  {
    console.log('[Test 2] Question: "giày cầu lông size 42"');
    const res = await postChat('giày cầu lông size 42');
    assert(res.statusCode === 200, 'HTTP Status is 200');
    assert(res.body.reply.toLowerCase().includes('giày') || res.body.reply.toLowerCase().includes('size'), 'Reply addresses shoe selection & size');
    assert(res.body.reply.includes('42') || res.body.reply.includes('40'), 'Reply mentions shoe sizes (40-44)');
    const hasShoesProduct = res.body.products.some((p) => p.category_id === 'cat_shoes');
    assert(hasShoesProduct, 'Products return items with category_id = cat_shoes', JSON.stringify(res.body.products));
    const mentionsKeyShoes = /65Z4|Eclipsion|Cascade/i.test(res.body.reply);
    assert(mentionsKeyShoes, 'Reply advises on Yonex 65Z4, Eclipsion Z3 or Cascade Accel');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  // Test 3: "vợt tấn công tầm 4 triệu"
  {
    console.log('[Test 3] Question: "vợt tấn công tầm 4 triệu"');
    const res = await postChat('vợt tấn công tầm 4 triệu');
    assert(res.statusCode === 200, 'HTTP Status is 200');
    assert(/tấn công|smash/i.test(res.body.reply), 'Reply advises on attack playstyle');
    const mentionsAttackRackets = /Ryuga|Axforce|88D|100ZZ/i.test(res.body.reply);
    assert(mentionsAttackRackets, 'Reply suggests top attack racquets (Ryuga, Axforce, 88D, 100ZZ)');
    assert(Array.isArray(res.body.products) && res.body.products.length > 0, 'Returns relevant attack racquets');
    const budgetOk = res.body.products.every((p) => p.original_price <= 4600000);
    assert(budgetOk, 'Products are within the ~4M budget limit');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  // Test 4: "có giao hỏa tốc không shop?"
  {
    console.log('[Test 4] Question: "có giao hỏa tốc không shop?"');
    const res = await postChat('có giao hỏa tốc không shop?');
    assert(res.statusCode === 200, 'HTTP Status is 200');
    assert(res.body.reply.includes('2 giờ') || res.body.reply.includes('2h'), 'Reply explicitly mentions 2h express delivery');
    assert(res.body.reply.includes('COD'), 'Reply mentions COD nationwide 2-3 days');
    assert(res.body.reply.includes('1.000.000đ') || res.body.reply.includes('1 triệu'), 'Reply mentions free shipping for orders from 1.000.000đ');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  // Test 5: "vợt cũ 16 tiêu chí có những cây nào?"
  {
    console.log('[Test 5] Question: "vợt cũ 16 tiêu chí có những cây nào?"');
    const res = await postChat('vợt cũ 16 tiêu chí có những cây nào?');
    assert(res.statusCode === 200, 'HTTP Status is 200');
    assert(/16 tiêu chí/i.test(res.body.reply), 'Reply references 16 criteria inspection');
    assert(/Grade|Hạng/i.test(res.body.reply), 'Reply shows racquet Grade (A/B/C)');
    const hasSecondhandProducts = res.body.products.some((p) => p.category_id === 'cat_secondhand');
    assert(hasSecondhandProducts, 'Returns items with category_id = cat_secondhand queried from secondhand_db');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  // Test 6: So sánh vợt: "so sánh Astrox 88D và Astrox 99 Pro"
  {
    console.log('[Test 6] Question: "so sánh Astrox 88D và Astrox 99 Pro"');
    const res = await postChat('so sánh Astrox 88D và Astrox 99 Pro');
    assert(res.statusCode === 200, 'HTTP Status is 200');
    assert(res.body.reply.includes('88D') && res.body.reply.includes('99 Pro'), 'Reply contrasts both 88D and 99 Pro');
    assert(res.body.reply.includes('/so-sanh'), 'Reply recommends comparison tool link /so-sanh');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  // Test 7: Balo / Túi vợt có ngăn để giày: "túi vợt hoặc balo có ngăn để giày"
  {
    console.log('[Test 7] Question: "túi vợt hoặc balo có ngăn để giày"');
    const res = await postChat('túi vợt hoặc balo có ngăn để giày');
    assert(res.statusCode === 200, 'HTTP Status is 200');
    assert(/balo|túi/i.test(res.body.reply), 'Reply addresses bag and backpack');
    assert(/ngăn.*giày/i.test(res.body.reply), 'Reply highlights separate shoe compartment');
    const hasBag = res.body.products.some((p) => p.category_id === 'cat_bag');
    assert(hasBag, 'Returns items with category_id = cat_bag');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  // Test 8: Context inheritance from history: "còn hàng không shop?" following up on shoe inquiry
  {
    console.log('[Test 8] Context Inheritance: Follow-up "còn size 42 không shop?"');
    const history = [
      { role: 'user', content: 'Giày cầu lông Yonex Power Cushion 65Z4' },
      { role: 'assistant', content: 'Dạ mẫu giày Yonex Power Cushion 65Z4 là mẫu giày toàn diện cao cấp...' },
    ];
    const res = await postChat('còn size 42 không shop?', history);
    assert(res.statusCode === 200, 'HTTP Status is 200');
    assert(/65Z4|giày/i.test(res.body.reply), 'Inherited shoe context from previous turns');
    console.log(`  Bot Reply Preview: ${res.body.reply.slice(0, 150)}...\n`);
  }

  console.log(`\n========================================`);
  console.log(`TOTAL: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
