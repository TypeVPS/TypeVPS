import { IpAddress } from "@typevps/db";
import { ProxmoxIdOBJ, proxmoxApi } from "@typevps/proxmox";
import { VMState } from "@typevps/shared";

export const configureFirewall = async (opts: {
    ipAddresses: IpAddress[];
    vmId: string;
    state: VMState;
}) => {
    const id = {
        node: opts.state.node,
        vmid: opts.state.vmid,
    };

    // create the ipset
    await proxmoxApi.qemu.firewallCreateIpSet(id, {
        name: "allowed-ip-addresses",
    });

    // add the ips to the ipset
    await Promise.all(
        opts.ipAddresses.map(async (ip) => {
            await proxmoxApi.qemu.firewallAddIpSet(id, {
                ipset: "allowed-ip-addresses",
                cidr: ip.address,
                nomatch: false,
            });
        }),
    );

    await proxmoxApi.qemu.editFirewallConfig(id, {
        enable: true,
        policy_in: "DROP",
        policy_out: "DROP",
    });

    // restrict the VM from using any other IP
    await proxmoxApi.qemu.firewallAddRule(id, {
        action: "ACCEPT",
        enable: true,
        type: "in",
        dest: "+allowed-ip-addresses",
        source: "",
    });

    await proxmoxApi.qemu.firewallAddRule(id, {
        action: "ACCEPT",
        enable: true,
        type: "out",
        source: "+allowed-ip-addresses",
        dest: "",
    });
};

function _calculateCIDR(ip: string, subnetMask: string): string {
    const subnetParts = subnetMask.split('.').map(part => parseInt(part));
    const subnetBinary = subnetParts.map(part => part.toString(2).padStart(8, '0')).join('');

    const subnetMaskCIDR = subnetBinary.split('0').join('').length;
    const cidrNotation = `${ip}/${subnetMaskCIDR}`;

    return cidrNotation;
}

export const getIpWithCidr = (ip: IpAddress) => {
    return _calculateCIDR(ip.address, ip.subnet);
}

export const configureNetwork = async (opts: {
    ipAddresses: IpAddress[];
    vmId: string;
    vmIdObj: ProxmoxIdOBJ;
    state: VMState;
}) => {
    // do we need to delete or create any network interfaces?
    const config = await proxmoxApi.qemu.getVmConfig(opts.vmIdObj);

    // delete all existing network interfaces
    const networkInterfaceKeys = Object.keys(config).filter((key) =>
        key.startsWith("net"),
    );

    // delete all existing network interfaces
    if (networkInterfaceKeys.length > 0) {
        await proxmoxApi.qemu.deleteVarsFromVmConfig(
            opts.vmIdObj,
            networkInterfaceKeys,
        );
    }

    const vmConfig = {
        net: opts.ipAddresses.map(() => {
            return {
                bridge: "vmbr0",
                model: "virtio",
                firewall: true,
            };
        }),

        // this is using cloud init to configure the network
        ipconfig: opts.ipAddresses.map((ip) => {
            return {
                ipv4: getIpWithCidr(ip),
                gateway: ip.gateway,
            };
        })
    }
    console.log(`vmConfig: ${JSON.stringify(vmConfig)}`)

    // assign the new network interfaces
    await proxmoxApi.qemu.editVmConfig(opts.vmIdObj, {
        vmConfig
    });

    /*

        const config = await proxmoxApi.qemu.getVmConfig(opts.vmIdObj);
    const toRemove: string[] = [];
    const existingNetworkInterfaces: {
        macAddress: string;
        key: string;
    }[] = [];

    // remove all network interfaces, that is not in db config, loop through key value of config
    for (const [key, value] of Object.entries(config)) {
        if(typeof value !== 'string') {
            continue;
        }
    	
        if (!key.startsWith("net")) {
            continue;
        }

        const macAddress = value.match(/=([a-zA-Z0-9:]+)/)?.[1];
        if (!macAddress) {
            toRemove.push(key);
            continue;
        }

        const ip = opts.ipAddresses.find((ip) => ip.macAddress === macAddress);
        if (!ip) {
            toRemove.push(key);
        }

        existingNetworkInterfaces.push({
            macAddress,
            key,
        });
    }

    console.log(`remove: ${toRemove.join(", ")}`);

    // delete all existing network interfaces
    await proxmoxApi.qemu.deleteVarsFromVmConfig(
        opts.vmIdObj,
        toRemove
    );

    // assign the new network interfaces
    await proxmoxApi.qemu.editVmConfig(opts.vmIdObj, {
        net: opts.ipAddresses.map((ip) => {
            return {
                bridge: "vmbr0",
                model: `virtio=${ip.macAddress}`,
                firewall: true,
            };
        }),
    });*/

};
