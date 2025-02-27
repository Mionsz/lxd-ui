import React, { FC } from "react";
import {
  Button,
  Col,
  Icon,
  Input,
  Row,
  Select,
  Textarea,
} from "@canonical/react-components";
import ProfileSelect from "pages/profiles/ProfileSelector";
import SelectImageBtn from "pages/images/actions/SelectImageBtn";
import { isContainerOnlyImage, isVmOnlyImage, LOCAL_ISO } from "util/images";
import { instanceCreationTypes } from "util/instanceOptions";
import { FormikProps } from "formik/dist/types";
import { CreateInstanceFormValues } from "pages/instances/CreateInstanceForm";
import { RemoteImage } from "types/image";
import InstanceLocationSelect from "pages/instances/forms/InstanceLocationSelect";
import UseCustomIsoBtn from "pages/images/actions/UseCustomIsoBtn";

export interface InstanceDetailsFormValues {
  name?: string;
  description?: string;
  image?: RemoteImage;
  instanceType: string;
  profiles: string[];
  target?: string;
  type: "instance";
  readOnly: boolean;
}

export const instanceDetailPayload = (values: CreateInstanceFormValues) => {
  const payload: Record<string, string | undefined | object> = {
    name: values.name,
    description: values.description,
    type: values.instanceType,
    profiles: values.profiles,
    source: {
      alias: values.image?.aliases.split(",")[0],
      mode: "pull",
      protocol: "simplestreams",
      server: values.image?.server,
      type: "image",
    },
  };

  if (values.image?.server === LOCAL_ISO) {
    payload.source = {
      type: "none",
      certificate: "",
      allow_inconsistent: false,
    };
  }

  return payload;
};

interface Props {
  formik: FormikProps<CreateInstanceFormValues>;
  onSelectImage: (image: RemoteImage, type: string | null) => void;
  project: string;
}

const InstanceCreateDetailsForm: FC<Props> = ({
  formik,
  onSelectImage,
  project,
}) => {
  function figureBaseImageName() {
    const image = formik.values.image;
    return image
      ? `${image.os} ${image.release} ${image.aliases.split(",")[0]}`
      : "";
  }

  return (
    <div className="details">
      <Row>
        <Col size={8}>
          <Input
            id="name"
            name="name"
            type="text"
            label="Instance name"
            placeholder="Enter name"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.name}
            error={formik.touched.name ? formik.errors.name : null}
          />
          <Textarea
            id="description"
            name="description"
            label="Description"
            placeholder="Enter description"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.description}
            rows={Math.max(
              1,
              Math.ceil((formik.values.description?.length ?? 0) / 46)
            )}
          />
        </Col>
      </Row>
      <Row>
        <Col size={8}>
          <label className="p-form__label" htmlFor="base-image">
            Base Image*
          </label>
          <div className="p-form__control u-clearfix base-image">
            {formik.values.image && (
              <>
                <span className="u-text--muted u-truncate u-sv3 image-name">
                  {figureBaseImageName()}
                </span>
                <Button
                  appearance="base"
                  type="button"
                  onClick={() => formik.setFieldValue("image", undefined)}
                  title="Clear"
                  hasIcon
                >
                  <Icon name="close" />
                </Button>
              </>
            )}
            {!formik.values.image && (
              <>
                <SelectImageBtn onSelect={onSelectImage} />
                <UseCustomIsoBtn onSelect={onSelectImage} />
              </>
            )}
          </div>
          <Select
            id="instanceType"
            label="Instance type"
            name="instanceType"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            options={instanceCreationTypes}
            value={formik.values.instanceType}
            disabled={
              !formik.values.image ||
              isContainerOnlyImage(formik.values.image) ||
              isVmOnlyImage(formik.values.image)
            }
            title={
              !formik.values.image
                ? "Please select an image before adding a type"
                : ""
            }
          />
          <InstanceLocationSelect formik={formik} />
        </Col>
      </Row>
      <ProfileSelect
        project={project}
        selected={formik.values.profiles}
        setSelected={(value) => formik.setFieldValue("profiles", value)}
        isReadOnly={!formik.values.image}
        title={
          !formik.values.image
            ? "Please select an image before adding profiles"
            : ""
        }
      />
    </div>
  );
};

export default InstanceCreateDetailsForm;
