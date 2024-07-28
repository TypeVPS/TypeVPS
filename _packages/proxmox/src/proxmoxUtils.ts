import proxmoxApi from "./proxmoxApi";

/* const getNodeIPAddress = (node: string) => {
	return "192.168.3.51";
};
 */
const generateUniqueVncPort = (node: string, vmId: number) => {
	return 5900 + vmId;
};

export const generateVmId = async (node: string) => {
	const clusterVms = await proxmoxApi.cluster.getResources();
	const existingIds = clusterVms.map((vm) => vm?.vmid).filter(Boolean);

	// find next available vm id
	let vmid = 100;
	while (existingIds.includes(vmid)) {
		vmid++;
	}

	return vmid;
};

const createVirtualMachineTemplate = async (params: {
	node: string;
	templateId: number;
	description: string;
	name: string;
}) => {
	const vmid = await generateVmId(params.node);

	const newVm = await proxmoxApi.qemu.clone(
		{
			node: params.node,
			vmid: params.templateId,
		},
		{
			newId: vmid,
			name: params.name,
			targetNode: params.node,
			description: params.description,
		},
	);

	return {
		vmid,
		taskId: newVm.taskId,
	};
};

export default {
	generateUniqueVncPort,
	generateVmId,
	createVirtualMachineTemplate,
	//getNodeIPAddress,
};
