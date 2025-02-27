import React, { FC } from "react";
import { Button } from "@canonical/react-components";
import usePortal from "react-useportal";
import { RemoteImage } from "types/image";
import ImageSelector from "pages/images/ImageSelector";

interface Props {
  onSelect: (image: RemoteImage, type: string | null) => void;
}

const SelectImageBtn: FC<Props> = ({ onSelect }) => {
  const { openPortal, closePortal, isOpen, Portal } = usePortal();

  const handleSelect = (image: RemoteImage, type: string | null) => {
    closePortal();
    onSelect(image, type);
  };

  return (
    <>
      <Button
        appearance="positive"
        onClick={openPortal}
        type="button"
        id="select-image"
      >
        <span>Browse images</span>
      </Button>
      {isOpen && (
        <Portal>
          <ImageSelector onClose={closePortal} onSelect={handleSelect} />
        </Portal>
      )}
    </>
  );
};

export default SelectImageBtn;
