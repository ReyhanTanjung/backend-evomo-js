/**
 * Date Formatter
 * @module utils
 * @description Date Formatter
 */
const moment = require('moment-timezone');

const formatDate = (date) => {
    if (!date) return null;
    return moment(date).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
  };
  
  module.exports = {
    formatDate
  };