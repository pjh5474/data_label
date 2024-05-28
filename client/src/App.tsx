import React, { useState, useEffect } from "react";
import {
  Box,
  Image,
  VStack,
  HStack,
  Heading,
  SimpleGrid,
  Flex,
  Divider,
  AbsoluteCenter,
  Button,
  useToast,
} from "@chakra-ui/react";
import ImageItem from "./components/ImageItem";
import ClusterResult, { ClusterData } from "./components/ClusterResult";

const App: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clusterData, setClusterData] = useState<ClusterData[]>([]);
  const [selectedClusterImages, setSelectedClusterImages] = useState<string[]>(
    []
  );
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [redStatus, setRedStatus] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetch("http://localhost:3000/api/images")
      .then((response) => response.json())
      .then((data) => setImages(data));
  }, []);

  const handleImageSelect = (imageName: string) => {
    fetch("http://localhost:3000/api/copy-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageName }),
    })
      .then((response) => response.json())
      .then(() => {
        setSelectedImage(imageName);
        setRedStatus([]);
        return fetch(`http://localhost:3000/api/image-data/${imageName}`);
      })
      .then((response) => response.json())
      .then((data) => setClusterData(data))
      .catch((err) => console.error("Error fetching image data:", err));
  };

  const handleClusterImageSelect = (imageName: string) => {
    setSelectedClusterImages((prev) =>
      prev.includes(imageName)
        ? prev.filter((name) => name !== imageName)
        : [...prev, imageName]
    );
  };

  const handleSwitchChange = (index: number) => {
    setRedStatus((prev) => ({
      ...prev,
      [index]: !prev[index], // 현재 index에 해당하는 상태를 반전
    }));
  };

  const handleRun = () => {
    if (selectedImage) {
      console.log(selectedImage);
      console.log(selectedClusterImages);
      fetch("http://localhost:3000/api/select-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageName: selectedImage,
          selectedImages: selectedClusterImages,
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log(data.message))
        .catch((err) => console.error("Error selecting images:", err));
    }
  };

  const handlePython = async () => {
    if (selectedImage) {
      await fetch("http://localhost:3000/api/run-python", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageName: selectedImage }),
      })
        .then((response) => response.json())
        .then((data) => {
          const imagePathArray = data.processImage.split("\\");
          const imgName = imagePathArray[imagePathArray.length - 1];
          setTimeout(() => {
            setProcessedImage(imgName);
          }, 3000);
        })
        .catch((err) => console.error("Error running Python script:", err));
    }
  };

  const toast = useToast();
  const handleSave = async () => {
    const selectedIndexes = selectedClusterImages.map((url) =>
      clusterData.findIndex((item) => item.imageUrl === url)
    );
    const redIndexes = selectedIndexes.filter((index) => redStatus[index]);
    const nonRedIndexes = selectedIndexes.filter((index) => !redStatus[index]);
    await fetch("http://localhost:3000/api/save-result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageName: selectedImage,
        red: redIndexes,
        pink: nonRedIndexes,
      }),
    }).then(() => {
      toast({
        title: "Results are saved",
        description: "Make txt files & copied images",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  const handleRecluster = async () => {
    await fetch("http://localhost:3000/api/need-recluster", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageName: selectedImage,
      }),
    }).then(() => {
      toast({
        title: "Need Recluster Done",
        description: "Copied image to Need Recluster",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  return (
    <Box p="5">
      <Heading as="h1" mb="5">
        Image Data Labelling
      </Heading>
      <HStack wrap="wrap">
        {images.map((image) => (
          <ImageItem key={image} name={image} onSelect={handleImageSelect} />
        ))}
      </HStack>
      <Box position="relative" padding="10">
        <Divider />
        <AbsoluteCenter bg="white" px="4">
          Content
        </AbsoluteCenter>
      </Box>
      {selectedImage && (
        <Flex mt="5" gap="5">
          <VStack spacing="5" align="start">
            <Heading as="h3" size="md">
              Clustering Results
            </Heading>
            <SimpleGrid columns={4} spacing={5}>
              {clusterData.map((data, index) => (
                <ClusterResult
                  key={index}
                  data={data}
                  index={index}
                  selectedClusterImages={selectedClusterImages}
                  handleClusterImageSelect={handleClusterImageSelect}
                  isRed={!!redStatus[index]}
                  handleSwitchChange={() => handleSwitchChange(index)}
                />
              ))}
            </SimpleGrid>
          </VStack>
          <VStack spacing="10">
            <Button onClick={handleRun} colorScheme="blue" mt="12">
              Copy Mask
            </Button>
            <Button onClick={handlePython} colorScheme="teal" size="md">
              Make Mask
            </Button>
            <Button onClick={handleSave} colorScheme="purple" size="md">
              Save Result
            </Button>
            <Button onClick={handleRecluster} colorScheme="red" size="md">
              Need Recluster
            </Button>
          </VStack>
          <VStack spacing="5" align="start" ml="10">
            <Heading as="h2" size="lg">
              {`Selected Image : ${selectedImage}`}
            </Heading>
            <HStack>
              <VStack>
                <Heading as="h3" size="lg">
                  Original Image
                </Heading>
                <Image
                  src={`http://localhost:3000/data/original/${selectedImage}`}
                  alt={selectedImage}
                  boxSize="300px"
                />
              </VStack>
              <VStack>
                <Heading as="h3" size="lg">
                  Processed Image
                </Heading>
                <Image
                  src={
                    `http://localhost:3000/data/${selectedImage}/original/${processedImage}` ||
                    ""
                  }
                  alt={
                    `http://localhost:3000/data/${selectedImage}/original/${processedImage}` ||
                    ""
                  }
                  boxSize="300px"
                />
              </VStack>
            </HStack>
          </VStack>
        </Flex>
      )}
    </Box>
  );
};

export default App;
