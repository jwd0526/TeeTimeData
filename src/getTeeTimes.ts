import puppeteer from "puppeteer";
import fs from "fs";

const main = async (days: string[]) => {
  function getNextSevenDates(): string[] {
    const today: Date = new Date();
    const nextSevenDates: string[] = [];
    let currentDate: Date = new Date(today);
    nextSevenDates.push(formatDate(currentDate));
    for (let i = 1; i <= 7; i++) {
      const nextDate: Date = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + i);
      nextSevenDates.push(formatDate(nextDate));
    }
    return nextSevenDates;
  }

  function formatDate(date: Date): string {
    const year: number = date.getFullYear();
    const month: number = date.getMonth() + 1;
    const day: number = date.getDate();
    return `${year}-${month}-${day}`;
  }

  function getDayOfWeek(date: Date): string {
    const daysOfWeek: string[] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayIndex: number = date.getDay();
    return daysOfWeek[dayIndex];
  }

  const getWebsiteURLs = (days: string[]): string[] => {
    const dates = getNextSevenDates();
    const validDates: string[] = [];
    for (let i = 0; i < dates.length; i++) {
      if (days.includes(getDayOfWeek(new Date(dates[i])))) {
        validDates.push(dates[i]);
      }
    }
    const websiteURLs: string[] = [];
    validDates.forEach((date: string) => {
      websiteURLs.push(
        `https://secure.east.prophetservices.com/DoubleOaksv3/(S(jywtj1thom12odqf0c1tmy5j))/Home/nIndex?CourseId=3&Date=${date}&Time=AnyTime&Player=4&Hole=Any`
      );
    });
    return websiteURLs;
  };

  const extractData = (inputString: string): string[] => {
    if (!inputString) {
      console.error("Input string is empty or undefined.");
      return ["", ""];
    }
    const idx = inputString.indexOf("$");
    const time = inputString.slice(0, idx);
    const price = inputString.slice(idx, inputString.length);
    return [time, price, "4 Players"];
  };

  const formatData = (
    content: string[][],
    index: number,
    days: string[]
  ): string => {
    let formattedDataString = "";
    for (let i = 0; i < content.length; i++) {
      if (i === 0) {
        formattedDataString += `{
          "day": "${days[index]}",
          "url": "${content[i][0]}",
          "teetimes": [`;
      } else {
        formattedDataString += `    {
              "time": "${content[i][0]}",
              "price": "${content[i][1]}",
              "players": "${content[i][2]}"
            }${i === content.length - 1 ? "" : ","}`;
      }
    }
    formattedDataString += `
          ]
        }`;
    return formattedDataString;
  };

  const jsonObjects: JSON[] = [];
  const browser = await puppeteer.launch({
    headless: true,
  });
  const urls = getWebsiteURLs(days);
  for (let index = 0; index < urls.length; index++) {
    const url = urls[index];
    const website = await browser.newPage();
    await website.setViewport({ width: 1920, height: 1080 });
    const websiteURL = url;
    await website.goto(websiteURL);

    const teetimeData = async (): Promise<string[]> => {
      return await website.evaluate(() => {
        const data: string[] = [];
        Array.from(document.getElementsByClassName("divBoxText")).forEach(
          (element) => {
            if (element.textContent) {
              const trimmedEl = element.textContent.replace(/\s/g, "");
              if (trimmedEl.includes("C")) {
                data.push(trimmedEl.slice(0, trimmedEl.indexOf("C")));
              }
            }
          }
        );
        return data.length > 0 ? data : ["No data found."];
      });
    };
    await teetimeData()
      .then((data: string[]): string[][] => {
        const teetimeContent: string[][] = [];
        teetimeContent.push([url]);
        data.forEach((element: string) => {
          teetimeContent.push(extractData(element));
        });
        return teetimeContent;
      })
      .then((content: string[][]) => {
        jsonObjects.push(JSON.parse(formatData(content, index, days)));
      });
  }
  fs.writeFileSync("teetimes.json", JSON.stringify(jsonObjects, null, 2));
  await browser.close();
};
export default main;
