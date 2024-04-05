import express from "express";
import main from "./getTeeTimes";
import fs from "fs";
import axios from "axios";
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = 8000;

interface Teetimes {
  time: string;
  price: string;
  players: string;
}

interface TeeData {
  day: string;
  url: string;
  teetimes: Teetimes[];
}

main([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
])
  .then(() => {
    app.get("/teetimes", (req, res) => {
      fs.readFile("teetimes.json", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          res.status(500).send("Error reading file");
          return;
        }
        const tees: TeeData[] = JSON.parse(data.toString());
        res.json(tees);
      });
    });

    app.get("/teetimes/:day", (req, res) => {
      const day = req.params.day;
      fs.readFile("teetimes.json", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          res.status(500).send("Error reading file");
          return;
        }
        const tees: TeeData[] = JSON.parse(data.toString());
        const filteredOdds = tees.filter((o) => o.day === day);
        res.json(filteredOdds);
      });
    });
  })
  .then(() => {
    getTimesForDay("Wednesday");
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const getTimesForDay = async (day: string) => {
  try {
    const response = await axios.get(`http://localhost:8000/teetimes/${day}`);
    console.log(`Teetimes for ${day}:`, response.data);
  } catch (error) {
    console.error(`Error fetching odds for ${day}:`, error);
  }
};
