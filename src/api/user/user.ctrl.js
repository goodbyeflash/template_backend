import User from "../../models/user";
import Joi from "@hapi/joi";

/*
  GET /api/user?page=
*/
export const list = async (ctx) => {
  // query는 문자열이기 때문에 숫자로 변환해 주어야 합니다.
  // 값이 주어지지 않았다면 1을 기본으로 사용합니다.
  const page = parseInt(ctx.query.page || "1", 10);

  if (page < 1) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.find({})
      .sort({})
      .limit(10)
      .skip((page - 1) * 10)
      .exec();
    const userCount = await User.countDocuments({}).exec();
    ctx.set("Last-Page", Math.ceil(userCount / 10));
    ctx.body = user.map((user) => {
      return user;
    });
  } catch (error) {
    ctx.throw(500, error);
  }
};

/*
  POST /api/user/:serialNum
*/
export const read = async (ctx) => {
  const schema = Joi.object().keys({
    // 객체가 다음 필드를 가지고 있음을 검증
    serialNum: Joi.string().required(),
  });

  // 검증하고 나서 검증 실패인 경우 에러 처리
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }
  let { serialNum } = ctx.request.body;

  try {
    const user = await User.findOne({
      serialNum: serialNum,
    });

    if (!user) {
      ctx.status = 404;
      return;
    }

    ctx.body = user;
  } catch (error) {
    ctx.throw(500, error);
  }
};

/*
  POST /api/user
  {
    "name" : "유저1",
    "serialNum" : "A00001"
  }
 */
export const register = async (ctx) => {
  const schema = Joi.object().keys({
    // 객체가 다음 필드를 가지고 있음을 검증
    name: Joi.string().required(), // required()가 있으면 필수 항목
    serialNum: Joi.string().required(),
  });

  // 검증하고 나서 검증 실패인 경우 에러 처리
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }
  let { name, serialNum } = ctx.request.body;

  const exist = await User.findOne({
    serialNum: serialNum,
  });

  if (exist) {
    ctx.status = 409; // Confict
    return;
  }

  const user = new User({
    name,
    serialNum,
  });

  try {
    await user.save();
    ctx.status = 200; // Ok
  } catch (error) {
    ctx.throw(500, error);
  }
};

/*
  PATCH /api/user/:serialNum
  {
    "name" : "",
  }
*/
export const update = async (ctx) => {
  // write에서 사용한 schema와 비슷한데, required()가 없습니다.
  const schema = Joi.object().keys({
    // 객체가 다음 필드를 가지고 있음을 검증
    name: Joi.string(),
  });

  // 검증하고 나서 검증 실패인 경우 에러 처리
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }

  const { serialNum } = ctx.params;

  try {
    let nextData = { ...ctx.request.body }; // 객체를 복사하고 body 값이 주어졌으면 HTML 필터링
    const updateUser = await User.findOneAndUpdate(
      {
        serialNum: serialNum,
      },
      nextData,
      {
        new: true, // 이 값을 설정하면 업데이트된 데이터를 반환합니다.
        // false일 때는 업데이트되기 전의 데이터를 반환합니다.
      }
    ).exec();

    if (!updateUser) {
      ctx.status = 404;
      return;
    }

    // 똥 피하기 게임 업데이트
    const validatePoo = await Poo.findOneAndUpdate(
      {
        serialNum: serialNum,
      },
      nextData,
      {
        new: true,
      }
    ).exec();

    ctx.status = 200; // Ok
  } catch (error) {
    ctx.throw(500, error);
  }
};

/*
  DELETE /api/user/:serialNum
*/
export const remove = async (ctx) => {
  const { serialNum } = ctx.params;
  try {
    const removeUser = await User.findOneAndRemove({
      serialNum: serialNum,
    }).exec();

    const removePoo = await User.findOneAndRemove({
      serialNum: serialNum,
    }).exec();

    if (!removeUser) {
      ctx.status = 404; // Not Found
      return;
    }
    ctx.status = 200; // Ok
  } catch (error) {
    ctx.throw(500, error);
  }
};
