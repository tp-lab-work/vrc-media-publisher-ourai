const fs = require("fs").promises;
const path = require("path");

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
      const outputFile = path.join(outputDir, `${folder}.txt`);

      // フォルダ内のCRNファイルを取得してソート
      const files = await fs.readdir(inputFolder);
      const images = files
        .filter((file) => file.endsWith(".crn"))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          return numA - numB;
        });

      // 各画像をbase64に変換
      const base64Array = [];
      for (const image of images) {
        const imagePath = path.join(inputFolder, image);
        const imageBuffer = await fs.readFile(imagePath);

        const match = filename.match(/_(\d+)x(\d+)\./);
        const width = parseInt(match[1], 10);
        const height = parseInt(match[2], 10);

        base64Array.push(
          width + "\n" + height + "\n" + imageBuffer.toString("base64")
        );
      }

      // 指定フォーマットで保存
      const output = [base64Array.length.toString(), ...base64Array].join("\n");

      await fs.writeFile(outputFile, output);
      console.log(
        `Converted and combined images in ${folder} to ${outputFile}`
      );
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

combineImagesBase64();
