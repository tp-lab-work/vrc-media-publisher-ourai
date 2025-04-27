const { GoogleAuth } = require("google-auth-library");
const { google } = require("@googleapis");

async function downloadSlides() {
  const auth = new GoogleAuth({
    keyFile: process.env.SERVICE_ACCOUNT_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/presentations.readonly"],
  });

  const slides = google.slides({ version: "v3", auth });
  // const drive = google.drive({ version: "v3", auth });

  const slideUrls = process.env.SLIDE_URLS.split("\n").filter((url) =>
    url.trim()
  );
  console.log(slideUrls);

  // デバッグ用にauth情報を確認
  console.log("Slides API client created:", !!slides);

  // for (const url of slideUrls) {
  //   const presentationId = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)[1];
  //   const presentation = await slides.presentations.get({ presentationId });

  //   const tempDir = `${process.env.TEMP_DIR}/${presentation.data.title}`;
  //   await fs.promises.mkdir(tempDir, { recursive: true });

  //   for (let i = 0; i < presentation.data.slides.length; i++) {
  //     const response = await slides.presentations.pages.getThumbnail({
  //       presentationId,
  //       pageObjectId: presentation.data.slides[i].objectId,
  //       thumbnailProperties: {
  //         thumbnailSize: "LARGE",
  //       },
  //     });

  //     const imageUrl = response.data.contentUrl;
  //     const imageResponse = await fetch(imageUrl);
  //     const buffer = await imageResponse.buffer();

  //     await fs.promises.writeFile(
  //       `${tempDir}/slide-${(i + 1).toString().padStart(3, "0")}.png`,
  //       buffer
  //     );
  //   }
  // }
}

downloadSlides().catch(console.error);
