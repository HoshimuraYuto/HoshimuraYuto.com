type CloudAmount = "few" | "scattered" | "broken" | "overcast";

interface CloudLayer {
  amount: CloudAmount;
  /** The amount as the range of oktas (eighths of the sky) it stands for, e.g. [5, 7] for broken. */
  oktas: readonly [number, number];
  /** Share of the sky this layer covers, 0 to 1, taken as the middle of the okta range. */
  cover: number;
  /** Height of the cloud base above the aerodrome, feet. `undefined` when the report leaves it out. */
  baseFeet: number | undefined;
  /** Cumulonimbus or towering cumulus, the only cloud types a METAR names. */
  convective: boolean;
}

/** Ice that falls as hard grains: hail (GR), graupel or small hail (GS), ice pellets (PL). */
type IceKind = "hail" | "graupel" | "icePellets";
type PrecipitationKind = "drizzle" | "rain" | "snow" | "sleet" | IceKind;
type Intensity = "light" | "moderate" | "heavy";

interface Precipitation {
  kind: PrecipitationKind;
  intensity: Intensity;
  /** Ice grains mixed into rain or snow, e.g. SHRAGS. */
  ice?: IceKind;
  /** Rain or drizzle that freezes where it lands (FZ). */
  freezing?: boolean;
}

/** Haze is HZ; smoke FU; volcanic ash VA; dust and sand DU, SA. */
type Obscuration = "mist" | "fog" | "haze" | "smoke" | "ash" | "dust";

/** Weather a METAR names besides what falls and what hides the view: squall (SQ), funnel cloud or tornado (FC), dust or sand storm (DS, SS), dust whirls (PO), and dust or sand raised by the wind (BL, DR). */
type Phenomenon =
  | "squall"
  | "funnel"
  | "duststorm"
  | "dustWhirl"
  | "blowingDust";

interface Wind {
  /** Direction the wind blows from, degrees from north, clockwise. `undefined` when variable. */
  direction: number | undefined;
  /** Metres per second. */
  speed: number;
  /** Strongest gust, metres per second. */
  gust?: number;
}

interface WeatherOrigin {
  /** `observation` is what was seen at that moment; `forecast` is what was expected for the period. */
  kind: "observation" | "forecast";
  /** Who published it, as a stable id: `iem-metar` or `jma-forecast`. */
  provider: string;
  /** Station or area the data is for, e.g. `RJTT` or `130010`. */
  place: string;
  /** The untouched text this weather was read from: the METAR, or the forecast's weather code. */
  raw: string;
  url: string;
}

/** What the weather of the last hours has left on the ground, each 0 (none) to 1 (as much as is drawn). */
interface Ground {
  /** Water lying on the ground: it gathers while rain falls and dries off afterwards. */
  wet: number;
  /** Snow lying on the ground: it gathers while snow falls in the cold, and melts in rain and warmth. */
  snow: number;
}

interface Weather {
  /** Moment the observation was made, or the forecast was issued. */
  time: Date;
  /** Share of the sky covered by cloud, 0 to 1. */
  cloudCover: number;
  /** Cloud layers, lowest first. Empty when the source gives only a total. */
  layers: CloudLayer[];
  precipitation: Precipitation | undefined;
  thunder: boolean;
  obscuration: Obscuration | undefined;
  /** Horizontal visibility, metres, capped at 10 000. `undefined` when the source does not give it. */
  visibility: number | undefined;
  wind: Wind | undefined;
  phenomena?: Phenomenon[];
  /** Left out by a source that knows only the moment and not the hours before it. */
  ground?: Ground;
  origin: WeatherOrigin;
}

interface WeatherContext {
  fetch: typeof fetch;
  signal: AbortSignal;
  now: Date;
}

interface WeatherSource {
  weatherAt: (
    date: Date,
    context: WeatherContext,
  ) => Promise<Weather | undefined>;
}

export type {
  CloudAmount,
  CloudLayer,
  Ground,
  IceKind,
  Intensity,
  Obscuration,
  Phenomenon,
  Precipitation,
  PrecipitationKind,
  Weather,
  WeatherContext,
  WeatherOrigin,
  WeatherSource,
  Wind,
};
