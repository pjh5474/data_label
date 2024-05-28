import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs-extra";
import { execFile } from "child_process";

const app = express();
const port = 3000;

app.use(cors());
app.use("/data", express.static(path.join(__dirname, "../data")));

app.get("/api/images", (req, res) => {
  const imagesDir = path.join(__dirname, "../data/original");
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      res.status(500).send("Error reading images directory");
    } else {
      res.json(files);
    }
  });
});

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

app.get("/api/image-data/:imageName", async (req, res) => {
  const { imageName } = req.params;
  const imageDir = path.join(__dirname, "../data", imageName);
  const clusteringResultDir = path.join(imageDir, "clustering result");
  const centroidRgbFile = path.join(
    imageDir,
    "centroid solid RGB colors",
    "centroid_rgbs_per_cluster.txt"
  );
  const avgRgbFile = path.join(
    imageDir,
    "avg cluster RGB colors",
    "avg_rgbs_per_cluster.txt"
  );

  try {
    const clusterImages = await fs.readdir(clusteringResultDir);
    const rgbData = await fs.readFile(centroidRgbFile, "utf8");
    const avgRgbData = await fs.readFile(avgRgbFile, "utf8");
    const rgbValues = rgbData
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const avgRgbValues = avgRgbData
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    const responseData = clusterImages.map((image, index) => ({
      imageUrl: `/data/${imageName}/clustering result/${image}`,
      rgb: rgbValues[index] ? rgbValues[index].split(" ").map(Number) : null,
      avgrgb: avgRgbValues[index]
        ? avgRgbValues[index].split(" ").map(Number)
        : null,
    }));

    res.json(responseData);
  } catch (err) {
    res.status(500).send("Error reading image data");
  }
});

app.post("/api/select-images", express.json(), async (req, res) => {
  const { imageName, selectedImages } = req.body;
  const targetFolderPath = path.join(
    __dirname,
    "../data",
    imageName,
    "selected masks"
  );
  await fs.emptyDir(targetFolderPath); // Clear the directory first

  try {
    for (const image of selectedImages) {
      const imageNameSplitArray = image.split("/");
      const imageSrc = imageNameSplitArray[imageNameSplitArray.length - 1];
      const sourcePath = path.join(
        __dirname,
        "../data",
        imageName,
        "segmented masks",
        imageSrc.replace("_result_", "_mask_")
      );
      const destinationPath = path.join(targetFolderPath, imageSrc);
      await fs.copyFile(sourcePath, destinationPath);
    }
    res.json({ message: "Selected images copied successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error copying selected images");
  }
});

app.post("/api/run-python", express.json(), async (req, res) => {
  const { imageName } = req.body;
  const originalImagePath = path.join(__dirname, "../data/original", imageName);
  const targetFolderPath = path.join(__dirname, "../data", imageName);
  const targetImagePath = path.join(
    targetFolderPath,
    "original",
    `${imageName}_${Date.now()}.jpg`
  );

  const maskImgPath = path.join(
    __dirname,
    "../data",
    imageName,
    "selected masks"
  );
  const pythonScriptPath = path.join(__dirname, "../process_image.py");
  const venvPythonPath = path.join(__dirname, "../venv/Scripts/python");

  await fs.emptyDir(path.join(targetFolderPath, "original"));

  fs.ensureDir(path.join(targetFolderPath, "original"))
    .then(() => fs.copyFile(originalImagePath, targetImagePath))
    .then(() => {
      console.log("Image copied successfully");
    })
    .catch((err) => console.log("Image copied error", err))
    .finally(() => {
      const pythonProcess = execFile(
        venvPythonPath,
        [pythonScriptPath, targetImagePath, maskImgPath],
        (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            res.status(500).send("Error executing Python script");
            return;
          }

          try {
            const result = JSON.parse(stdout);
          } catch (parseError: any) {
            console.error(
              `Error parsing Python script output: ${parseError.message}`
            );
            res.status(500).send("Error parsing Python script output");
          }
        }
      );
      const processImage = targetImagePath;
      console.log("PYTHON");
      res.json({ processImage });
    });
});

app.post("/api/save-result", express.json(), async (req, res) => {
  const imageName = req.body.imageName;
  const red: number[] = req.body.red;
  const pink: number[] = req.body.pink;
  const centImgPath = path.join(
    __dirname,
    "../data",
    imageName,
    "centroid solid RGB colors"
  );
  const avgImgPath = path.join(
    __dirname,
    "../data",
    imageName,
    "avg cluster RGB colors"
  );
  const segImgPath = path.join(
    __dirname,
    "../data",
    imageName,
    "segmented masks"
  );
  const cent_red = path.join(__dirname, "../result", "cent_red");
  const cent_pink = path.join(__dirname, "../result", "cent_pink");
  const avg_red = path.join(__dirname, "../result", "avg_red");
  const avg_pink = path.join(__dirname, "../result", "avg_pink");
  const seg_red = path.join(__dirname, "../result", "seg_red");
  const seg_pink = path.join(__dirname, "../result", "seg_pink");

  red.map(async (index: number) => {
    const cent_image = path.join(centImgPath, `${imageName}_${index}_.jpg`);
    const avg_image = path.join(avgImgPath, `${imageName}_${index}_.jpg`);
    const seg_image = path.join(segImgPath, `${imageName}_mask_${index}.jpg`);
    await fs.copyFile(
      cent_image,
      path.join(cent_red, `${imageName}_${index}_.jpg`)
    );
    await fs.copyFile(
      avg_image,
      path.join(avg_red, `${imageName}_${index}_.jpg`)
    );
    await fs.copyFile(
      seg_image,
      path.join(seg_red, `${imageName}_mask_${index}.jpg`)
    );
  });
  pink.map(async (index: number) => {
    const cent_image = path.join(centImgPath, `${imageName}_${index}_.jpg`);
    const avg_image = path.join(avgImgPath, `${imageName}_${index}_.jpg`);
    const seg_image = path.join(segImgPath, `${imageName}_mask_${index}.jpg`);
    await fs.copyFile(
      cent_image,
      path.join(cent_pink, `${imageName}_${index}_.jpg`)
    );
    await fs.copyFile(
      avg_image,
      path.join(avg_pink, `${imageName}_${index}_.jpg`)
    );
    await fs.copyFile(
      seg_image,
      path.join(seg_pink, `${imageName}_mask_${index}.jpg`)
    );
  });
  const centrgbData = await fs.readFile(
    path.join(centImgPath, "centroid_rgbs_per_cluster.txt"),
    "utf8"
  );
  const centrgbValues: string[] = centrgbData
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const centRedFilePath = path.join(cent_red, `${imageName}_red_centroid.txt`);
  const CentRedsValues = red
    .map((line) => centrgbValues[line] + ` ${imageName} ${line}`)
    .join("\n");
  await fs.writeFile(centRedFilePath, CentRedsValues, "utf-8", (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log("File has been saved.");
    }
  });
  const centPinkFilePath = path.join(
    cent_pink,
    `${imageName}_pink_centroid.txt`
  );
  const CentPinksValues = pink
    .map((line) => centrgbValues[line] + ` ${imageName} ${line}`)
    .join("\n");
  await fs.writeFile(centPinkFilePath, CentPinksValues, "utf-8", (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log("File has been saved.");
    }
  });
  const avgrgbData = await fs.readFile(
    path.join(avgImgPath, "avg_rgbs_per_cluster.txt"),
    "utf8"
  );
  const avgrgbValues: string[] = avgrgbData
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const avgRedFilePath = path.join(avg_red, `${imageName}_red_avg.txt`);
  const avgRedsValues = red
    .map((line) => avgrgbValues[line] + ` ${imageName} ${line}`)
    .join("\n");
  await fs.writeFile(avgRedFilePath, avgRedsValues, "utf-8", (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log("File has been saved.");
    }
  });
  const avgPinkFilePath = path.join(avg_pink, `${imageName}_pink_avg.txt`);
  const avgPinksValues = pink
    .map((line) => avgrgbValues[line] + ` ${imageName} ${line}`)
    .join("\n");
  await fs.writeFile(avgPinkFilePath, avgPinksValues, "utf-8", (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log("File has been saved.");
    }
  });
  res.json({
    result: "success",
  });
});

app.post("/api/need-recluster", express.json(), async (req, res) => {
  const imageName = req.body.imageName;
  const originalImgPath = path.join(
    __dirname,
    "../data",
    "original",
    imageName
  );
  const reclusterImgPath = path.join(
    __dirname,
    "../result",
    "need_recluster",
    imageName
  );
  await fs.copyFile(originalImgPath, reclusterImgPath);
  res.json({
    result: "Success",
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
