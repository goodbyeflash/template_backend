import Router from "koa-router";
import admin from "./admin";
import user from "./user";

const api = new Router();

api.use("/admin", admin.routes());
api.use("/user", user.routes());

// 라우터를 내보냅니다.
export default api;
