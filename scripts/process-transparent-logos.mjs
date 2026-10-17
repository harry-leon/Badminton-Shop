import fs from 'fs';
import jpeg from '../frontend/node_modules/jpeg-js/index.js';
import { PNG } from '../frontend/node_modules/pngjs/lib/png.js';

function removeCheckerboard(inputJpgPath, outputPngPath, isGreen) {
  const jpegData = fs.readFileSync(inputJpgPath);
  const rawImageData = jpeg.decode(jpegData, { useTArray: true });
  const { width, height, data } = rawImageData;

  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Pixel checkerboard xám-trắng thường có:
      // Màu xám: r, g, b xung quanh 190-210, sai khác giữa r,g,b rất nhỏ (< 10)
      // Màu trắng: r, g, b > 235
      const diffRG = Math.abs(r - g);
      const diffGB = Math.abs(g - b);
      const diffRB = Math.abs(r - b);
      const isGrayish = diffRG < 12 && diffGB < 12 && diffRB < 12;

      // Checkerboard pattern: một ô ~ 200, một ô ~ 245-255
      const isCheckerSquare1 = isGrayish && r >= 180 && r <= 220;
      const isCheckerSquare2 = isGrayish && r >= 235;

      if (isGreen) {
        // Với quả cầu xanh: Các phần tử có màu xanh lá (g > r + 15 || g > b + 15) hoặc màu thân cầu
        // Nếu là ô caro nền:
        if ((isCheckerSquare1 || isCheckerSquare2) && (g <= r + 8 && g <= b + 8)) {
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = 0; // Trong suốt hoàn toàn
        } else {
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = 255;
        }
      } else {
        // Với quả cầu trắng:
        // Quả cầu trắng ở trung tâm, nền ở ngoài biên
        // Nếu ở ngoài biên và là caro:
        const distFromCenter = Math.hypot(x - width / 2, y - height / 2);
        const maxDist = width * 0.7;
        
        if ((isCheckerSquare1 || (isCheckerSquare2 && distFromCenter > width * 0.38)) && isGrayish) {
          // Tính độ trong suốt mượt
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = 0;
        } else {
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = 255;
        }
      }
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outputPngPath, buffer);
  console.log(`Đã chuyển đổi thành công: ${outputPngPath} (${buffer.length} bytes)`);
}

removeCheckerboard('frontend/public/images/logo-shuttlecock-green.png', 'frontend/public/images/logo-shuttlecock-green-transparent.png', true);
removeCheckerboard('frontend/public/images/logo-shuttlecock-white.png', 'frontend/public/images/logo-shuttlecock-white-transparent.png', false);
