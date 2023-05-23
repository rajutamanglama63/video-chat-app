const { PrismaClient } = require("@prisma/client");
const express = require("express");

const audioRouter = express.Router();
const prisma = new PrismaClient();

audioRouter.post("/", async (req, res) => {
  console.log("I am called....");
  console.log("req body: ", req.body);
  try {
    const { audioData } = req.body;
    console.log("audioData: ", audioData);

    const newAudioChunks = await prisma.audio.create({
      data: {
        audioData,
      },
    });

    res.status(201).json(newAudioChunks);
  } catch (error) {
    console.log(error);
  }
});

module.exports = audioRouter;
