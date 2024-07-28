IMAGES=("https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img" "https://cloud.debian.org/images/cloud/bullseye/latest/debian-11-genericcloud-amd64.qcow2")
IMAGE_NAME=("ubuntu" "debian")
DOWNLOAD_PATH="./images"
STORAGE="local"
VMMem=1024
VMSETTINGS="--net0 virtio,bridge=vmbr0"
VMSETTINGS=""
# ensure download path exists
mkdir -p "${DOWNLOAD_PATH}"

# ensure libguestfs-tools is installed
if ! dpkg -s libguestfs-tools >/dev/null 2>&1; then
    echo "Installing libguestfs-tools..."
    apt-get install -y libguestfs-tools
fi

echo "Downloading images..."
for i in "${!IMAGES[@]}"; do
    name="${IMAGE_NAME[$i]}"
    echo " - downloading ${name}..."

    # does the file already exist?
    if [ -f "${DOWNLOAD_PATH}/${name}.qcow2" ]; then
        echo "File already exists, skipping..."
        continue
    fi

    # download image
    wget -q "${IMAGES[$i]}" -O "${DOWNLOAD_PATH}/${name}.qcow2"
done

# create proxmox templates
echo "Creating templates..."
# loop through images
for i in "${!IMAGES[@]}"; do
    name="${IMAGE_NAME[$i]}"
    echo " - creating: ${name}..."

    baseVMID=7000
    vmID=$((baseVMID+i))
    vmName="${name}-template"
    
    # modify the image, and add qemu-guest-agent
    echo "- Modifying image..."
    virt-customize -a "${DOWNLOAD_PATH}/${name}.qcow2" --install qemu-guest-agent



    echo "- Creating VM ${vmName} with ID ${vmID}..."
    qm create ${vmID} --name "${vmName}" --memory ${VMMem} ${VMSETTINGS}

    echo "- Importing image..."
    qm importdisk ${vmID} ${DOWNLOAD_PATH}/${name}.qcow2 ${STORAGE}

    echo "- Setting image as boot disk..."
    qm set ${vmID} --scsihw virtio-scsi-pci --scsi0 ${STORAGE}:${vmID}/vm-${vmID}-disk-0.raw

    echo "- Setting VM to boot from disk..."
    qm set ${vmID} --boot c --bootdisk scsi0

    echo "- Setting up cloudinit..."
    qm set ${vmID} --ide2 ${STORAGE}:cloudinit
    qm set ${vmID} --serial0 socket --vga serial0

    echo "- Setting up guest agent..."
    qm set ${vmID} --agent enabled=1,fstrim_cloned_disks=1

    # convert to template
    echo "- Converting to template..."
    qm template ${vmID} 

done