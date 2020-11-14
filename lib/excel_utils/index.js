'use strict';

function jsonToSheet(header = {}, data = []) {
    function number26(num) {
        let str = '';
        while (num > 0) {
            const m = num % 26 || 26;
            str = String.fromCharCode(64 + m) + str;
            num = (num - m) / 26;
        }
        return str;
    }

    const headerArray = Object.keys(header);
    const excelHeader = headerArray.reduce(
        (prev, next, index) =>
            Object.assign({}, prev, {
                [`${number26(index + 1)}1`]: { v: header[headerArray[index]] },
            }),
        {}
    );

    const excelData = {};
    data.forEach((d, i) => {
        Object.keys(d).forEach(k => {
            if (header[k]) {
                const poi = number26(headerArray.indexOf(k) + 1) + (i + 2);
                const v = d[k];
                excelData[poi] = { v };
            }
        });
    });

    const output = Object.assign({}, excelHeader, excelData);
    const ref = 'A1:' + number26(headerArray.length) + (data.length + 1);
    const sheet = Object.assign({}, output, { '!ref': ref });
    return sheet;
}

function jsonToWb(he, da) {
    const sheet = jsonToSheet(he, da);
    const wb = {
        SheetNames: [ 'Sheet1' ],
        Sheets: {
            Sheet1: sheet,
        },
    };

    return wb;
}

module.exports = { jsonToSheet, jsonToWb };
