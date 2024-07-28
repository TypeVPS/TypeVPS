-- CreateTable
CREATE TABLE "DineroUserAccountLink" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "dineroUserGuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DineroUserAccountLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DineroUserAccountLink" ADD CONSTRAINT "DineroUserAccountLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
