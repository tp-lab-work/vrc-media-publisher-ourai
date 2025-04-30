const fs = require("fs").promises;
const path = require("path");

// 各画像をbase64に変換
async function outputBase64(folder, inputFolder, outputDir, images) {
  const outputFile = path.join(outputDir, `${folder}.txt`);

  const base64Array = [];
  for (const image of images) {
    const imagePath = path.join(inputFolder, image);
    const imageBuffer = await fs.readFile(imagePath);
    // base64Array.push(imageBuffer.toString("base64"));

    const match = imagePath.match(/_(\d+)x(\d+)\./);
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    base64Array.push(
      width + "\n" + height + "\n" + imageBuffer.toString("base64")
    );
  }

  // 指定フォーマットで保存
  const output = [base64Array.length.toString(), ...base64Array].join("\n");

  await fs.writeFile(outputFile, output);
  console.log(`Converted and combined images in ${folder} to ${outputFile}`);
}

// 各画像をバイナリに変換
async function outputBinary(folder, inputFolder, outputDir, images) {
  const outputFile = path.join(outputDir, `${folder}.bin`);

  // ヘッダー用のバッファを作成
  const headerBuffer = Buffer.alloc(4); // ページ数用の4バイト
  headerBuffer.writeUInt32LE(images.length); // ページ数を書き込み

  // ページ情報用のバッファを作成
  const pageInfoSize = images.length * 16; // 各ページ4つの4バイト情報
  const pageInfoBuffer = Buffer.alloc(pageInfoSize);

  // 画像データを読み込んでバッファの配列を作成
  const imageBuffers = [];
  let currentOffset = 4 + pageInfoSize; // ヘッダー + ページ情報の後のオフセット

  // 各画像のページ情報とバッファを準備
  for (let i = 0; i < images.length; i++) {
    const imagePath = path.join(inputFolder, images[i]);
    const imageBuffer = await fs.readFile(imagePath);
    imageBuffers.push(imageBuffer);

    const match = imagePath.match(/_(\d+)x(\d+)\./);
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);

    const offset = i * 16; // ページ情報は16バイトごと
    pageInfoBuffer.writeUInt32LE(currentOffset, offset); // データオフセット
    pageInfoBuffer.writeUInt32LE(imageBuffer.length, offset + 4); // データサイズ
    pageInfoBuffer.writeUInt32LE(width, offset + 8); // テクスチャの幅
    pageInfoBuffer.writeUInt32LE(height, offset + 12); // テクスチャの高さ

    currentOffset += imageBuffer.length;
  }

  // 全てのバッファを結合
  const finalBuffer = Buffer.concat([
    headerBuffer,
    pageInfoBuffer,
    ...imageBuffers,
  ]);

  // バイナリファイルとして保存
  await fs.writeFile(outputFile, finalBuffer);
  console.log(`Combined binary images in ${folder} to ${outputFile}`);
}

async function combineImagesBase64() {
  const inputDir = process.env.INPUT_DIR;
  const outputDir = process.env.OUTPUT_DIR;

  try {
    // 出力ディレクトリの作成
    await fs.mkdir(outputDir, { recursive: true });

    // 入力ディレクトリ内のフォルダを取得
    const entries = await fs.readdir(inputDir, { withFileTypes: true });
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const folder of folders) {
      const inputFolder = path.join(inputDir, folder);

      // フォルダ内のCRNファイルを取得してソート
      const files = await fs.readdir(inputFolder);
      const images = files
        .filter((file) => file.endsWith(".crn"))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          return numA - numB;
        });

      // Base64ファイルの出力
      outputBase64(folder, inputFolder, outputDir, images);

      // バイナリファイルの出力
      outputBinary(folder, inputFolder, outputDir, images);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

combineImagesBase64();
