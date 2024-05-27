import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs-extra";

const app = express();
const port = 3000;

app.use(cors());
app.use("/data", express.static(path.join(__dirname, "../data")));

// 이미지 파일의 리스트를 가져오는 API 엔드포인트
app.get("/api/images", (req, res) => {
  const imagesDir = path.join(__dirname, "../data/original");
  console.log(imagesDir);
  fs.readdir(imagesDir, (err: any, files: any) => {
    if (err) {
      res.status(500).send("Error reading images directory");
    } else {
      res.json(files);
    }
  });
});

// 특정 이미지 폴더를 생성하고 이미지를 복사하는 API 엔드포인트
app.post("/api/copy-image", express.json(), (req, res) => {
  const { imageName } = req.body;
  const originalImagePath = path.join(__dirname, "../data/original", imageName);
  const targetFolderPath = path.join(__dirname, "../data", imageName);
  const targetImagePath = path.join(targetFolderPath, "original", imageName);

  fs.ensureDir(path.join(targetFolderPath, "original"))
    .then(() => fs.copyFile(originalImagePath, targetImagePath))
    .then(() => res.json({ message: "Image copied successfully" }))
    .catch((err) => res.status(500).send("Error copying image"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
