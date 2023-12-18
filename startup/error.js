const log = require("./logger");

module.exports = function () {
  // 遇到这两种类型的错误时，应该退出node程序
  // 打印错误，然后，一定要抛出该错误，这样才能让node程序退出！
  process.on('uncaughtException', e => {
    log.error(`uncaughtException:${e.message}`);
    throw e;
  });
  process.on('unhandledRejection', e => {
    log.error(`unhandledRejection:${e.message}`);
    throw e;
  })
}