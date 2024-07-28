import _proxmoxApi from "./proxmoxApi";
import _proxmoxUtils from "./proxmoxUtils";
import { ProxmoxIdOBJ as ProxmoxIdOBJ_ } from "./proxmoxApi";

export const proxmoxApi = _proxmoxApi;
export const proxmoxUtils = _proxmoxUtils;
export type ProxmoxIdOBJ = ProxmoxIdOBJ_;
