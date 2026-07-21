-- Tambah handle login opsional untuk seller (login pakai username ATAU email)
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
