const config = require('config')

module.exports = function () {
  if (!config.get('db')) throw new Error('数据库地址未配置！')
}