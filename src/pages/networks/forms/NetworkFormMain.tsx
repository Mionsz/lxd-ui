import React, { FC, ReactNode } from "react";
import { CheckboxInput, Col, Input, Row } from "@canonical/react-components";
import { FormikProps } from "formik/dist/types";
import IpAddressSelector from "pages/networks/forms/IpAddressSelector";
import ConfigurationTable from "pages/networks/forms/ConfigurationTable";
import { getConfigurationRow } from "pages/networks/forms/ConfigurationRow";
import NetworkSelector from "pages/networks/forms/NetworkSelector";
import { NetworkFormValues } from "pages/networks/forms/NetworkForm";
import NetworkTypeSelector from "pages/networks/forms/NetworkTypeSelector";

interface Props {
  formik: FormikProps<NetworkFormValues>;
  project: string;
}

const NetworkForm: FC<Props> = ({ formik, project }) => {
  const getFormProps = (id: "type" | "network" | "name" | "description") => {
    return {
      id: id,
      name: id,
      onBlur: formik.handleBlur,
      onChange: formik.handleChange,
      value: formik.values[id] ?? "",
      error: formik.touched[id] ? (formik.errors[id] as ReactNode) : null,
      placeholder: `Enter ${id.replaceAll("_", " ")}`,
    };
  };

  return (
    <>
      <Row>
        <Col size={8}>
          <NetworkTypeSelector formik={formik} />
          <Input
            {...getFormProps("name")}
            type="text"
            label="Name"
            required
            disabled={formik.values.readOnly}
          />
          <Input
            {...getFormProps("description")}
            type="text"
            label="Description"
            disabled={formik.values.readOnly}
          />
          {formik.values.type === "ovn" && (
            <NetworkSelector
              props={getFormProps("network")}
              project={project}
              isDisabled={formik.values.readOnly}
            />
          )}
        </Col>
      </Row>
      <ConfigurationTable
        rows={[
          ...(formik.values.bridge_mode !== "fan"
            ? [
                getConfigurationRow({
                  formik: formik,
                  name: "ipv4_address",
                  label: "IPv4 Address",
                  defaultValue: "auto",
                  children: (
                    <IpAddressSelector
                      id="ipv4_address"
                      address={formik.values.ipv4_address}
                      setAddress={(value) => {
                        formik.setFieldValue("ipv4_address", value);

                        if (value === "none") {
                          const nullFields = [
                            "ipv4_nat",
                            "ipv4_dhcp",
                            "ipv4_dhcp_expiry",
                            "ipv4_dhcp_ranges",
                          ];
                          nullFields.forEach((field) =>
                            formik.setFieldValue(field, undefined)
                          );
                        }
                      }}
                    />
                  ),
                }),
              ]
            : []),

          ...(formik.values.bridge_mode !== "fan" &&
          formik.values.ipv4_address !== "none"
            ? [
                getConfigurationRow({
                  formik: formik,
                  name: "ipv4_nat",
                  label: "Ipv4 NAT",
                  defaultValue: "",
                  children: (
                    <CheckboxInput
                      label="Ipv4 NAT"
                      checked={formik.values.ipv4_nat}
                    />
                  ),
                }),
              ]
            : []),

          ...(formik.values.bridge_mode !== "fan"
            ? [
                getConfigurationRow({
                  formik: formik,
                  name: "ipv6_address",
                  label: "IPv6 Address",
                  defaultValue: "auto",
                  children: (
                    <IpAddressSelector
                      id="ipv6_address"
                      address={formik.values.ipv6_address}
                      setAddress={(value) => {
                        formik.setFieldValue("ipv6_address", value);

                        if (value === "none") {
                          const nullFields = [
                            "ipv6_nat",
                            "ipv6_dhcp",
                            "ipv6_dhcp_expiry",
                            "ipv6_dhcp_ranges",
                            "ipv6_dhcp_stateful",
                            "ipv6_ovn_ranges",
                          ];
                          nullFields.forEach((field) =>
                            formik.setFieldValue(field, undefined)
                          );
                        }
                      }}
                    />
                  ),
                }),
              ]
            : []),

          ...(formik.values.bridge_mode !== "fan" &&
          formik.values.ipv6_address !== "none"
            ? [
                getConfigurationRow({
                  formik: formik,
                  name: "ipv6_nat",
                  label: "Ipv6 NAT",
                  defaultValue: "",
                  children: (
                    <CheckboxInput
                      label="Ipv6 NAT"
                      checked={formik.values.ipv6_nat}
                    />
                  ),
                }),
              ]
            : []),

          ...(formik.values.bridge_mode === "fan"
            ? [
                getConfigurationRow({
                  formik: formik,
                  name: "fan_overlay_subnet",
                  label: "Fan overlay subnet",
                  help: "Subnet to use as the overlay for the FAN (CIDR)",
                  defaultValue: "",
                  children: <Input type="text" />,
                }),
              ]
            : []),

          ...(formik.values.bridge_mode === "fan"
            ? [
                getConfigurationRow({
                  formik: formik,
                  name: "fan_underlay_subnet",
                  label: "Fan underlay subnet",
                  help: "Subnet to use as the underlay for the FAN (use auto to use default gateway subnet) (CIDR)",
                  defaultValue: "",
                  children: <Input type="text" />,
                }),
              ]
            : []),
        ]}
      />
    </>
  );
};

export default NetworkForm;
