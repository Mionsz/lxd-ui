import React, { FC, ReactNode, useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Icon,
  Notification,
  Row,
  useNotify,
} from "@canonical/react-components";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createInstance, startInstance } from "api/instances";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import SubmitButton from "components/SubmitButton";
import { RemoteImage } from "types/image";
import { isContainerOnlyImage, isVmOnlyImage, LOCAL_ISO } from "util/images";
import { checkDuplicateName } from "util/helpers";
import { dump as dumpYaml } from "js-yaml";
import { yamlToObject } from "util/yaml";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LxdInstance } from "types/instance";
import { Location } from "history";
import InstanceCreateDetailsForm, {
  instanceDetailPayload,
  InstanceDetailsFormValues,
} from "pages/instances/forms/InstanceCreateDetailsForm";
import {
  formDeviceToPayload,
  FormDeviceValues,
  remoteImageToIsoDevice,
} from "util/formDevices";
import SecurityPoliciesForm, {
  SecurityPoliciesFormValues,
  securityPoliciesPayload,
} from "pages/instances/forms/SecurityPoliciesForm";
import SnapshotsForm, {
  SnapshotFormValues,
  snapshotsPayload,
} from "pages/instances/forms/SnapshotsForm";
import CloudInitForm, {
  CloudInitFormValues,
  cloudInitPayload,
} from "pages/instances/forms/CloudInitForm";
import ResourceLimitsForm, {
  ResourceLimitsFormValues,
  resourceLimitsPayload,
} from "pages/instances/forms/ResourceLimitsForm";
import YamlForm, { YamlFormValues } from "pages/instances/forms/YamlForm";
import InstanceFormMenu, {
  CLOUD_INIT,
  STORAGE,
  MAIN_CONFIGURATION,
  RESOURCE_LIMITS,
  SECURITY_POLICIES,
  SNAPSHOTS,
  YAML_CONFIGURATION,
  NETWORKS,
} from "pages/instances/forms/InstanceFormMenu";
import useEventListener from "@use-it/event-listener";
import { updateMaxHeight } from "util/updateMaxHeight";
import RootStorageForm from "pages/instances/forms/RootStorageForm";
import NetworkForm from "pages/instances/forms/NetworkForm";
import { useEventQueue } from "context/eventQueue";
import { getInstanceName } from "util/operations";
import NotificationRow from "components/NotificationRow";

export type CreateInstanceFormValues = InstanceDetailsFormValues &
  FormDeviceValues &
  ResourceLimitsFormValues &
  SecurityPoliciesFormValues &
  SnapshotFormValues &
  CloudInitFormValues &
  YamlFormValues;

interface PresetFormState {
  retryFormValues?: CreateInstanceFormValues;
  selectedImage?: RemoteImage;
  cancelLocation?: string;
}

const CreateInstanceForm: FC = () => {
  const eventQueue = useEventQueue();
  const location = useLocation() as Location<PresetFormState | null>;
  const navigate = useNavigate();
  const notify = useNotify();
  const { project } = useParams<{ project: string }>();
  const queryClient = useQueryClient();
  const controllerState = useState<AbortController | null>(null);
  const [section, setSection] = useState(MAIN_CONFIGURATION);
  const [isConfigOpen, setConfigOpen] = useState(false);

  if (!project) {
    return <>Missing project</>;
  }

  const InstanceSchema = Yup.object().shape({
    name: Yup.string()
      .test(
        "deduplicate",
        "An instance with this name already exists",
        (value) =>
          checkDuplicateName(value, project, controllerState, "instances")
      )
      .matches(/^[A-Za-z0-9-]+$/, {
        message: "Only alphanumeric and hyphen characters are allowed",
      })
      .matches(/^[A-Za-z].*$/, {
        message: "Instance name must start with a letter",
      })
      .optional(),
    instanceType: Yup.string().required("Instance type is required"),
  });

  const updateFormHeight = () => {
    updateMaxHeight("form-contents", "p-bottom-controls");
  };
  useEffect(updateFormHeight, [notify.notification?.message, section]);
  useEventListener("resize", updateFormHeight);

  const clearCache = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryKeys.instances],
    });
  };

  const notifyLaunchedAndStarted = (instanceLink: ReactNode) => {
    notify.success(<>Launched and started instance {instanceLink}.</>);
    clearCache();
  };

  const notifyCreatedButStartFailed = (instanceLink: ReactNode, e: Error) => {
    notify.failure(
      "Error",
      e,
      <>The instance {instanceLink} was created, but could not be started.</>
    );
    clearCache();
  };

  const notifyLaunched = (instanceLink: ReactNode, message?: ReactNode) => {
    notify.success(
      <>
        Launched instance {instanceLink}.{message}
      </>
    );
    clearCache();
  };

  const notifyLaunchFailed = (
    e: Error,
    formUrl: string,
    values: CreateInstanceFormValues
  ) => {
    notify.failure("Instance creation failed", e, null, [
      {
        label: "Check configuration",
        onClick: () =>
          navigate(formUrl, { state: { retryFormValues: values } }),
      },
    ]);
    clearCache();
  };

  const creationCompletedHandler = (
    instanceName: string,
    shouldStart: boolean,
    isIsoImage: boolean
  ) => {
    const instanceLink = (
      <Link to={`/ui/project/${project}/instances/detail/${instanceName}`}>
        {instanceName}
      </Link>
    );

    if (shouldStart) {
      startInstance({
        name: instanceName,
        project: project,
      } as LxdInstance)
        .then(() => {
          notifyLaunchedAndStarted(instanceLink);
        })
        .catch((e: Error) => {
          notifyCreatedButStartFailed(instanceLink, e);
        });
    } else {
      const consoleUrl = `/ui/project/${project}/instances/detail/${instanceName}/console`;
      const message = isIsoImage && (
        <>
          <p>Continue the installation process from its console.</p>
          <Button onClick={() => navigate(consoleUrl)} hasIcon>
            <Icon name="canvas" />
            <span>Open console</span>
          </Button>
        </>
      );
      notifyLaunched(instanceLink, message);
    }
  };

  const submit = (values: CreateInstanceFormValues, shouldStart = true) => {
    const formUrl = location.pathname + location.search;
    navigate(`/ui/project/${project}/instances`);

    const instancePayload = values.yaml
      ? yamlToObject(values.yaml)
      : getPayload(values);

    createInstance(JSON.stringify(instancePayload), project, values.target)
      .then((operation) => {
        const instanceName = getInstanceName(operation.metadata);
        if (!instanceName) {
          return;
        }
        const isIsoImage = values.image?.server === LOCAL_ISO;
        eventQueue.set(
          operation.metadata.id,
          () => creationCompletedHandler(instanceName, shouldStart, isIsoImage),
          (msg) => notifyLaunchFailed(new Error(msg), formUrl, values)
        );
      })
      .catch((e: Error) => {
        if (e.message === "Cancelled") {
          return;
        }
        notifyLaunchFailed(e, formUrl, values);
      });
  };

  const formik = useFormik<CreateInstanceFormValues>({
    initialValues: location.state?.retryFormValues ?? {
      instanceType: "container",
      profiles: ["default"],
      devices: [{ type: "nic", name: "" }],
      readOnly: false,
      type: "instance",
    },
    validationSchema: InstanceSchema,
    onSubmit: (values) => {
      submit(values);
    },
  });

  const isLocalIsoImage = formik.values.image?.server === LOCAL_ISO;

  const handleSelectImage = (image: RemoteImage, type: string | null) => {
    void formik.setFieldValue("image", image);

    const devices = formik.values.devices.filter(
      (item) => item.type !== "iso-volume"
    );
    if (image.server === LOCAL_ISO) {
      const isoDevice = remoteImageToIsoDevice(image);
      devices.push(isoDevice);
    }
    void formik.setFieldValue("devices", devices);

    if (type) {
      void formik.setFieldValue("instanceType", type);
    }
    if (isVmOnlyImage(image)) {
      void formik.setFieldValue("instanceType", "virtual-machine");
    }
    if (isContainerOnlyImage(image)) {
      void formik.setFieldValue("instanceType", "container");
    }
    notify.clear();
  };

  useEffect(() => {
    if (location.state?.selectedImage) {
      const type = location.state.selectedImage.volume ? "iso-volume" : null;
      handleSelectImage(location.state.selectedImage, type);
    }
  }, [location.state?.selectedImage]);

  const getPayload = (values: CreateInstanceFormValues) => {
    return {
      ...instanceDetailPayload(values),
      devices: formDeviceToPayload(values.devices),
      config: {
        ...resourceLimitsPayload(values),
        ...securityPoliciesPayload(values),
        ...snapshotsPayload(values),
        ...cloudInitPayload(values),
      },
    };
  };

  const updateSection = (newItem: string) => {
    if (Boolean(formik.values.yaml) && newItem !== YAML_CONFIGURATION) {
      void formik.setFieldValue("yaml", undefined);
    }
    setSection(newItem);
  };

  const toggleMenu = () => {
    setConfigOpen((old) => !old);
  };

  function getYaml() {
    const payload = getPayload(formik.values);
    return dumpYaml(payload);
  }

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__header">
          <h1 className="p-panel__title">Create an instance</h1>
        </div>
        <div className="p-panel__content create-instance">
          <Form onSubmit={() => submit(formik.values)} stacked className="form">
            <InstanceFormMenu
              active={section}
              setActive={updateSection}
              isConfigDisabled={!formik.values.image}
              isConfigOpen={isConfigOpen}
              toggleConfigOpen={toggleMenu}
            />
            <Row className="form-contents" key={section}>
              <Col size={12}>
                <NotificationRow />
                {section === MAIN_CONFIGURATION && (
                  <InstanceCreateDetailsForm
                    formik={formik}
                    project={project}
                    onSelectImage={handleSelectImage}
                  />
                )}

                {section === STORAGE && (
                  <RootStorageForm formik={formik} project={project} />
                )}

                {section === NETWORKS && (
                  <NetworkForm formik={formik} project={project} />
                )}

                {section === RESOURCE_LIMITS && (
                  <ResourceLimitsForm formik={formik} />
                )}

                {section === SECURITY_POLICIES && (
                  <SecurityPoliciesForm formik={formik} />
                )}

                {section === SNAPSHOTS && <SnapshotsForm formik={formik} />}

                {section === CLOUD_INIT && <CloudInitForm formik={formik} />}

                {section === YAML_CONFIGURATION && (
                  <YamlForm
                    yaml={getYaml()}
                    setYaml={(yaml) => void formik.setFieldValue("yaml", yaml)}
                  >
                    <Notification
                      severity="caution"
                      title="Before you edit the YAML"
                    >
                      Changes will be discarded, when switching back to the
                      guided forms.
                    </Notification>
                  </YamlForm>
                )}
              </Col>
            </Row>
          </Form>
          <div className="p-bottom-controls" id="form-footer">
            <hr />
            <Row className="u-align--right">
              <Col size={12}>
                <Button
                  appearance="base"
                  onClick={() =>
                    navigate(
                      location.state?.cancelLocation ??
                        `/ui/project/${project}/instances`
                    )
                  }
                >
                  Cancel
                </Button>
                <SubmitButton
                  isSubmitting={formik.isSubmitting}
                  isDisabled={!formik.isValid || !formik.values.image}
                  buttonLabel="Create"
                  appearance={isLocalIsoImage ? "positive" : "default"}
                  onClick={() => submit(formik.values, false)}
                />
                {!isLocalIsoImage && (
                  <SubmitButton
                    isSubmitting={formik.isSubmitting}
                    isDisabled={!formik.isValid || !formik.values.image}
                    buttonLabel="Create and start"
                    onClick={() => submit(formik.values)}
                  />
                )}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateInstanceForm;
