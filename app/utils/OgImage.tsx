import { writeFile, readFileSync } from "fs";
import { promisify } from "util";

import React from "react";
import satori from "satori";
import sharp from "sharp";

export const createOgpImage = async (
  id: string,
  title: string,
): Promise<void> => {
  const notoSansBold = readFileSync("assets/fonts/NotoSansJP-Bold.ttf");
  const robotoRegular = readFileSync("assets/fonts/Roboto-Regular.ttf");

  const svg = await satori(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        fontFamily: "Noto Sans JP",
      }}
    >
      <div
        style={{
          width: "800px",
          height: "500px",
          display: "flex",
          flexDirection: "column",
          margin: "20px",
          backgroundColor: "rgb(23, 23, 23)",
          borderRadius: "25",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "24px 32px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flex: "1",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#FF605C",
                borderRadius: "50%",
              }}
            ></div>
            <div
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#FFBD44",
                borderRadius: "50%",
              }}
            ></div>
            <div
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#00CA4E",
                borderRadius: "50%",
              }}
            ></div>
          </div>
          <div
            style={{
              backgroundColor: "#333",
              color: "#fff",
              padding: "8px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderRadius: "12px",
              fontSize: "18px",
              fontFamily: "Roboto",
              letterSpacing: "0.05rem",
            }}
          >
            hoshimurayuto.com
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              color: "#fff",
              flex: "1",
              justifyContent: "flex-end",
            }}
          >
            <img
              src="data:image/svg+xml;base64,PHN2ZwogICAgICAgICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICAgICAgICAgd2lkdGg9IjMyIgogICAgICAgICAgaGVpZ2h0PSIzMiIKICAgICAgICAgIHZpZXdCb3g9IjAgMCAzMiAzMiIKICAgICAgICA+CiAgICAgICAgICA8cGF0aAogICAgICAgICAgICBmaWxsPSJ3aGl0ZSIKICAgICAgICAgICAgZD0iTTIzIDIwYTUgNSAwIDAgMC0zLjg5IDEuODlsLTcuMzEtNC41N2E0LjQ2IDQuNDYgMCAwIDAgMC0yLjY0bDcuMzEtNC41N0E1IDUgMCAxIDAgMTggN2E0Ljc5IDQuNzkgMCAwIDAgLjIgMS4zMmwtNy4zMSA0LjU3YTUgNSAwIDEgMCAwIDYuMjJsNy4zMSA0LjU3QTQuNzkgNC43OSAwIDAgMCAxOCAyNWE1IDUgMCAxIDAgNS01Wm0wLTE2YTMgMyAwIDEgMS0zIDNhMyAzIDAgMCAxIDMtM1pNNyAxOWEzIDMgMCAxIDEgMy0zYTMgMyAwIDAgMS0zIDNabTE2IDlhMyAzIDAgMSAxIDMtM2EzIDMgMCAwIDEtMyAzWiIKICAgICAgICAgIC8+CiAgICAgICAgPC9zdmc+"
              alt=""
              style={{
                width: "28px",
                height: "28px",
              }}
            />
            <img
              src="data:image/svg+xml;base64,PHN2ZwogICAgICAgICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICAgICAgICAgd2lkdGg9IjMyIgogICAgICAgICAgaGVpZ2h0PSIzMiIKICAgICAgICAgIHZpZXdCb3g9IjAgMCAzMiAzMiIKICAgICAgICA+CiAgICAgICAgICA8cGF0aAogICAgICAgICAgICBmaWxsPSJ3aGl0ZSIKICAgICAgICAgICAgZD0iTTE3IDE1VjVoLTJ2MTBINXYyaDEwdjEwaDJWMTdoMTB2LTJIMTd6IgogICAgICAgICAgLz4KICAgICAgICA8L3N2Zz4="
              alt=""
              style={{
                width: "28px",
                height: "28px",
              }}
            />
            <img
              src="data:image/svg+xml;base64,PHN2ZwogICAgICAgICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICAgICAgICAgd2lkdGg9IjMyIgogICAgICAgICAgaGVpZ2h0PSIzMiIKICAgICAgICAgIHZpZXdCb3g9IjAgMCAzMiAzMiIKICAgICAgICA+CiAgICAgICAgICA8ZGVmcz4KICAgICAgICAgICAgPHBhdGgKICAgICAgICAgICAgICBpZD0iY2FyYm9uTmV3VGFiMCIKICAgICAgICAgICAgICBmaWxsPSJ3aGl0ZSIKICAgICAgICAgICAgICBkPSJNMjYgMjZINlY2aDEwVjRINmEyLjAwMiAyLjAwMiAwIDAgMC0yIDJ2MjBhMi4wMDIgMi4wMDIgMCAwIDAgMiAyaDIwYTIuMDAyIDIuMDAyIDAgMCAwIDItMlYxNmgtMloiCiAgICAgICAgICAgIC8+CiAgICAgICAgICA8L2RlZnM+CiAgICAgICAgICA8dXNlIGhyZWY9IiNjYXJib25OZXdUYWIwIiAvPgogICAgICAgICAgPHVzZSBocmVmPSIjY2FyYm9uTmV3VGFiMCIgLz4KICAgICAgICAgIDxwYXRoCiAgICAgICAgICAgIGZpbGw9IndoaXRlIgogICAgICAgICAgICBkPSJNMjYgNlYyaC0ydjRoLTR2Mmg0djRoMlY4aDRWNmgtNHoiCiAgICAgICAgICAvPgogICAgICAgIDwvc3ZnPg=="
              alt=""
              style={{
                width: "28px",
                height: "28px",
              }}
            />
          </div>
        </div>
        <div
          style={{
            color: "white",
            margin: "64px",
            fontSize: "32px",
            fontWeight: "bold",
            fontFamily: "Noto Sans JP",
            lineHeight: "1.75",
            flex: "1",
            letterSpacing: "0.05rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "64px",
          }}
        >
          <img
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
            }}
            src="https://avatars.githubusercontent.com/u/49551700?v=4"
          />
          <div
            style={{
              color: "white",
              fontSize: "24px",
              fontFamily: "Roboto",
              lineHeight: "1.75",
              letterSpacing: "0.05rem",
            }}
          >
            @HoshimuraYuto
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Roboto",
          data: robotoRegular,
          style: "normal",
        },
        {
          name: "Noto Sans JP",
          data: notoSansBold,
          style: "normal",
        },
      ],
    },
  );

  const writeFileAsync = promisify(writeFile);

  try {
    const webp = await sharp(Buffer.from(svg)).webp().toBuffer();
    await writeFileAsync(`public/ogp/${id}.webp`, webp);
  } catch (e) {
    console.error(e);
  }
};
