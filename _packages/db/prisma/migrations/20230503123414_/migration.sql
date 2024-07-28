-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('STRIPE', 'COINBASE_COMMERCE', 'BITPAY_SERVER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('VPS', 'GAME_SERVER');

-- CreateEnum
CREATE TYPE "ActiveProductPaymentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'WAITING_FOR_INITIAL_PAYMENT');

-- CreateEnum
CREATE TYPE "ProxmoxInstallStatus" AS ENUM ('AWAITING_CONFIG', 'INSTALLING', 'ERROR', 'OK');

-- CreateEnum
CREATE TYPE "IpAddressKind" AS ENUM ('IPV4', 'IPV6');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PENDING_EXPIRED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'PENDING_EXPIRED', 'ACTIVE', 'ACTIVE_TRAILING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstallTemplateType" AS ENUM ('WINDOWS_CLOUD_INIT', 'LINUX_CLOUD_INIT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole"[] DEFAULT ARRAY['USER']::"UserRole"[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdIp" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "SSHKey" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SSHKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "networkBandwidthBytes" BIGINT NOT NULL,
    "networkBandwidthDedicatedMegabit" INTEGER NOT NULL,
    "networkBandwidthBurstMegabit" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 9999,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "diskBytes" BIGINT NOT NULL,
    "ramBytes" BIGINT NOT NULL,
    "cpuCores" INTEGER NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "isUserSpecialOffer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpAddress" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "subnet" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "kind" "IpAddressKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignedIpAddress" (
    "id" TEXT NOT NULL,
    "ipAddressId" TEXT NOT NULL,
    "userVirtualMachineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignedIpAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVirtualMachine" (
    "id" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "networkBandwidthBytes" BIGINT NOT NULL,
    "networkBandwidthDedicatedMegabit" INTEGER NOT NULL,
    "networkBandwidthBurstMegabit" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "diskBytes" BIGINT NOT NULL,
    "ramBytes" BIGINT NOT NULL,
    "cpuCores" INTEGER NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstPaymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installStatus" "ProxmoxInstallStatus" NOT NULL DEFAULT 'AWAITING_CONFIG',
    "installError" TEXT,
    "primaryIpv4Address" TEXT,
    "primaryIpv6Address" TEXT,
    "userPaidServiceId" TEXT NOT NULL,
    "vmUsername" TEXT,
    "vmPassword" TEXT,

    CONSTRAINT "UserVirtualMachine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentProvider" "PaymentProviderType" NOT NULL,
    "paymentProviderId" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "userPaidServiceId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "paymentProvider" "PaymentProviderType" NOT NULL,
    "paymentProviderId" TEXT,
    "paymentProviderSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "price" DOUBLE PRECISION NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "userPaidServiceId" TEXT NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallTemplate" (
    "id" TEXT NOT NULL,
    "type" "InstallTemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "proxmoxTemplateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "firstPaymentConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "SSHKey_userId_idx" ON "SSHKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IpAddress_address_key" ON "IpAddress"("address");

-- CreateIndex
CREATE UNIQUE INDEX "AssignedIpAddress_ipAddressId_key" ON "AssignedIpAddress"("ipAddressId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentProviderId_key" ON "Payment"("paymentProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentProviderId_key" ON "Subscription"("paymentProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentProviderSubscriptionId_key" ON "Subscription"("paymentProviderSubscriptionId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSHKey" ADD CONSTRAINT "SSHKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedIpAddress" ADD CONSTRAINT "AssignedIpAddress_ipAddressId_fkey" FOREIGN KEY ("ipAddressId") REFERENCES "IpAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedIpAddress" ADD CONSTRAINT "AssignedIpAddress_userVirtualMachineId_fkey" FOREIGN KEY ("userVirtualMachineId") REFERENCES "UserVirtualMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVirtualMachine" ADD CONSTRAINT "UserVirtualMachine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVirtualMachine" ADD CONSTRAINT "UserVirtualMachine_userPaidServiceId_fkey" FOREIGN KEY ("userPaidServiceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userPaidServiceId_fkey" FOREIGN KEY ("userPaidServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userPaidServiceId_fkey" FOREIGN KEY ("userPaidServiceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
