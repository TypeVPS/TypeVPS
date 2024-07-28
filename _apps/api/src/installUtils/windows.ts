import { prismaClient } from "@/db";
import { ProxmoxIdOBJ, proxmoxApi } from "@typevps/proxmox";
import { VMState } from "@typevps/shared";

const calculateBitLengthFromSubnetMask = (subnetMask: string) => {
    const subnetMaskBitLength = subnetMask.split('.').map((octet) => {
        const binaryOctet = parseInt(octet).toString(2);
        return binaryOctet.split('').filter((bit) => bit === '1').length;
    }).reduce((a, b) => a + b);

    return subnetMaskBitLength;
}
const generateNetworkScript = async (vmId: string) => {
    const vm = await prismaClient.userVirtualMachine.findUnique({
        where: {
            id: vmId
        },
        include: {
            AssignedIpAddress: {
                include: {
                    IpAddress: true
                }
            }
        }
    })

    if (!vm) {
        throw new Error('vm not found');
    }

    const primaryIpV4Address = vm.AssignedIpAddress.find(ip => ip.IpAddress.address === vm.primaryIpv4Address)?.IpAddress;
    if (!primaryIpV4Address) {
        throw new Error('primary ipv4 address not found');
    }

    const script = `
$defaultInterface = Get-NetAdapter | Where-Object { $_.InterfaceAlias -like "Ethernet*" } | Select-Object -First 1

$ipv4Address = "${primaryIpV4Address.address}"
$subnetMaskBitLength = "${calculateBitLengthFromSubnetMask(primaryIpV4Address.subnet)}"
$defaultGateway = "${primaryIpV4Address.gateway}"
 
Get-NetIPAddress -InterfaceIndex $defaultInterface.ifIndex | Remove-NetIPAddress -Confirm:$false
Remove-NetRoute -InterfaceIndex $defaultInterface.ifIndex -DestinationPrefix "0.0.0.0/0" -Confirm:$false
New-NetIPAddress -InterfaceIndex $defaultInterface.ifIndex -IPAddress $ipv4Address -PrefixLength $subnetMaskBitLength -DefaultGateway $defaultGateway

$dnsServers = '1.1.1.1', '1.0.0.1'
$defaultInterface | Set-DnsClientServerAddress -ServerAddresses $dnsServers
`

    return script;
}


export const windowsPostInstall = async (opts: {
    vmId: string;
    vmIdObj: ProxmoxIdOBJ;
    state: VMState;

    password: string;
    username: string;
}) => {
    const command = 'powershell.exe -NoExit'
    const script = await generateNetworkScript(opts.vmId)

    await proxmoxApi.agent.exec(opts.vmIdObj, command, script)
    await proxmoxApi.agent.setPassword(opts.vmIdObj, opts.username, opts.password)
}