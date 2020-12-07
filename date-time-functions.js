import Vue from 'vue';
import {TIME_TYPE} from '@/constants/common/data-type.js';
Vue.mixin({
  methods: {
    // This function is used to get current local time following format: WeekDay MM dd YYYY HH:mm:ss
    // For example: Thu Oct 22 2020 11:42:07
    getCurrentTime() {
      const now = new Date();

      // Use en-US format to get date by format: WeekDay, MM dd, YYYY
      const currentDate = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });

      // Use en-GB format to get time in 24h format
      const currentTime = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return currentDate.replace(/,/g, '') + ' ' + currentTime;
    },

    // This function is used to get current local time following format: yyyy-MM-dd HH:mm:ss
    // For example: 2020-10-22 11:40:50
    getCurrentTimeWithFormat() {
      const date = new Date();
      const hours =
        date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      const minutes =
        date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      const seconds =
        date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
      const months =
        date.getMonth() + 1 < 10
          ? '0' + (date.getMonth() + 1)
          : date.getMonth() + 1;
      const days = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();

      return (
        date.getFullYear() +
        '-' +
        months +
        '-' +
        days +
        ' ' +
        hours +
        ':' +
        minutes +
        ':' +
        seconds
      );
    },
    // This function is used to get current local time for using in export function following format: yyyyMMdd-HHmmss
    // For example: 20201022-114050
    getCurrentTimeWithExportFormat() {
      const date = new Date();
      const hours =
        date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      const minutes =
        date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      const seconds =
        date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
      const months =
        date.getMonth() + 1 < 10
          ? '0' + (date.getMonth() + 1)
          : date.getMonth() + 1;
      const days = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      return (
        date.getFullYear() +
        '' +
        months +
        '' +
        days +
        '-' +
        hours +
        '' +
        minutes +
        '' +
        seconds
      );
    },
    // Get time format for X axis in chart
    formatTimeXAxis(startTime, endTime) {
      startTime = new Date(startTime);
      endTime = new Date(endTime);
      const diffTime = Math.abs(startTime.getTime() - endTime.getTime());
      let timeFormat = '';
      // If different time less than or equal 1 minutes return %Y-%m-%d %H:%M:%S.%L
      // Example: 2020-11-06 15:28:36.200
      if (diffTime <= 60000) {
        timeFormat = '%Y-%m-%d %H:%M:%S.%L';
      }
      // If different time more than 1 minutes and less than or equal to 1 hours return %Y-%m-%d %H:%M:%S
      // Example: 2020-11-06 15:28:36
      else if (diffTime > 60000 && diffTime <= 3600000) {
        timeFormat = '%Y-%m-%d %H:%M:%S';
      }
      // If different time more than 1 hours and less than or equal to 7 day return %Y-%m-%d %H:%M
      // Example: 2020-11-06 15:28
      else if (diffTime > 3600000 && diffTime <= 604800000) {
        timeFormat = '%Y-%m-%d %H:%M';
      }
      // Other case return %Y-%m
      // Example: 2020-11
      else {
        timeFormat = '%Y-%m-%d';
      }
      return timeFormat;
    },

    /**
     * This function is used to convert local time to the time before a few seconds or a few minutes or a few hours or
     * a few days or a few weeks or a few months or a few years following format: yyyy-MM-dd HH:mm:ss.
     *
     * Rules:
     * +> 1 month = 30 days
     * +> 1 year = 365 days
     *
     * @param {Date} date Date used to convert
     * @param {string} timeType The time type is used to minus (seconds, minutes, hour, week, month, year)
     * @param {number} numberTime The number time will be deducted
     */

    minusDateTimeWithFormat(date, timeType, numberTime) {
      const newDate = new Date(date);
      switch (timeType) {
        case TIME_TYPE.SECONDS:
          newDate.setSeconds(newDate.getSeconds() - numberTime);
          break;
        case TIME_TYPE.MINUTES:
          newDate.setMinutes(newDate.getMinutes() - numberTime);
          break;
        case TIME_TYPE.HOUR:
          newDate.setHours(newDate.getHours() - numberTime);
          break;
        case TIME_TYPE.DAY:
          newDate.setDate(newDate.getDate() - numberTime);
          break;
        case TIME_TYPE.WEEK:
          newDate.setDate(newDate.getDate() - numberTime * 7);
          break;
        case TIME_TYPE.MONTH:
          newDate.setDate(newDate.getDate() - numberTime * 30);
          break;
        case TIME_TYPE.YEAR:
          newDate.setDate(newDate.getDate() - numberTime * 365);
          break;
        default:
          return;
      }
      return this.convertTimeWithFormat(newDate).replace(/\.\d+/, '');
    },

    /**
     * This function is used to convert local time to the time after a few seconds or a few minutes or a few hours or
     * a few days or a few weeks or a few months or a few years following format: yyyy-MM-dd HH:mm:ss.
     *
     * Rules:
     * +> 1 month = 30 days
     * +> 1 year = 365 days
     *
     * @param {Date} date Date used to convert
     * @param {string} timeType The time type is used to minus (seconds, minutes, hour, week, month, year)
     * @param {number} numberTime The number time will be deducted
     */

    plusDateTimeWithFormat(date, timeType, numberTime) {
      const newDate = new Date(date);
      switch (timeType) {
        case TIME_TYPE.SECONDS:
          newDate.setSeconds(newDate.getSeconds() + numberTime);
          break;
        case TIME_TYPE.MINUTES:
          newDate.setMinutes(newDate.getMinutes() + numberTime);
          break;
        case TIME_TYPE.HOUR:
          newDate.setHours(newDate.getHours() + numberTime);
          break;
        case TIME_TYPE.DAY:
          newDate.setDate(newDate.getDate() + numberTime);
          break;
        case TIME_TYPE.WEEK:
          newDate.setDate(newDate.getDate() + numberTime * 7);
          break;
        case TIME_TYPE.MONTH:
          newDate.setDate(newDate.getDate() + numberTime * 30);
          break;
        case TIME_TYPE.YEAR:
          newDate.setDate(newDate.getDate() + numberTime * 365);
          break;
        default:
          return;
      }
      return this.convertTimeWithFormat(newDate).replace(/\.\d+/, '');
    },
    // This function is used to convert server-side time into local time following format: yyyy-MM-dd HH:mm:ss.SSS
    // For example:
    // +> Time on server-side: 2020-10-20T11:35:21.377+0000
    // convert to
    // +> Time on client-side: 2020-10-20 18:35:21.377
    convertTimeWithFormat(date) {
      const newDate = new Date(date);
      const hours =
        newDate.getHours() < 10 ? '0' + newDate.getHours() : newDate.getHours();
      const minutes =
        newDate.getMinutes() < 10
          ? '0' + newDate.getMinutes()
          : newDate.getMinutes();
      const seconds =
        newDate.getSeconds() < 10
          ? '0' + newDate.getSeconds()
          : newDate.getSeconds();
      const miliseconds =
        newDate.getMilliseconds() < 10
          ? '0' + newDate.getMilliseconds()
          : newDate.getMilliseconds();
      const months =
        newDate.getMonth() + 1 < 10
          ? '0' + (newDate.getMonth() + 1)
          : newDate.getMonth() + 1;
      const days =
        newDate.getDate() < 10 ? '0' + newDate.getDate() : newDate.getDate();

      return (
        newDate.getFullYear() +
        '-' +
        months +
        '-' +
        days +
        ' ' +
        hours +
        ':' +
        minutes +
        ':' +
        seconds +
        '.' +
        miliseconds
      );
    },

    // This function is used to get current timezone on the client-side
    // For example:
    // +> The current local time zone is Japan (GMT +9), the output will be "+0900"
    // +> The current local time zone is VietNam (GMT +7), the ouput will be "+0700"
    getCurrentTimeZone() {
      return new Date().toString().match(/([-\+][0-9]+)\s/)[1];
    }
  }
});
