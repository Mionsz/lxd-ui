import { LxdConfigPair } from "./config";

type LXDAuthMethods = "tls" | "oidc" | "unix";

export interface LxdSettings {
  api_status: string;
  config: LxdConfigPair;
  environment?: {
    architectures: string[];
    os_name?: string;
    server_version: ?string;
    server_clustered: boolean;
  };
  auth?: "trusted" | "untrusted";
  auth_methods?: LXDAuthMethods;
  auth_user_method?: LXDAuthMethods;
  auth_user_name?: string;
}
