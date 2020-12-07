import Vue from 'vue';
import {
  REGEX_STRING_FORMAT_PATTERN,
  REGEX_REPLACE_ALL_DOT
} from '../constants/common/regex.js';
import {
  BACKGROUND_API_PARAM,
  API_PARAMS_SEPARATOR,
  API_URL_PARAM_SEPARATOR
} from '../constants/common/api-path';

import {DOT_CHARACTER_ENCODED} from '../constants/common/encode-characters';

Vue.mixin({
  methods: {
    convertTableHeaderMultiLanguage(inputData) {
      inputData.forEach(item => {
        if (item.text.indexOf('column-') === 0) {
          item.text = this.$i18n.t('table.header.' + item.text);
        }
      });
      return inputData;
    },
    /*
    This function puts the args insides stringFormat at the specific position,
    which specified {number}, with number increase from 0
    Ex: formatString('{0} is an {1}', 'This', 'example')
    Output: This is an example   
    */
    formatString(stringFormat, ...args) {
      return stringFormat.replace(REGEX_STRING_FORMAT_PATTERN, function(
        curlyBracket,
        index
      ) {
        return curlyBracket == '{{'
          ? '{'
          : curlyBracket == '}}'
          ? '}'
          : args[index];
      });
    },

    /*
      Because for some name (e.g. container name, database name...), it accepts "/" character.
      If we encode 1 time, spring boot will decode automatically and treat "/" character as
      URL character, not name of object. So we need to encode URL twice
     */
    formatStringEncode(stringFormat, ...args) {
      const encodedArgs = [];
      args.forEach(arg => {
        let encodedURI = encodeURIComponent(arg);
        encodedURI = encodedURI.replace(
          REGEX_REPLACE_ALL_DOT,
          DOT_CHARACTER_ENCODED
        );
        encodedArgs.push(encodeURIComponent(encodedURI));
      });
      return stringFormat.replace(REGEX_STRING_FORMAT_PATTERN, function(
        curlyBracket,
        index
      ) {
        return curlyBracket == '{{'
          ? '{'
          : curlyBracket == '}}'
          ? '}'
          : encodedArgs[index];
      });
    },
    appendBackgroundParam(apiPath) {
      return this.appendUrlParam(apiPath, BACKGROUND_API_PARAM);
    },
    appendUrlParam(apiPath, param) {
      if (apiPath.includes(API_URL_PARAM_SEPARATOR)) {
        return apiPath + API_PARAMS_SEPARATOR + param;
      } else {
        return apiPath + API_URL_PARAM_SEPARATOR + param;
      }
    },
    /*
    This function is used to convert file size from bytes to another type of file size.
    By default, this function will return a number with a limit of two numbers after a comma.
    */
    convertDataSize(bytes, sizesType) {
      const k = 1024;
      if (bytes < k) {
        // Get 2 decimal number
        return Math.round(bytes * 100) / 100 + ' ' + sizesType[0];
      }
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (
        // Get 2 decimal number
        Math.round(parseFloat(bytes / Math.pow(k, i)) * 100) / 100 +
        ' ' +
        sizesType[i]
      );
    },

    getTimeBetween(startTime, endTime) {
      return new Date(startTime.getTime() + Math.abs(endTime - startTime) / 2);
    },

    getEndTimeModified(startTime, endTime) {
      startTime = new Date(startTime);
      return new Date(
        startTime.getTime() + Math.abs(endTime - startTime) * 0.8
      );
    },

    modifiedEndTimeTwoData(startTime, endTime) {
      endTime = new Date(endTime);
      return new Date(endTime.getTime() + Math.abs(endTime - startTime) * 0.1);
    },

    collectTime(data) {
      const timeAllData = data.map(item => item.time);
      timeAllData[timeAllData.length - 1] = this.getEndTimeModified(
        timeAllData[0],
        timeAllData[timeAllData.length - 1]
      );

      const startTime = timeAllData[0];
      const endTime = timeAllData[timeAllData.length - 1];

      const timeBetween = this.getTimeBetween(startTime, endTime);

      let timeDataDisplay = [];
      if (timeAllData.length == 1) {
        timeDataDisplay = timeAllData;
      } else {
        timeDataDisplay[0] = startTime;
        timeDataDisplay[1] = timeBetween;
        timeDataDisplay[2] = endTime;
      }
      return timeDataDisplay;
    },

    /* This function is used to remove dupplicate item in an array */
    arrayUnique(array) {
      return [...new Set(array)];
    }
  }
});
