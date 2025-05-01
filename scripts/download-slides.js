const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { convert } = require("pdf-poppler");

async function downloadSlides() {
  const auth = new GoogleAuth({
    keyFile: process.env.SERVICE_ACCOUNT_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  const drive = google.drive({ version: "v3", auth });
  const slidesConfig = JSON.parse(process.env.SLIDES_CONFIG);

  for (const config of slidesConfig) {
    const { type, url } = config;
    const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
    const tempDir = path.join(process.env.TEMP_DIR, type);

    await fs.promises.mkdir(tempDir, { recursive: true });

    const pdfPath = path.join(tempDir, "slides.pdf");

    // PDFをDrive API経由で取得
    const res = await drive.files.export(
      {
        fileId,
        mimeType: "application/pdf",
      },
      { responseType: "stream" }
    );

    await new Promise((resolve, reject) => {
      const dest = fs.createWriteStream(pdfPath);
      res.data.on("end", resolve).on("error", reject).pipe(dest);
    });

    // PDF → PNGに変換
    await convert(pdfPath, {
      format: "png",
      out_dir: tempDir,
      out_prefix: "slide",
      resolution: 150,
    });

    console.log(`✅ ${type}: スライドをPNGとして保存しました。`);
  }
}

downloadSlides();

// const { GoogleAuth } = require("google-auth-library");
// const { google } = require("googleapis");
// const fs = require("fs");

// async function downloadSlides() {
//   const auth = new GoogleAuth({
//     keyFile: process.env.SERVICE_ACCOUNT_JSON_PATH,
//     scopes: ["https://www.googleapis.com/auth/presentations.readonly"],
//   });

//   const slides = google.slides({ version: "v1", auth });
//   const slidesConfig = JSON.parse(process.env.SLIDES_CONFIG);

//   for (const config of slidesConfig) {
//     const { type, url } = config;

//     const presentationId = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)[1];
//     const presentation = await slides.presentations.get({ presentationId });

//     const tempDir = `${process.env.TEMP_DIR}/${type}`;
//     await fs.promises.mkdir(tempDir, { recursive: true });

//     for (let i = 0; i < presentation.data.slides.length; i++) {
//       const response = await slides.presentations.pages.getThumbnail({
//         presentationId,
//         pageObjectId: presentation.data.slides[i].objectId,
//       });

//       const imageUrl = response.data.contentUrl;
//       const imageResponse = await fetch(imageUrl);
//       const buffer = Buffer.from(await imageResponse.arrayBuffer());

//       await fs.promises.writeFile(
//         `${tempDir}/slide-${(i + 1).toString().padStart(3, "0")}.png`,
//         buffer
//       );
//     }
//   }
// }

// downloadSlides();
