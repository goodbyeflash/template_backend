import Router from "koa-router";
import * as adminsCtrl from "./admin.ctrl";

const admin = new Router();

// Auth
admin.post("/register", adminsCtrl.register);
admin.post("/login", adminsCtrl.login);
admin.get("/check", adminsCtrl.check);
admin.post("/logout", adminsCtrl.logout);

export default admin;
