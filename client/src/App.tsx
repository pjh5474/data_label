import React, { useState, useEffect } from "react";
import { Box, Image, VStack, HStack, Heading } from "@chakra-ui/react";
import ImageItem from "./components/ImageItem";

const App: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      .then(() => setSelectedImage(imageName))
      .catch((err) => console.error("Error copying image:", err));
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
      {selectedImage && (
        <VStack mt="5">
          <Heading as="h2" size="lg">
            Selected Image
          </Heading>
          <Image
            src={`http://localhost:3000/data/${selectedImage}/original/${selectedImage}`}
            alt={selectedImage}
            boxSize="300px"
            objectFit="cover"
          />
        </VStack>
      )}
    </Box>
  );
};

export default App;
