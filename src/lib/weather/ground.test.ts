import { describe, expect, test } from "vitest";

import snowDay from "./fixtures/iem-rjtt-2026-02-07.csv?raw";
import rainDay from "./fixtures/iem-rjtt-2026-10-24.csv?raw";
import { groundAt } from "./ground";
import type { TimedReport } from "./ground";

interface Part {
  weather?: string;
  temperature?: string;
  wind?: string;
}

function at(time: string): Date {
  return new Date(`2026-10-24T${time}:00Z`);
}
function report(time: string, part: Part = {}): TimedReport {
  return {
    time: at(time),
    raw: `RJTT 24${time.replace(":", "")}Z ${part.wind ?? "00000KT"} 9999 ${part.weather ?? ""} BKN030 ${part.temperature ?? "18/16"} Q1020`,
  };
}
function reportsIn(csv: string): TimedReport[] {
  return csv
    .split("\n")
    .filter((line) => line.startsWith("RJTT,"))
    .map((line) => {
      const [, valid = "", ...metar] = line.split(",");
      return {
        time: new Date(`${valid.replace(" ", "T")}:00Z`),
        raw: metar.join(","),
      };
    });
}
const COLD = "M01/M02";
function snowAfterHourAt(temperature: string): number {
  return groundAt(
    [report("00:00", { weather: "SN", temperature })],
    at("01:00"),
  ).snow;
}
const RAIN_DAY = reportsIn(rainDay);
const SNOW_DAY = reportsIn(snowDay);
function wetOnRainDayAt(time: string): number {
  return groundAt(RAIN_DAY, new Date(`2026-10-24T${time}:00Z`)).wet;
}
function snowOnSnowDayAt(time: string): number {
  return groundAt(SNOW_DAY, new Date(`2026-02-07T${time}:00Z`)).snow;
}
/** Two hours of snow in the cold: the ground is fully covered at 02:00. */
const SNOWED = [
  report("00:00", { weather: "SN", temperature: COLD }),
  report("01:00", { weather: "SN", temperature: COLD }),
];

describe("groundAt: 雨と乾き", () => {
  test("報がなければ、地面には何もない", () => {
    expect(groundAt([], at("04:00"))).toStrictEqual({ wet: 0, snow: 0 });
  });

  test("降っていなければ、地面には何もない", () => {
    expect(
      groundAt([report("00:00"), report("00:30")], at("01:00")),
    ).toStrictEqual({
      wet: 0,
      snow: 0,
    });
  });

  test("弱い雨が30分続くと、地面は4割濡れる", () => {
    const ground = groundAt([report("00:00", { weather: "-RA" })], at("00:30"));

    expect(ground.wet).toBeCloseTo(0.4);
    expect(ground.snow).toBe(0);
  });

  test.each([
    ["弱い雨", "-RA", 0.08],
    ["並の雨", "RA", 0.2],
    ["強い雨", "+RA", 0.5],
    ["弱い霧雨", "-DZ", 0.04],
  ])("%sは6分で、強さに応じた分だけ濡らす", (_label, weather, wet) => {
    expect(
      groundAt([report("00:00", { weather })], at("00:06")).wet,
    ).toBeCloseTo(wet);
  });

  test("降り続いても、濡れ方は1を超えない", () => {
    const reports = [
      report("00:00", { weather: "+RA" }),
      report("00:30", { weather: "+RA" }),
    ];

    expect(groundAt(reports, at("01:00")).wet).toBe(1);
  });

  test("雨が止むと、風のない空気の中で1時間に2割ずつ乾く", () => {
    const reports = [
      report("00:00", { weather: "RA" }),
      report("01:00"),
      report("02:00"),
    ];

    expect(groundAt(reports, at("01:00")).wet).toBe(1);
    expect(groundAt(reports, at("02:00")).wet).toBeCloseTo(0.8);
    expect(groundAt(reports, at("02:30")).wet).toBeCloseTo(0.7);
  });

  test("風があると、早く乾く", () => {
    const rain = report("00:00", { weather: "RA" }),
      calm = groundAt([rain, report("01:00")], at("02:00")),
      windy = groundAt(
        [rain, report("01:00", { wind: "09010MPS" })],
        at("02:00"),
      );

    expect(windy.wet).toBeCloseTo(0.6);
    expect(windy.wet).toBeLessThan(calm.wet);
  });

  test("乾ききった地面は、それ以上乾かない", () => {
    const reports = [
      report("00:00", { weather: "-RA" }),
      report("00:30"),
      report("01:30"),
      report("02:30"),
      report("03:30"),
    ];

    expect(groundAt(reports, at("04:00")).wet).toBe(0);
  });
});

describe("groundAt: 雪と融け", () => {
  test("冷えた中の雪は積もり、地面を濡らさない", () => {
    const reports = [
      report("00:00", { weather: "-SN", temperature: COLD }),
      report("01:00", { weather: "-SN", temperature: COLD }),
    ];

    expect(groundAt(reports, at("02:00"))).toStrictEqual({ wet: 0, snow: 0.5 });
  });

  test("暖かい中の雪は積もらず、地面を濡らす", () => {
    const ground = groundAt(
      [report("00:00", { weather: "-SN", temperature: "05/01" })],
      at("01:00"),
    );

    expect(ground.snow).toBe(0);
    expect(ground.wet).toBeCloseTo(0.8);
  });

  test("気温が積もる温度と融ける温度の間なら、雪の一部が積もる", () => {
    expect(snowAfterHourAt("03/01")).toBeGreaterThan(0);
    expect(snowAfterHourAt("03/01")).toBeLessThan(snowAfterHourAt("01/00"));
  });

  test("気温のない報の雪は、積もるものとして扱う", () => {
    const reports = [
      { time: at("00:00"), raw: "RJTT 240000Z 00000KT 9999 -SN BKN030" },
    ];

    expect(groundAt(reports, at("01:00")).snow).toBeCloseTo(0.25);
  });

  test("みぞれは、雪より積もらず、地面も濡らす", () => {
    const sleet = groundAt(
        [report("00:00", { weather: "-RASN", temperature: COLD })],
        at("01:00"),
      ),
      snow = groundAt(
        [report("00:00", { weather: "-SN", temperature: COLD })],
        at("01:00"),
      );

    expect(sleet.snow).toBeGreaterThan(0);
    expect(sleet.snow).toBeLessThan(snow.snow);
    expect(sleet.wet).toBeGreaterThan(0);
  });

  test("積もった雪は、雨に降られると減る", () => {
    const reports = [
        ...SNOWED,
        report("02:00", { weather: "RA", temperature: "02/01" }),
      ],
      ground = groundAt(reports, at("03:00"));

    expect(groundAt(reports, at("02:00")).snow).toBe(1);
    expect(ground.snow).toBeCloseTo(0.6);
    expect(ground.wet).toBe(1);
  });

  test("積もった雪は、暖かくなると融けて地面を濡らす", () => {
    // 7 °C is 5 °C above the temperature the thaw starts at: 0.4 of the cover in an hour.
    const ground = groundAt(
      [...SNOWED, report("02:00", { temperature: "07/01" })],
      at("03:00"),
    );

    expect(ground.snow).toBeCloseTo(0.6);
    expect(ground.wet).toBeCloseTo(0.4);
  });

  test("冷えたままなら、雪は止んだ後も残る", () => {
    const reports = [
      ...SNOWED,
      report("02:00", { temperature: COLD }),
      report("03:00", { temperature: COLD }),
    ];

    expect(groundAt(reports, at("04:00")).snow).toBe(1);
  });
});

describe("groundAt: 数える報", () => {
  test("6時間より前の報は数えない", () => {
    const reports = [report("00:00", { weather: "+RA" })];

    expect(groundAt(reports, at("06:00")).wet).toBe(1);
    expect(groundAt(reports, at("06:01")).wet).toBe(0);
  });

  test("指定した日時より後の報は数えない", () => {
    const reports = [report("00:00"), report("01:00", { weather: "+RA" })];

    expect(groundAt(reports, at("00:30"))).toStrictEqual({ wet: 0, snow: 0 });
  });

  test("次の報が来ない間は、1時間分だけ数える", () => {
    // Three hours of light rain would soak the ground; one hour of it wets it by 0.8.
    expect(
      groundAt([report("00:00", { weather: "-RA" })], at("03:00")).wet,
    ).toBeCloseTo(0.8);
  });

  test("読めない報は飛ばす", () => {
    const reports = [
      report("00:00", { weather: "-RA" }),
      { time: at("00:30"), raw: "RJTT 240030Z NIL" },
    ];

    expect(groundAt(reports, at("01:00")).wet).toBeCloseTo(0.4);
  });

  test("報の並び順によらず、同じ報と同じ日時なら同じ結果になる", () => {
    const reports = [
      report("00:00", { weather: "-RA" }),
      report("00:30", { weather: "RA" }),
      report("01:00"),
      report("02:00"),
    ];

    expect(groundAt(reports.toReversed(), at("02:30"))).toStrictEqual(
      groundAt(reports, at("02:30")),
    );
  });
});

describe("groundAt: 実際の報", () => {
  test("雨の日の実際の報では、降り続いた昼に地面が濡れきっている", () => {
    // 2026-10-24: light rain from 00:00Z, rain at 04:00Z.
    expect(groundAt(RAIN_DAY, new Date("2026-10-24T04:00:00Z"))).toStrictEqual({
      wet: 1,
      snow: 0,
    });
  });

  test("雨の日の実際の報では、止んだ後に地面が乾いていく", () => {
    // 2026-10-24: the last rain is reported at 12:30Z; none from 13:00Z to 15:00Z.
    expect(wetOnRainDayAt("13:00")).toBe(1);
    expect(wetOnRainDayAt("14:00")).toBeLessThan(wetOnRainDayAt("13:00"));
    expect(wetOnRainDayAt("15:00")).toBeLessThan(wetOnRainDayAt("14:00"));
    expect(wetOnRainDayAt("15:00")).toBeGreaterThan(0);
  });

  test("雪の日の実際の報では、降るにつれて雪が増える", () => {
    // 2026-02-07: light snow from 04:00Z to 07:30Z, at 4 °C falling to 1 °C.
    expect(snowOnSnowDayAt("03:30")).toBe(0);
    expect(snowOnSnowDayAt("05:30")).toBeGreaterThan(0);
    expect(snowOnSnowDayAt("07:00")).toBeGreaterThan(snowOnSnowDayAt("05:30"));
    expect(snowOnSnowDayAt("07:00")).toBeLessThan(1);
  });
});
