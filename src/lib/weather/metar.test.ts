import { describe, expect, test } from "vitest";

import clear from "./fixtures/iem-rjtt-2026-01-01.csv?raw";
import snow from "./fixtures/iem-rjtt-2026-02-07.csv?raw";
import thunder from "./fixtures/iem-rjtt-2026-06-12.csv?raw";
import rain from "./fixtures/iem-rjtt-2026-10-24.csv?raw";
import special from "./fixtures/iem-rjtt-special.csv?raw";
import { reportAt } from "./fixtures/report.test-helper";
import { metarTemperature, parseMetar } from "./metar";

/** 1 kt = 1852 m / 3600 s. */
const KNOT = 1852 / 3600;

describe("parseMetar の特殊な天気(羽田の実際の報)", () => {
  test("雨にまじるあられを、雨の中の氷として読む", () => {
    // RJTT 190319Z 36013KT 9999 -SHRAGS FEW040 BKN050 09/M03 Q1014
    expect(
      parseMetar(reportAt(special, "2020-12-19 03:19"))?.precipitation,
    ).toStrictEqual({
      kind: "rain",
      intensity: "light",
      ice: "graupel",
    });
  });

  test("凍雨と雨が別の群で並ぶ報は、先に書かれた凍雨を採る", () => {
    // RJTT 080426Z 02006KT 340V060 9999 -PL -RA BKN038 05/M02 Q1027
    expect(
      parseMetar(reportAt(special, "2025-03-08 04:26"))?.precipitation,
    ).toStrictEqual({
      kind: "icePellets",
      intensity: "light",
    });
  });

  test("突風を読む", () => {
    // RJTT 121200Z 17067G85KT 1500 … (台風19号)
    expect(
      parseMetar(reportAt(special, "2019-10-12 12:00"))?.wind,
    ).toStrictEqual({
      direction: 170,
      speed: 67 * KNOT,
      gust: 85 * KNOT,
    });
  });

  test("スコールを読む", () => {
    // RJTT 270121Z 32039G50KT 9999 SQ FEW030 09/M06 Q1014
    expect(
      parseMetar(reportAt(special, "2024-02-27 01:21"))?.phenomena,
    ).toStrictEqual(["squall"]);
  });

  test("風で舞い上がる砂じんを、砂じんの空気と風の現象として読む", () => {
    // RJTT 170102Z 18030G42KT 9999 -SHRA BLDU FEW020 BKN030 BKN070 19/14 Q1008
    const observation = parseMetar(reportAt(special, "2016-04-17 01:02"));

    expect(observation?.obscuration).toBe("dust");
    expect(observation?.phenomena).toStrictEqual(["blowingDust"]);
  });

  test("煙を、煙霧と分けて読む", () => {
    // RJTT 231100Z 05012KT 9999 FU FEW030 BKN/// 19/14 Q1016
    expect(parseMetar(reportAt(special, "2025-05-23 11:00"))?.obscuration).toBe(
      "smoke",
    );
  });
});

describe("parseMetar の特殊な天気(作例の報)", () => {
  test.each([
    [
      "ひょう",
      "RJTT 010600Z 25012G28KT 5000 +TSGRRA FEW020CB BKN030 22/18 Q1004",
      { kind: "hail", intensity: "heavy", ice: undefined },
    ],
    // GS is written first, so it is the dominant type (WMO-No. 306, FM 15, 15.8.5); there is no rain, so it is not sleet.
    [
      "雪より多いあられ",
      "RJTT 082000Z 36013KT 9999 -SHGSSN FEW018 BKN025 02/M05 Q1019",
      { kind: "graupel", intensity: "light", ice: undefined },
    ],
    [
      "雪と雨にまじるあられ",
      "RJTT 291530Z 35022KT 9999 -SHSNRAGS FEW015 SCT030 BKN050 06/M02 Q1006",
      { kind: "sleet", intensity: "light", ice: "graupel" },
    ],
  ] as const)("%sを読む", (_label, raw, expected) => {
    const precipitation = parseMetar(raw)?.precipitation;

    expect(precipitation?.kind).toBe(expected.kind);
    expect(precipitation?.intensity).toBe(expected.intensity);
    expect(precipitation?.ice).toBe(expected.ice);
  });

  test("着氷性の雨に印を付ける", () => {
    expect(
      parseMetar("RJTT 200100Z 01008KT 3000 FZRA OVC010 M01/M02 Q1010")
        ?.precipitation,
    ).toStrictEqual({ kind: "rain", intensity: "moderate", freezing: true });
  });

  test.each([
    [
      "竜巻",
      "RJTT 010600Z 22020G35KT 3000 +FC TSRA FEW015CB BKN020 24/21 Q0998",
      ["funnel"],
    ],
    [
      "砂じんあらし",
      "RJTT 010500Z 20025G40KT 0800 +DS FEW030 25/05 Q1000",
      ["duststorm"],
    ],
    [
      "塵旋風",
      "RJTT 010500Z 20010KT 9999 PO FEW030 25/05 Q1010",
      ["dustWhirl"],
    ],
  ])("%sを現象として読む", (_label, raw, phenomena) => {
    expect(parseMetar(raw)?.phenomena).toStrictEqual(phenomena);
  });

  test("火山灰を読む", () => {
    expect(
      parseMetar("RJTT 010500Z 36005KT 4000 VA FEW030 15/05 Q1015")
        ?.obscuration,
    ).toBe("ash");
  });
});

describe(parseMetar, () => {
  test("雨ともやの報から、風・視程・天気・雲の層を読む", () => {
    // RJTT 240400Z 34004KT 4000 RA BR FEW010 BKN030 18/16 Q1022 TEMPO FEW005 BKN008
    const observation = parseMetar(reportAt(rain, "2026-10-24 04:00"));

    expect(observation).toStrictEqual({
      cloudCover: 6 / 8,
      layers: [
        {
          amount: "few",
          oktas: [1, 2],
          cover: 1.5 / 8,
          baseFeet: 1000,
          convective: false,
        },
        {
          amount: "broken",
          oktas: [5, 7],
          cover: 6 / 8,
          baseFeet: 3000,
          convective: false,
        },
      ],
      precipitation: { kind: "rain", intensity: "moderate" },
      thunder: false,
      obscuration: "mist",
      visibility: 4000,
      wind: { direction: 340, speed: 4 * KNOT },
    });
  });

  test("TEMPO以降の傾向予報は、観測として読まない", () => {
    // RJTT 120400Z 18006KT 140V220 9999 FEW025 FEW030CB SCT/// 26/16 Q1010 TEMPO FM0500 3000 TSRA BR
    const observation = parseMetar(reportAt(thunder, "2026-06-12 04:00"));

    expect(observation?.thunder).toBe(false);
    expect(observation?.precipitation).toBeUndefined();
    expect(observation?.obscuration).toBeUndefined();
    expect(observation?.visibility).toBe(10_000);
  });

  test("積乱雲の層と、高さの欠けた層を読む", () => {
    const observation = parseMetar(reportAt(thunder, "2026-06-12 04:00"));

    expect(observation?.layers).toStrictEqual([
      {
        amount: "few",
        oktas: [1, 2],
        cover: 1.5 / 8,
        baseFeet: 2500,
        convective: false,
      },
      {
        amount: "few",
        oktas: [1, 2],
        cover: 1.5 / 8,
        baseFeet: 3000,
        convective: true,
      },
      {
        amount: "scattered",
        oktas: [3, 4],
        cover: 3.5 / 8,
        baseFeet: undefined,
        convective: false,
      },
    ]);
  });

  test("雷を伴う弱い雨を読む", () => {
    // RJTT 120500Z 19006KT 170V230 9999 -TSRA FEW020 FEW030CB SCT040 BKN090 24/18 Q1011 TEMPO 3000 TSRA BR BECMG TL0530 30012KT
    const observation = parseMetar(reportAt(thunder, "2026-06-12 05:00"));

    expect(observation?.thunder).toBe(true);
    expect(observation?.precipitation).toStrictEqual({
      kind: "rain",
      intensity: "light",
    });
    expect(observation?.cloudCover).toBe(6 / 8);
  });

  test("弱い雪を読み、RMK以降は読まない", () => {
    // RJTT 070500Z 02006KT 3000 -SN FEW012 BKN020 BKN030 02/M00 Q1011 NOSIG RMK 1CU012 5SC020 7SC030 A2985
    const observation = parseMetar(reportAt(snow, "2026-02-07 05:00"));

    expect(observation?.precipitation).toStrictEqual({
      kind: "snow",
      intensity: "light",
    });
    expect(observation?.layers.map((layer) => layer.baseFeet)).toStrictEqual([
      1200, 2000, 3000,
    ]);
    expect(observation?.visibility).toBe(3000);
  });

  test("雨と雪が混じる報はみぞれにする", () => {
    // RJTT 070000Z 36018KT 9999 -RASN BKN045 05/M04 Q1013 NOSIG RMK 7SC045 A2993
    const observation = parseMetar(reportAt(snow, "2026-02-07 00:00"));

    expect(observation?.precipitation).toStrictEqual({
      kind: "sleet",
      intensity: "light",
    });
  });

  test("CAVOKは雲なし・視程10km以上にする", () => {
    // RJTT 010800Z 12002KT CAVOK 07/M03 Q1010 BECMG 03006KT RMK A2982
    const observation = parseMetar(reportAt(clear, "2026-01-01 08:00"));

    expect(observation?.cloudCover).toBe(0);
    expect(observation?.layers).toStrictEqual([]);
    expect(observation?.visibility).toBe(10_000);
    expect(observation?.precipitation).toBeUndefined();
  });

  test.each([
    [
      "強い雷雨",
      "RJTT 201900Z 17014KT 1500 +TSRA BR FEW002 BKN004 SCT020CB 23/23 Q1004",
      "heavy",
    ],
    [
      "並の雨",
      "RJTT 240400Z 34004KT 4000 RA BR FEW010 BKN030 18/16 Q1022",
      "moderate",
    ],
    [
      "弱い霧雨",
      "RJTT 241530Z 28004KT 3500 -DZ BR FEW003 SCT005 BKN006 18/17 Q1018",
      "light",
    ],
  ])("%sの強さを符号から読む", (_label, raw, intensity) => {
    expect(parseMetar(raw)?.precipitation?.intensity).toBe(intensity);
  });

  test.each([
    ["霧", "RJTT 010000Z 00000KT 0400 FG VV002 10/10 Q1015", "fog"],
    [
      "部分的な霧はもや",
      "RJTT 142230Z 18007KT 8000 PRFG BR FEW001 SCT015 29/25 Q1005",
      "mist",
    ],
    ["煙霧", "RJTT 010000Z 00000KT 5000 HZ FEW030 30/20 Q1010", "haze"],
  ])("%sを視程障害として読む", (_label, raw, obscuration) => {
    expect(parseMetar(raw)?.obscuration).toBe(obscuration);
  });

  test("空が見えない報(鉛直視程)は全天の雲にする", () => {
    const observation = parseMetar(
      "RJTT 010000Z 00000KT 0400 FG VV002 10/10 Q1015",
    );

    expect(observation?.cloudCover).toBe(1);
    expect(observation?.layers).toStrictEqual([
      {
        amount: "overcast",
        oktas: [8, 8],
        cover: 1,
        baseFeet: 200,
        convective: false,
      },
    ]);
  });

  test("付近(VC)の現象は、その場の天気にしない", () => {
    const observation = parseMetar(
      "RJTT 010000Z 20010KT 9999 VCSH FEW030 20/10 Q1010",
    );

    expect(observation?.precipitation).toBeUndefined();
  });

  test("風向が定まらない風と、無風を読む", () => {
    expect(
      parseMetar("RJTT 070600Z VRB02KT 2500 -SN FEW006 01/00 Q1011")?.wind,
    ).toStrictEqual({
      direction: undefined,
      speed: 2 * KNOT,
    });
    expect(
      parseMetar("RJTT 010000Z 00000KT 9999 FEW030 10/05 Q1015")?.wind?.speed,
    ).toBe(0);
  });

  test.each([
    ["空文字", ""],
    ["METARでない文", "Invalid times provided."],
    ["雲も視程もない報", "RJTT 010000Z 00000KT 10/05 Q1015"],
  ])("%sは何も返さない", (_label, raw) => {
    expect(parseMetar(raw)).toBeUndefined();
  });
});

describe(metarTemperature, () => {
  test.each([
    [
      "零度より上",
      "RJTT 240400Z 34004KT 4000 RA BR FEW010 BKN030 18/16 Q1022",
      18,
    ],
    [
      "露点だけが零度より下",
      "RJTT 070500Z 02006KT 3000 -SN FEW012 BKN020 02/M00 Q1011",
      2,
    ],
    [
      "零度より下",
      "RJTT 072200Z 01016KT 2500 -SHSN FEW002 SCT005 BKN008 M01/M01 Q1006",
      -1,
    ],
    ["露点のない報", "RJTT 010000Z 00000KT 9999 FEW030 10/// Q1015", 10],
  ])("%sの気温を読む", (_label, raw, temperature) => {
    expect(metarTemperature(raw)).toBe(temperature);
  });

  test("M00(0 °Cをわずかに下回る)は0にする", () => {
    expect(
      metarTemperature(
        "RJTT 072000Z 02016KT 3500 -SHSN FEW007 BKN010 M00/M01 Q1006",
      ),
    ).toBe(0);
  });

  test("気温のない報は何も返さない", () => {
    expect(
      metarTemperature("RJTT 010000Z 00000KT 9999 FEW030 Q1015"),
    ).toBeUndefined();
  });

  test("滑走路視距離を気温と読み違えない", () => {
    expect(
      metarTemperature(
        "RJTT 072130Z 01014KT 0500 R34L/1000V1900D R22/2000N SHSN VV002 Q1007",
      ),
    ).toBeUndefined();
  });
});
