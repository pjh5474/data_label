import { Box, Image, Text } from "@chakra-ui/react";

interface ImageProps {
  name: string;
  onSelect: (imageName: string) => void;
}

export default function ImageItem({ name, onSelect }: ImageProps) {
  return (
    <Box
      onClick={() => onSelect(name)}
      cursor="pointer"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      m="2"
      _hover={{ shadow: "md" }}
    >
      <Image
        src={`http://localhost:3000/data/original/${name}`}
        alt={name}
        boxSize="100px"
        objectFit="cover"
      />
      <Text p="2">{name}</Text>
    </Box>
  );
}
