import { ENV } from "@/env";
import { UserVirtualMachine } from "@typevps/db";

export const getProxmoxVmName = (opts: {
    userId: number;
    userFullName: string;
    vmId: string;
}) => {
    const sanitizedUserName = opts.userFullName.replace(/[^a-zA-Z0-9]/g, "");
    const vmName = `${sanitizedUserName}-${opts.userId}-${opts.vmId}`;

    return vmName;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const selectBestNode = async (opts: {
    ramBytes: number;
    cpuCores: number;
    storageBytes: number;
    // eslint-disable-next-line @typescript-eslint/require-await
}) => {
    return ENV.PROXMOX_NODE
};

export const generateVmDescription = (vm: UserVirtualMachine) => {
    const PREFIX = "TYPEVPS_";
    const vmDescription = `---
* ${PREFIX}VMID=${vm.id}
* ${PREFIX}VM_NAME=${vm.name}
* ${PREFIX}VM_DISK=${vm.diskBytes}
* ${PREFIX}VM_IPV4=${vm.primaryIpv4Address ?? 'NULL'}
* ${PREFIX}VM_IPV6=${vm.primaryIpv6Address ?? 'NULL'}
* ${PREFIX}VM_RAM=${vm.ramBytes}
* ${PREFIX}VM_CPU=${vm.cpuCores}
---`;

    return vmDescription;
};