const express = require("express");
var request = require("request");
router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log(req.body.prompt);
    if (!req.body.prompt) {
      return res.status(400).send("Error! Check prompt!");
    }
    console.log("phase 1");
    const openaiOptions = {
      uri: "https://api.openai.com/v1/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      method: "post",
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `${req.body.prompt}`,
        max_tokens: 4000,
        temperature: 0,
      }),
    };

    request(openaiOptions, function (error, openaiResponse) {
      console.log(error, openaiResponse.body);
      if (error) {
        res.status(400).send(openaiResponse.body);
      } else {
        res.status(200).send(openaiResponse.body);
      }
      return;
    });
  } catch (error) {
    return res.status(500).send("Error! Something broke :S");
  }
});

module.exports = router;
