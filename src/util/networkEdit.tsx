import { LxdNetwork } from "types/network";

const toBool = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return value === "true";
};

export const getNetworkEditValues = (network: LxdNetwork) => {
  return {
    readOnly: true,
    name: network.name,
    description: network.description,
    type: network.type,
    bridge_driver: network.config["bridge.driver"],
    bridge_hwaddr: network.config["bridge.hwaddr"],
    bridge_mode: network.config["bridge.mode"],
    bridge_mtu: network.config["bridge.mtu"],
    dns_domain: network.config["dns.domain"],
    dns_mode: network.config["dns.mode"],
    dns_search: network.config["dns.search"],
    fan_type: network.config["fan.type"],
    fan_overlay_subnet: network.config["fan.overlay_subnet"],
    fan_underlay_subnet: network.config["fan.underlay_subnet"],
    ipv4_address: network.config["ipv4.address"],
    ipv4_dhcp: toBool(network.config["ipv4.dhcp"]),
    ipv4_dhcp_expiry: network.config["ipv4.dhcp.expiry"],
    ipv4_dhcp_ranges: network.config["ipv4.dhcp.ranges"],
    ipv4_l3only: toBool(network.config["ipv4.l3only"]),
    ipv4_nat: toBool(network.config["ipv4.nat"]),
    ipv4_nat_address: network.config["ipv4.nat.address"],
    ipv4_ovn_ranges: network.config["ipv4.ovn.ranges"],
    ipv6_address: network.config["ipv6.address"],
    ipv6_dhcp: toBool(network.config["ipv6.dhcp"]),
    ipv6_dhcp_expiry: network.config["ipv6.dhcp.expiry"],
    ipv6_dhcp_ranges: network.config["ipv6.dhcp.ranges"],
    ipv6_dhcp_stateful: toBool(network.config["ipv6.dhcp.stateful"]),
    ipv6_l3only: toBool(network.config["ipv6.l3only"]),
    ipv6_nat: toBool(network.config["ipv6.nat"]),
    ipv6_nat_address: network.config["ipv6.nat.address"],
    ipv6_ovn_ranges: network.config["ipv6.ovn.ranges"],
    network: network.config.network,
  };
};

export const handleConfigKeys = [
  "bridge.driver",
  "bridge.hwaddr",
  "bridge.mode",
  "bridge.mtu",
  "dns.domain",
  "dns.mode",
  "dns.search",
  "fan.type",
  "fan.overlay_subnet",
  "fan.underlay_subnet",
  "ipv4.address",
  "ipv4.dhcp",
  "ipv4.dhcp.expiry",
  "ipv4.dhcp.ranges",
  "ipv4.l3only",
  "ipv4.nat",
  "ipv4.nat.address",
  "ipv4.ovn.ranges",
  "ipv6.address",
  "ipv6.dhcp",
  "ipv6.dhcpexpiry",
  "ipv6.dhcp.ranges",
  "ipv6.dhcp.stateful",
  "ipv6.l3only",
  "ipv6.nat",
  "ipv6.nat.address",
  "ipv6.ovn.ranges",
  "network",
];
