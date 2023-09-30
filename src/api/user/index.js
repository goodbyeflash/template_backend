import Router from "koa-router";
import * as userCtrl from "./user.ctrl";

const user = new Router();

user.get("/", userCtrl.list);
user.post("/read", userCtrl.read);
user.post("/", userCtrl.register);
user.patch("/:serialNum", userCtrl.update);
user.delete("/:serialNum", userCtrl.remove);

export default user;
