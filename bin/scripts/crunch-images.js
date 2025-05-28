const { execSync } = require("child_process");
const fs = require("fs").promises;
const path = require("path");

async function crunchImage(inputFile, tempDir, outputDir) {
  try {
    // 相対パスの取得
    const relPath = path.relative(tempDir, inputFile);
    const outputSubdir = path.dirname(relPath);
    const fullOutputDir = path.join(outputDir, outputSubdir);

    // 出力ディレクトリの作成
    await fs.mkdir(fullOutputDir, { recursive: true });

    // 出力ファイル名の生成
    const filename = path.basename(inputFile, ".png");
    const outputPath = path.join(fullOutputDir, `${filename}.crn`);

    // crunch の実行
    execSync(
      `./bin/tools/crunch -file "${inputFile}" -out "${outputPath}" -DXT1 -yflip -mipMode None`
    );

    return { success: true, outputPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 指定されたディレクトリ内のPNGファイルを再帰的に検索
 * @param {string} dir - 検索対象のディレクトリパス
 * @returns {Promise<string[]>} - 見つかったPNGファイルのパスの配列
 */
async function findPngFiles(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const pngFiles = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        return findPngFiles(fullPath);
      } else if (
        file.isFile() &&
        path.extname(file.name).toLowerCase() === ".png"
      ) {
        return [fullPath];
      }
      return [];
    })
  );
  return pngFiles.flat();
}

async function main() {
  const inputDir = process.env.TEMP_IMAGES;
  const outputDir = process.env.TEMP_IMAGES_CRUNCHED;

  try {
    // 入力ディレクトリ内のPNGファイルを再帰的に検索
    const files = await findPngFiles(inputDir);

    for (const file of files) {
      const result = await crunchImage(file, inputDir, outputDir);
      if (!result.success) {
        console.error(`Failed to process ${file}:`, result.error);
      }
    }
  } catch (error) {
    console.error("Processing failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { crunchImage };
