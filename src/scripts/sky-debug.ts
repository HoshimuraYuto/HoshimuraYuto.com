import { parseMetar } from "../lib/weather/weather";
import type { Weather } from "../lib/weather/weather";

/** A weather to try on screen: real moments at Haneda load their own report; made-up reports stand for what Haneda has not seen. */
interface WeatherSample {
  label: string;
  /** `?at=` value, JST. */
  at: string;
  metar?: string;
}

/**
 * Real moments are from the IEM archive of RJTT (2016-01-01 to 2026-11-13, read 2026-11-13); the report the
 * page will load is quoted after each. Made-up reports cover weather Haneda did not report in that span.
 */
const WEATHER_SAMPLES: readonly WeatherSample[] = [
  // RJTT 190319Z 36013KT 9999 -SHRAGS FEW040 BKN050 09/M03 Q1014
  { label: "あられまじりの雨(実例)", at: "2020-12-19T12:20" },
  // RJTT 080426Z 02006KT 340V060 9999 -PL -RA BKN038 05/M02 Q1027
  { label: "凍雨(実例)", at: "2025-03-08T13:27" },
  // RJTT 270121Z 32039G50KT 9999 SQ FEW030 09/M06 Q1014
  // Wind itself is not drawn and nothing fell, so this sky is meant to be still.
  {
    label: "スコールと非常に強い風(実例・晴れなので画面は動かない)",
    at: "2024-02-27T10:22",
  },
  // RJTT 110634Z 35044G60KT 320V020 0200 … +TSRA SCT008 BKN020CB BKN025 23/23 Q1014
  { label: "強い雷雨と猛烈な突風(実例)", at: "2025-09-11T15:35" },
  // RJTT 170102Z 18030G42KT 9999 -SHRA BLDU FEW020 BKN030 BKN070 19/14 Q1008
  { label: "風で舞う砂じん(実例)", at: "2016-04-17T10:03" },
  // RJTT 121200Z 17067G85KT 1500 … SHRA BR FEW006 BKN007 BKN015 23/22 Q0967 (台風19号)
  { label: "台風の暴風(実例)", at: "2019-10-12T21:00" },
  // RJTT 231100Z 05012KT 9999 FU FEW030 BKN/// 19/14 Q1016
  { label: "煙(実例)", at: "2025-05-23T20:00" },
  // RJTT 072249Z 03004KT 0500 … FG
  { label: "霧(実例)", at: "2024-04-08T07:50" },
  {
    label: "ひょう(作例)",
    at: "2026-06-01T15:00",
    metar: "RJTT 010600Z 25012G28KT 5000 +TSGRRA FEW020CB BKN030 22/18 Q1004",
  },
  {
    label: "竜巻(作例)",
    at: "2026-06-01T15:00",
    metar: "RJTT 010600Z 22020G35KT 3000 +FC TSRA FEW015CB BKN020 24/21 Q0998",
  },
  {
    label: "砂じんあらし(作例)",
    at: "2026-04-01T14:00",
    metar: "RJTT 010500Z 20025G40KT 0800 +DS FEW030 25/05 Q1000",
  },
  {
    label: "火山灰(作例)",
    at: "2026-04-01T14:00",
    metar: "RJTT 010500Z 36005KT 4000 VA FEW030 15/05 Q1015",
  },
  {
    label: "着氷性の雨(作例)",
    at: "2026-01-20T10:00",
    metar: "RJTT 200100Z 01008KT 3000 FZRA OVC010 M01/M02 Q1010",
  },
  {
    label: "強い雪(作例)",
    at: "2026-01-20T10:00",
    metar: "RJTT 200100Z 36015KT 0500 +SN VV005 M01/M02 Q1008",
  },
];

function debugWeather(search: string, date: Date): Weather | undefined {
  const raw = new URLSearchParams(search).get("metar") ?? "",
    observation = raw === "" ? undefined : parseMetar(raw);
  return (
    observation && {
      ...observation,
      time: date,
      origin: {
        kind: "observation",
        provider: "debug",
        place: "作例",
        raw,
        url: "",
      },
    }
  );
}
function sampleHref(sample: WeatherSample): string {
  const params = new URLSearchParams({ at: sample.at });
  if (sample.metar !== undefined) {
    params.set("metar", sample.metar);
  }
  return `?${params.toString()}`;
}

export { debugWeather, sampleHref, WEATHER_SAMPLES };
