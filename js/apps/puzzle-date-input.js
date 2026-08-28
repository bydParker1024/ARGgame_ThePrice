(function () {
  'use strict';

  window.normalizePuzzleDateInput = function (input) {
    var value = String(input == null ? '' : input).trim(), match;
    if (/^\d{8}$/.test(value)) match = [null, value.slice(0, 4), value.slice(4, 6), value.slice(6, 8)];
    else if ((match = value.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日$/)) === null) {
      match = value.match(/^(\d{4})\s*([/.-])\s*(\d{1,2})\s*\2\s*(\d{1,2})$/) || value.match(/^(\d{4})\s+(\d{1,2})\s+(\d{1,2})$/);
      if (match && match.length === 5) match = [null, match[1], match[3], match[4]];
    }
    if (!match) return null;
    var year = Number(match[1]), month = Number(match[2]), day = Number(match[3]), date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    if (year < 1 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return String(year).padStart(4, '0') + '/' + String(month).padStart(2, '0') + '/' + String(day).padStart(2, '0');
  };
}());
