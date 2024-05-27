import {
  Box,
  Checkbox,
  HStack,
  Image,
  VStack,
  Switch,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import React, { useState } from "react";

export interface ClusterData {
  imageUrl: string;
  rgb: number[];
  avgrgb: number[];
}

export default function ClusterResult({
  data,
  index,
  selectedClusterImages,
  handleClusterImageSelect,
  setRedClusters,
  redClusters,
}: {
  data: ClusterData;
  index: number;
  selectedClusterImages: string[];
  handleClusterImageSelect: (imageName: string) => void;
  setRedClusters: React.Dispatch<React.SetStateAction<string[]>>;
  redClusters: string[];
}) {
  const [isRed, setIsRed] = useState(false);
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsRed(event.target.checked);
  };

  return (
    <VStack key={index} spacing={3} borderWidth="2px" p={1}>
      <Checkbox
        isChecked={selectedClusterImages.includes(data.imageUrl)}
        border={"black"}
        borderWidth="1px"
        onChange={() => handleClusterImageSelect(data.imageUrl)}
      >
        <Image
          src={`http://localhost:3000${data.imageUrl}`}
          alt={`Cluster ${index}`}
          boxSize="180px"
          objectFit="cover"
        />
      </Checkbox>
      <HStack>
        <Box
          bg={`rgb(${data.rgb.join(",")})`}
          boxSize="50px"
          aspectRatio={1}
          borderRadius="md"
        />
        <Box
          bg={`rgb(${data.avgrgb.join(",")})`}
          boxSize="50px"
          aspectRatio={1}
          borderRadius="md"
        />
        <FormControl display="flex" flexDir={"column"} alignItems="center">
          <FormLabel htmlFor="isRed" mb="0">
            Red?
          </FormLabel>
          <Switch id="isRed" isChecked={isRed} onChange={handleSwitchChange} />
        </FormControl>
      </HStack>
    </VStack>
  );
}
