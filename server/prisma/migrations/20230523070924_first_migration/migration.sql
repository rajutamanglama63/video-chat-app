-- CreateTable
CREATE TABLE "Audio" (
    "id" SERIAL NOT NULL,
    "audioData" VARCHAR(255) NOT NULL,

    CONSTRAINT "Audio_pkey" PRIMARY KEY ("id")
);
