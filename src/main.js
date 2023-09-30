require("dotenv").config();
import fs from "fs";
import path from "path";
import https from "https";
import serve from "koa-static";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import mongoose from "mongoose";
import api from "./api";
import jwtMiddleware from "./lib/jwtMiddleware";

// 비구조화 할당을 통해 process.env 내부 값에 대한 레퍼런스 만들기
const { PORT, MONGO_URI, NODE_ENV } = process.env;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((e) => {
    console.error(e);
  });

const app = new Koa();
const router = new Router();

app.use(serve("../frontend/build"));

// 라우터 설정
router.use("/api", api.routes()); // api 라우트 적용

app.use(async (ctx, next) => {
  const corsWhitelist = ["http://localhost:8080"];
  console.log(`[REFERER] => ${ctx.request.header.referer}`);
  console.log(ctx.request);
  if (NODE_ENV == "development") {
    if (!ctx.request.header.referer) {
      ctx.request.header.referer = corsWhitelist[0];
    }
  }

  if (!ctx.request.header.referer) {
    return;
  }

  const allowDomain = corsWhitelist.find((item) => {
    if (ctx.request.header.referer.indexOf(item) > -1) return true;
  });

  if (allowDomain) {
    ctx.set("Access-Control-Allow-Origin", allowDomain);
    ctx.set(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Set-Cookie, Last-Page, x-api-key"
    );
    ctx.set("Access-Control-Allow-Methods", "POST, GET, DELETE, PATCH");
    ctx.set("Access-Control-Allow-Credentials", true);
    ctx.set("Access-Control-Expose-Headers", "Last-Page");
    await next();
  }
});

// 라우터 적용 전에 bodyParser 적용
app.use(bodyParser());
app.use(jwtMiddleware);

// app 인스턴스에 라우터 적용
app.use(router.routes()).use(router.allowedMethods());

// // PORT가 지정되어 있지 않다면 81을 사용
const port = PORT || 81;
if (NODE_ENV == "production") {
  const config = {
    domain: "plithus.net",
    https: {
      port: port,
      options: {
        key: fs
          .readFileSync(path.resolve(process.cwd(), ""), "utf8")
          .toString(),
        cert: fs
          .readFileSync(path.resolve(process.cwd(), ""), "utf8")
          .toString(),
        ca: fs.readFileSync(path.resolve(process.cwd(), ""), "utf8").toString(),
      },
    },
  };
  // Https 적용
  let serverCallback = app.callback();
  try {
    const httpsServer = https.createServer(
      config.https.options,
      serverCallback
    );

    httpsServer.listen(config.https.port, (err) => {
      if (err) {
        console.error("HTTPS server FAIL: ", err, err && err.stack);
      } else {
        console.log(
          `HTTPS server OK: https://${config.domain}:${config.https.port}`
        );
      }
    });
  } catch (ex) {
    console.error("Failed to start HTTPS server\n", ex, ex && ex.stack);
  }
} else {
  app.listen(port, () => {
    console.log("📋 Listening to port %d", port);
  });
}
